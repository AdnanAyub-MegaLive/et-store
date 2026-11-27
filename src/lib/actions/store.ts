"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cols, isDuplicateKey, newId, nextOrderNumber } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { getContactContent } from "@/lib/home-content";
import { TAX_RATE } from "@/lib/format";
import { stripe } from "@/lib/stripe";
import type { FormState } from "./auth";

export async function subscribe(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("newsletter", 5, 60 * 60_000))) return { error: "Too many requests" };
  const parsed = z.string().trim().toLowerCase().email().max(254).safeParse(form.get("email"));
  if (!parsed.success) return { error: "Enter a valid email" };
  const { newsletter } = await cols();
  await newsletter.updateOne({ email: parsed.data }, { $setOnInsert: { _id: newId(), email: parsed.data, createdAt: new Date() } }, { upsert: true }).catch((e) => {
    if (!isDuplicateKey(e)) throw e;
  });
  return { ok: "You're subscribed!" };
}

export async function sendContactMessage(_: FormState, form: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Please enter your name").max(80),
      email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
      topic: z.string().trim().min(1).max(60),
      message: z.string().trim().min(10, "Message should be at least 10 characters").max(4000),
    })
    .safeParse({ name: form.get("name"), email: form.get("email"), topic: form.get("topic"), message: form.get("message") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const content = await getContactContent();
  if (!content.form.topics.includes(parsed.data.topic)) return { error: "Please choose a topic from the list." };
  if (!(await verifyTurnstile(form.get("cf-turnstile-response")))) return { error: "Please confirm you are not a robot." };
  await (await cols()).contactMessages.insertOne({ _id: newId(), ...parsed.data, read: false, createdAt: new Date() });
  revalidatePath("/admin", "layout");
  return { ok: content.form.successText };
}

export async function toggleFavorite(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "login" as const };
  const id = z.string().cuid().parse(productId);
  const { favorites } = await cols();
  const existing = await favorites.findOneAndDelete({ userId: user.id, productId: id });
  if (!existing)
    await favorites.insertOne({ _id: newId(), userId: user.id, productId: id, createdAt: new Date() }).catch((e) => {
      if (!isDuplicateKey(e)) throw e;
    });
  revalidatePath("/account");
  revalidatePath("/favorites");
  return { favorited: !existing };
}

/** Lightweight product lookup for the client-side cart (prices always come from the DB). */
export async function getCartProducts(ids: string[]) {
  const safe = z.array(z.string().cuid()).max(50).parse(ids);
  const { products, categories } = await cols();
  const list = await products.find({ _id: { $in: safe }, published: true }, { projection: { slug: 1, name: 1, image: 1, priceCents: 1, format: 1, categoryId: 1 } }).toArray();
  const cats = new Map((await categories.find({ _id: { $in: [...new Set(list.map((p) => p.categoryId))] } }).toArray()).map((c) => [c._id, c.name]));
  return list.map((p) => ({ id: p._id, slug: p.slug, name: p.name, image: p.image, priceCents: p.priceCents, format: p.format, category: { name: cats.get(p.categoryId) ?? "" } }));
}

const checkoutSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  country: z.string().trim().min(2).max(60),
  address: z.string().trim().min(3).max(200),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  zip: z.string().trim().min(3).max(12),
  items: z
    .array(z.object({ id: z.string().cuid(), qty: z.number().int().min(1).max(10) }))
    .min(1)
    .max(50),
});

export type CheckoutResult = { error?: string; url?: string };

export async function placeOrder(input: unknown): Promise<CheckoutResult> {
  if (!(await rateLimit("checkout", 10, 15 * 60_000))) return { error: "Too many attempts. Try again shortly." };
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { error: "Please fill in all required fields correctly." };
  const d = parsed.data;
  // Fail early (and clearly) instead of creating an order that can never be paid.
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[stripe] STRIPE_SECRET_KEY is empty in .env, so checkout is turned off.");
    return { error: "Online payment is not set up yet. Please try again later." };
  }

  // Never trust client prices: re-price everything from the database.
  const { products: productsCol, orders } = await cols();
  const products = (await productsCol.find({ _id: { $in: d.items.map((i) => i.id) }, published: true }, { projection: { priceCents: 1, name: 1 } }).toArray()).map((p) => ({ id: p._id, priceCents: p.priceCents, name: p.name }));
  if (products.length !== new Set(d.items.map((i) => i.id)).size) return { error: "Some items are no longer available." };

  const price = new Map(products.map((p) => [p.id, p.priceCents]));
  const names = new Map(products.map((p) => [p.id, p.name]));
  const subtotal = d.items.reduce((s, i) => s + price.get(i.id)! * i.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const user = await getCurrentUser();

  const order = {
      _id: newId(),
      number: await nextOrderNumber(),
      userId: user?.id ?? null,
      email: d.email,
      firstName: d.firstName,
      lastName: d.lastName,
      country: d.country,
      address: d.address,
      city: d.city,
      state: d.state,
      zip: d.zip,
      subtotal,
      tax,
      total: subtotal + tax,
      status: "PENDING" as const,
      stripeSessionId: null,
      stripePaymentIntentId: null,
      paidAt: null,
      items: d.items.map((i) => ({ id: newId(), productId: i.id, quantity: i.qty, priceCents: price.get(i.id)! })),
      createdAt: new Date(),
  };
  await orders.insertOne(order);
  const orderId = order._id;

  // Hosted Stripe Checkout: card data never touches our servers. The order is marked PAID only by the webhook.
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  try {
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        customer_email: d.email,
        client_reference_id: orderId,
        metadata: { orderId },
        payment_intent_data: { metadata: { orderId } },
        line_items: [
          ...d.items.map((i) => ({
            quantity: i.qty,
            price_data: { currency: "usd", unit_amount: price.get(i.id)!, product_data: { name: names.get(i.id)! } },
          })),
          { quantity: 1, price_data: { currency: "usd", unit_amount: tax, product_data: { name: "Tax" } } },
        ].filter((l) => l.price_data.unit_amount > 0),
        success_url: `${appUrl}/checkout/success?order=${order.number}`,
        cancel_url: `${appUrl}/checkout?canceled=1`,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      },
      { idempotencyKey: `order-${orderId}` },
    );
    await orders.updateOne({ _id: orderId }, { $set: { stripeSessionId: session.id } });
    revalidatePath("/admin");
    return { url: session.url! };
  } catch (e) {
    console.error("[stripe] session create failed", e);
    await orders.updateOne({ _id: orderId }, { $set: { status: "CANCELLED" } });
    return { error: "Payment could not be started. Please try again." };
  }
}
