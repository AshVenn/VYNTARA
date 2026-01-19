"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"

const SETTINGS_ID = "default"

const defaultSettings = {
  shippingStandardCents: 1000,
  shippingExpressCents: 2000,
  shippingPickupCents: 0,
  freeShippingThresholdCents: 10000,
}

const settingsSchema = z.object({
  shippingStandardCents: z.number().int().min(0).max(1000000),
  shippingExpressCents: z.number().int().min(0).max(1000000),
  shippingPickupCents: z.number().int().min(0).max(1000000),
  freeShippingThresholdCents: z.number().int().min(0).max(100000000),
})

const parseMoneyToCents = (value) => {
  if (value === null || value === undefined || value === "") return null
  const amount = Number(value)
  if (!Number.isFinite(amount)) return null
  return Math.round(amount * 100)
}

export async function getStoreSettings() {
  return prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: {
      id: SETTINGS_ID,
      ...defaultSettings,
    },
    select: {
      shippingStandardCents: true,
      shippingExpressCents: true,
      shippingPickupCents: true,
      freeShippingThresholdCents: true,
    },
  })
}

export async function updateStoreSettings(formData) {
  await requireRole("ADMIN")
  const existing = await getStoreSettings()

  const shippingStandardCents = parseMoneyToCents(formData.get("shippingStandard"))
  const shippingExpressCents = parseMoneyToCents(formData.get("shippingExpress"))
  const freeShippingThresholdCents = parseMoneyToCents(formData.get("freeShippingThreshold"))

  if (shippingStandardCents === null || shippingExpressCents === null || freeShippingThresholdCents === null) {
    throw new Error("Invalid shipping settings")
  }

  const payload = {
    shippingStandardCents,
    shippingExpressCents,
    shippingPickupCents: existing.shippingPickupCents,
    freeShippingThresholdCents,
  }

  const parsed = settingsSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Invalid shipping settings")
  }

  await prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    update: parsed.data,
    create: {
      id: SETTINGS_ID,
      ...parsed.data,
    },
  })

  revalidatePath("/admin/settings")
  revalidatePath("/checkout")
  revalidatePath("/cart")
}
