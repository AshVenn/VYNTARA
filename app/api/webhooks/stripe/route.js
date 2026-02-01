import { NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"

const stripeSecret = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const stripe = stripeSecret ? new Stripe(stripeSecret) : null

export const runtime = "nodejs"

export async function POST(request) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"

  if (!checkRateLimit(`stripe:${ip}`, { limit: 120, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 })
  }

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get("stripe-signature")

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const orderId = session.metadata?.orderId || session.client_reference_id

        if (!orderId) break

        const payment = await prisma.payment.findFirst({
          where: { stripeCheckoutSessionId: session.id },
        })

        if (payment?.lastEventId === event.id) {
          return NextResponse.json({ received: true })
        }

        const updates = []

        if (payment) {
          updates.push(
            prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: "PAID",
                stripePaymentIntentId: session.payment_intent || payment.stripePaymentIntentId,
                lastEventId: event.id,
                rawPayload: event,
              },
            }),
          )
        } else {
          updates.push(
            prisma.payment.create({
              data: {
                orderId,
                provider: "stripe",
                amountCents: session.amount_total || 0,
                currency: (session.currency || "usd").toUpperCase(),
                status: "PAID",
                stripeCheckoutSessionId: session.id,
                stripePaymentIntentId: session.payment_intent || null,
                lastEventId: event.id,
                rawPayload: event,
              },
            }),
          )
        }

        updates.push(
          prisma.order.update({
            where: { id: orderId },
            data: {
              status: "PAID",
              paymentStatus: "PAID",
            },
          }),
        )

        // adjust inventory (reserved -> stock decrease)
        const orderItems = await prisma.orderItem.findMany({ where: { orderId } })
        for (const item of orderItems) {
          updates.push(
            prisma.productVariant.update({
              where: { id: item.variantId },
              data: {
                reservedQty: { decrement: item.qty },
                stockQty: { decrement: item.qty },
              },
            }),
          )
        }

        updates.push(
          prisma.orderEvent.create({
            data: {
              orderId,
              type: "PAID",
              message: "Stripe payment confirmed",
            },
          }),
        )

        await prisma.$transaction(updates)
        break
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object
        const payment = await prisma.payment.findFirst({
          where: { stripePaymentIntentId: intent.id },
        })
        if (!payment) break

        if (payment.lastEventId === event.id) {
          return NextResponse.json({ received: true })
        }

        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED", lastEventId: event.id, rawPayload: event },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: "FAILED" },
          }),
          // release reserved stock
          ...(await (async () => {
            const orderItems = await prisma.orderItem.findMany({ where: { orderId: payment.orderId } })
            return orderItems.map((item) =>
              prisma.productVariant.update({
                where: { id: item.variantId },
                data: { reservedQty: { decrement: item.qty } },
              }),
            )
          })()),
          prisma.orderEvent.create({
            data: {
              orderId: payment.orderId,
              type: "EXCEPTION",
              message: "Payment failed",
            },
          }),
        ])
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error("Stripe webhook error:", err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
