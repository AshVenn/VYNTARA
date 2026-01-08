"use server"

import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-guards"
import { checkoutSchema } from "@/lib/validators/checkout"

const shippingCostMap = {
  standard: 1000,
  express: 2000,
  pickup: 0,
}

export async function createOrder(payload) {
  const session = await requireAuth()
  const parsed = checkoutSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Invalid checkout data")
  }

  const { items, shippingMethod, address } = parsed.data

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: items.map((item) => item.variantId) } },
  })

  const variantMap = new Map(variants.map((variant) => [variant.id, variant]))

  const orderItems = items.map((item) => {
    const variant = variantMap.get(item.variantId)
    if (!variant) {
      throw new Error("Variant not found")
    }
    return {
      productId: variant.productId,
      variantId: variant.id,
      qty: item.qty,
      priceCents: variant.priceCents,
    }
  })

  const subtotalCents = orderItems.reduce((sum, item) => sum + item.priceCents * item.qty, 0)
  const shippingCents = shippingCostMap[shippingMethod] ?? 0
  const taxCents = Math.round(subtotalCents * 0.09)
  const totalCents = subtotalCents + shippingCents + taxCents

  await prisma.address.create({
    data: {
      userId: session.user.id,
      label: "Default",
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || null,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
    },
  })

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PAID",
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      items: {
        create: orderItems,
      },
    },
  })

  return { orderId: order.id }
}
