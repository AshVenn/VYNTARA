import { NextResponse } from "next/server"
import Stripe from "stripe"
import prisma from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { createOrder } from "@/app/actions/checkout"

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret) : null

export const runtime = "nodejs"

export async function POST(request) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"

  if (!checkRateLimit(`checkout:${ip}`, { limit: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()

    // Create order in pending_payment
    const { orderId } = await createOrder(body)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const amountCents = order.totalCents
    const currency = (order.currency || "USD").toLowerCase()

    const successUrl = `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/checkout/success?orderId=${orderId}`
    const cancelUrl = `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/checkout`

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: orderId,
      metadata: { orderId },
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: `Order ${orderId}` },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    const existingPayment = await prisma.payment.findFirst({
      where: { orderId, provider: "stripe" },
    })

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amountCents,
          currency: order.currency || "USD",
          status: "REQUIRES_PAYMENT",
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
        },
      })
    } else {
      await prisma.payment.create({
        data: {
          orderId,
          provider: "stripe",
          amountCents,
          currency: order.currency || "USD",
          status: "REQUIRES_PAYMENT",
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
        },
      })
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout session error:", error)
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 })
  }
}
