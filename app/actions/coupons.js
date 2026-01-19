"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import { isCouponActive, normalizeCouponCode } from "@/lib/coupons"

const couponCodeSchema = z.string().min(3).max(32)

export async function validateCoupon(code) {
  const normalized = normalizeCouponCode(code)
  const parsed = couponCodeSchema.safeParse(normalized)
  if (!parsed.success) {
    return { success: false, error: "Invalid coupon code" }
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: parsed.data },
  })

  if (!coupon || !isCouponActive(coupon)) {
    return { success: false, error: "Coupon is not available" }
  }

  return {
    success: true,
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  }
}
