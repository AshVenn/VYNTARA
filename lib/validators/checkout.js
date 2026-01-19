import { z } from "zod"

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().optional().nullable(),
  line1: z.string().min(2),
  line2: z.string().optional().nullable(),
  city: z.string().min(2),
  region: z.string().min(2),
  postalCode: z.string().min(2),
  country: z.string().min(2),
  email: z.string().email().optional(),
})

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
  existingAddressId: z.string().optional().nullable(),
  address: addressSchema.optional().nullable(),
  couponCode: z.string().optional().nullable(),
}).refine(
  (data) => data.existingAddressId || data.address,
  { message: "Either an existing address or new address is required" }
)
