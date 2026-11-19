"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { TAX_RATE } from "@/lib/format";
import { stripe } from "@/lib/stripe";
import type { FormState } from "./auth";

export async function subscribe(_: FormState, form: FormData): Promise<FormState> {
  if (!(await rateLimit("newsletter", 5, 60 * 60_000))) return { error: "Too many requests" };
  const parsed = z.string().trim().toLowerCase().email().max(254).safeParse(form.get("email"));
  if (!parsed.success) return { error: "Enter a valid email" };
  await db.newsletterSubscriber.upsert({ where: { email: parsed.data }, create: { email: parsed.data }, update: {} });
  return { ok: "You're subscribed!" };
}

const CONTACT_TOPICS = ["General question", "Order or download", "Refund request", "Licensing", "Become a creator", "Other"] as const;

export async function sendContactMessage(_: FormState, form: FormData): Promise<FormState> {
  // Honeypot: real visitors never see or fill this field.
  if (form.get("company")) return { ok: "Thanks! We'll get back to you soon." };
  if (!(await rateLimit("contact", 5, 60 * 60_000))) return { error: "Too many messages. Please try again later." };
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Please enter your name").max(80),
      email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
      topic: z.enum(CONTACT_TOPICS),
      message: z.string().trim().min(10, "Message should be at least 10 characters").max(4000),
    })
    .safeParse({ name: form.get("name"), email: form.get("email"), topic: form.get("topic"), message: form.get("message") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.contactMessage.create({ data: parsed.data });
  revalidatePath("/admin", "layout");
  return { ok: "Thanks! Your message is on its way. We usually reply within 1 business day." };
}

export async function toggleFavorite(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "login" as const };
  const id = z.string().cuid().parse(productId);
  const key = { userId_productId: { userId: user.id, productId: id } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) await db.favorite.delete({ where: key });
  else await db.favorite.create({ data: { userId: user.id, productId: id } });
  revalidatePath("/account");
  revalidatePath("/favorites");
  return { favorited: !existing };
}

/** Lightweight product lookup for the client-side cart (prices always come from the DB). */
export async function getCartProducts(ids: string[]) {
  const safe = z.array(z.string().cuid()).max(50).parse(ids);
  return db.product.findMany({
    where: { id: { in: safe }, published: true },
    select: { id: true, slug: true, name: true, image: true, priceCents: true, format: true, category: { select: { name: true } } },
  });
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
  const products = await db.product.findMany({
    where: { id: { in: d.items.map((i) => i.id) }, published: true },
    select: { id: true, priceCents: true, name: true },
  });
  if (products.length !== new Set(d.items.map((i) => i.id)).size) return { error: "Some items are no longer available." };

  const price = new Map(products.map((p) => [p.id, p.priceCents]));
  const names = new Map(products.map((p) => [p.id, p.name]));
  const subtotal = d.items.reduce((s, i) => s + price.get(i.id)! * i.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const user = await getCurrentUser();

  const order = await db.order.create({
    data: {
      userId: user?.id,
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
      status: "PENDING",
      items: { create: d.items.map((i) => ({ productId: i.id, quantity: i.qty, priceCents: price.get(i.id)! })) },
    },
    select: { id: true, number: true },
  });

  // Hosted Stripe Checkout: card data never touches our servers. The order is marked PAID only by the webhook.
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  try {
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        customer_email: d.email,
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        payment_intent_data: { metadata: { orderId: order.id } },
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
      { idempotencyKey: `order-${order.id}` },
    );
    await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    revalidatePath("/admin");
    return { url: session.url! };
  } catch (e) {
    console.error("[stripe] session create failed", e);
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    return { error: "Payment could not be started. Please try again." };
  }
}
