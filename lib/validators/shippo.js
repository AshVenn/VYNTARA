import { z } from "zod"

export const orderIdSchema = z.object({
  orderId: z.string().min(1),
})

export const ratePurchaseSchema = z.object({
  orderId: z.string().min(1),
  rateId: z.string().min(1),
  shipmentId: z.string().optional().nullable(),
})

export const shipmentActionSchema = z.object({
  orderId: z.string().min(1),
  shipmentId: z.string().optional().nullable(),
})
