import { z } from "zod"

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  image: z.string().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
})

export const productSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
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
  status: z.enum(["PAID", "PRODUCTION", "SHIPPED", "DELIVERED", "CANCELLED"]),
})

export const orderTrackingSchema = z.object({
  id: z.string().min(1),
  trackingUrl: z.string().url().or(z.literal("")).optional().nullable(),
})
