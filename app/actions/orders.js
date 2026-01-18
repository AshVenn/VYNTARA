"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-guards"

const orderIdSchema = z.object({
  orderId: z.string().min(1),
})

export async function markAddressUpdated(formData) {
  const session = await requireAuth()
  const parsed = orderIdSchema.safeParse({
    orderId: formData.get("orderId"),
  })

  if (!parsed.success) {
    throw new Error("Invalid order id")
  }

  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId, userId: session.user.id },
  })

  if (!order) {
    throw new Error("Order not found")
  }

  if (order.addressValidationStatus !== "VALID") {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { addressValidationStatus: "CLIENT_UPDATED" },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "NOTE",
          message: "Customer updated shipping address and requested revalidation.",
        },
      }),
    ])
  }

  revalidatePath(`/account/orders/${order.id}`)
  revalidatePath(`/admin/orders/${order.id}`)
  redirect(`/account/orders/${order.id}`)
}
