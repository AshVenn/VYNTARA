export const normalizeCouponCode = (code) => {
  if (typeof code !== "string") return ""
  return code.trim().toUpperCase()
}

export const isCouponActive = (coupon, now = new Date()) => {
  if (!coupon?.isActive) return false
  if (coupon.startsAt && now < coupon.startsAt) return false
  if (coupon.endsAt && now > coupon.endsAt) return false
  return true
}

export const calculateCouponDiscount = (subtotalCents, coupon) => {
  if (!coupon || subtotalCents <= 0) return 0
  if (coupon.discountType === "PERCENT") {
    const percent = Math.max(0, Math.min(100, coupon.discountValue))
    return Math.round(subtotalCents * (percent / 100))
  }
  const amount = Math.max(0, coupon.discountValue)
  return Math.min(subtotalCents, amount)
}
