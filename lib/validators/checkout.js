import { z } from "zod"

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
  shippingMethod: z.enum(["standard", "express", "pickup"]).default("standard"),
  address: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(5),
    line1: z.string().min(2),
    line2: z.string().optional().nullable(),
    city: z.string().min(2),
    region: z.string().min(2),
    postalCode: z.string().min(2),
    country: z.string().min(2),
    email: z.string().email(),
  }),
})
