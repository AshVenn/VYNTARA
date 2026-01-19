"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-guards"
import { checkoutSchema } from "@/lib/validators/checkout"
import { getStoreSettings } from "@/app/actions/store-settings"
import { calculateCouponDiscount, isCouponActive, normalizeCouponCode } from "@/lib/coupons"

const MAX_ADDRESSES = 4

function normalizeOptional(value) {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

export async function createOrder(payload) {
  const session = await requireAuth()
  const parsed = checkoutSchema.safeParse(payload)

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message || "Invalid checkout payload")
  }

  const { items, shippingMethod, existingAddressId, address, couponCode } = parsed.data

  const variantIds = items.map((item) => item.variantId)
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, productId: true, priceCents: true, available: true },
  })

  if (variants.length !== variantIds.length) {
    throw new Error("One or more items are no longer available")
  }

  const variantMap = new Map(variants.map((variant) => [variant.id, variant]))

  for (const item of items) {
    const variant = variantMap.get(item.variantId)
    if (!variant || variant.productId !== item.productId) {
      throw new Error("Invalid item selection")
    }
    if (!variant.available) {
      throw new Error("One or more items are out of stock")
    }
  }

  const subtotalCents = items.reduce((sum, item) => {
    const variant = variantMap.get(item.variantId)
    return sum + variant.priceCents * item.qty
  }, 0)

  const settings = await getStoreSettings()
  const baseShippingCents =
    shippingMethod === "express"
      ? settings.shippingExpressCents
      : shippingMethod === "standard"
        ? settings.shippingStandardCents
        : settings.shippingPickupCents
  const qualifiesFreeShipping =
    shippingMethod === "standard" &&
    settings.freeShippingThresholdCents > 0 &&
    subtotalCents >= settings.freeShippingThresholdCents
  const shippingCents = qualifiesFreeShipping ? 0 : baseShippingCents

  let coupon = null
  let couponDiscountCents = 0
  const normalizedCouponCode = normalizeCouponCode(couponCode)
  if (normalizedCouponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCouponCode },
    })
    if (!coupon || !isCouponActive(coupon)) {
      throw new Error("Invalid coupon code")
    }
    couponDiscountCents = calculateCouponDiscount(subtotalCents, coupon)
  }

  const discountedSubtotalCents = Math.max(0, subtotalCents - couponDiscountCents)
  const taxCents = Math.round(discountedSubtotalCents * 0.09)
  const totalCents = discountedSubtotalCents + shippingCents + taxCents

  const order = await prisma.$transaction(async (tx) => {
    let shippingAddressId = normalizeOptional(existingAddressId) || null

    if (shippingAddressId) {
      const existing = await tx.address.findFirst({
        where: { id: shippingAddressId, userId: session.user.id },
      })
      if (!existing) {
        throw new Error("Shipping address not found")
      }
    } else if (address) {
      const existingCount = await tx.address.count({
        where: { userId: session.user.id },
      })
      if (existingCount >= MAX_ADDRESSES) {
        throw new Error(`You can only have up to ${MAX_ADDRESSES} saved addresses.`)
      }

      const normalized = {
        label: normalizeOptional(address.label) || null,
        fullName: address.fullName.trim(),
        phone: normalizeOptional(address.phone) || null,
        line1: address.line1.trim(),
        line2: normalizeOptional(address.line2) || null,
        city: address.city.trim(),
        region: address.region.trim(),
        postalCode: address.postalCode.trim(),
        country: address.country.trim(),
      }

      const created = await tx.address.create({
        data: {
          userId: session.user.id,
          ...normalized,
        },
      })
      shippingAddressId = created.id
    } else {
      throw new Error("Shipping address is required")
    }

    return tx.order.create({
      data: {
        userId: session.user.id,
        shippingAddressId,
        couponId: coupon?.id || null,
        couponCode: normalizedCouponCode || null,
        couponDiscountCents,
        subtotalCents,
        shippingCents,
        taxCents,
        totalCents,
        items: {
          create: items.map((item) => {
            const variant = variantMap.get(item.variantId)
            return {
              productId: item.productId,
              variantId: item.variantId,
              qty: item.qty,
              priceCents: variant.priceCents,
            }
          }),
        },
        events: {
          create: {
            type: "ORDER_PLACED",
            message: "Order placed",
          },
        },
      },
    })
  })

  revalidatePath("/account/orders")
  revalidatePath("/admin/orders")

  return { orderId: order.id }
}
