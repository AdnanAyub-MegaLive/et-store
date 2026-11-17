import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

// Stripe -> us. The signature check is what makes this trustworthy; never mark orders paid from the browser.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object;
      if (s.payment_status !== "paid") break;
      const order = await db.order.findUnique({ where: { stripeSessionId: s.id } });
      // Amount check guards against a session being tampered with or mismatched.
      if (!order || order.status === "PAID" || s.amount_total !== order.total || s.currency !== "usd") {
        if (order && s.amount_total !== order.total) console.error("[stripe] amount mismatch", order.id, s.amount_total, order.total);
        break;
      }
      await db.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          stripePaymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id,
        },
      });
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await db.order.updateMany({ where: { stripeSessionId: event.data.object.id, status: "PENDING" }, data: { status: "CANCELLED" } });
      break;
    case "charge.refunded": {
      const c = event.data.object;
      const pi = typeof c.payment_intent === "string" ? c.payment_intent : c.payment_intent?.id;
      if (pi && c.refunded) await db.order.updateMany({ where: { stripePaymentIntentId: pi }, data: { status: "REFUNDED" } });
      break;
    }
  }
  revalidatePath("/admin", "layout");
  return NextResponse.json({ received: true });
}
