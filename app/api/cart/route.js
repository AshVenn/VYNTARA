import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ items: [] })
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  })

  if (!cart) return NextResponse.json({ items: [] })

  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    qty: item.qty,
    priceCents: item.variant.priceCents,
    productTitle: item.product.title,
    productImage: item.product.images[0] || null,
    variant: {
      size: item.variant.size,
      color: item.variant.color,
      fit: item.variant.fit,
    },
  }))

  return NextResponse.json({ items })
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"

  if (!checkRateLimit(`cart:${ip}`, { limit: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const body = await request.json()
  const items = Array.isArray(body.items) ? body.items : []

  const cart = await prisma.cart.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      items: {
        create: [],
      },
    },
    update: {},
  })

  // Replace cart items atomically
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
    prisma.cartItem.createMany({
      data: items.map((item) => ({
        cartId: cart.id,
        productId: item.productId,
        variantId: item.variantId,
        qty: item.qty,
      })),
    }),
  ])

  return NextResponse.json({ ok: true })
}
