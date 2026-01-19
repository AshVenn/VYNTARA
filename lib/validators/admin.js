import { z } from "zod"

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(80).regex(slugRegex),
  description: z.string().min(20).max(160),
  image: z.string().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
})

export const productSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(70),
  slug: z.string().min(3).max(100).regex(slugRegex),
  description: z.string().min(50).max(500),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).min(1).default([]),
  imagesPublicIds: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  bestSelling: z.boolean().default(false),
})

export const productVariantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  fit: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  sku: z.string().min(3),
  available: z.boolean().default(true),
})

export const orderStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED", "CANCELLED"]),
})

export const orderTrackingSchema = z.object({
  id: z.string().min(1),
  trackingUrl: z.string().url().or(z.literal("")).optional().nullable(),
})

export const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(3).max(32).regex(/^[A-Z0-9-]+$/),
  description: z.string().max(200).optional().nullable(),
  discountType: z.enum(["PERCENT", "AMOUNT"]),
  discountValue: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.discountType === "PERCENT" && (data.discountValue < 1 || data.discountValue > 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percent discounts must be between 1 and 100.",
      path: ["discountValue"],
    })
  }
  if (data.discountType === "AMOUNT" && data.discountValue < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount discounts must be at least $0.01.",
      path: ["discountValue"],
    })
  }
})
