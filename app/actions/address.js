"use server"

import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-guards"
import { revalidatePath } from "next/cache"
import { validateAddress } from "@/lib/shippo"
import { z } from "zod"

const MAX_ADDRESSES = 4

const addressSchema = z.object({
  label: z.string().min(1, "Label is required").max(50),
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().optional(),
  line1: z.string().min(1, "Street address is required").max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  region: z.string().min(1, "State/Region is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
})

export async function getUserAddresses() {
  const session = await requireAuth()
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
  return addresses
}

export async function createAddress(data) {
  const session = await requireAuth()
  
  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || "Invalid address data" }
  }

  const existingCount = await prisma.address.count({
    where: { userId: session.user.id },
  })

  if (existingCount >= MAX_ADDRESSES) {
    return { 
      success: false, 
      error: `You can only have up to ${MAX_ADDRESSES} saved addresses. Please delete one before adding a new one.` 
    }
  }

  const address = await prisma.address.create({
    data: {
      userId: session.user.id,
      label: parsed.data.label,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      city: parsed.data.city,
      region: parsed.data.region,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
    },
  })

  revalidatePath("/checkout")
  revalidatePath("/account/profile")
  
  return { success: true, address }
}

export async function updateAddress(id, data) {
  const session = await requireAuth()
  
  const parsed = addressSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || "Invalid address data" }
  }

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return { success: false, error: "Address not found" }
  }

  const address = await prisma.address.update({
    where: { id },
    data: {
      label: parsed.data.label,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      city: parsed.data.city,
      region: parsed.data.region,
      postalCode: parsed.data.postalCode,
      country: parsed.data.country,
    },
  })

  revalidatePath("/checkout")
  revalidatePath("/account/profile")
  
  return { success: true, address }
}

export async function deleteAddress(id) {
  const session = await requireAuth()

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return { success: false, error: "Address not found" }
  }

  await prisma.address.delete({
    where: { id },
  })

  revalidatePath("/checkout")
  revalidatePath("/account/profile")
  
  return { success: true }
}

export async function validateUserAddress(data) {
  const session = await requireAuth()

  try {
    const result = await validateAddress({
      name: data.fullName,
      street1: data.line1,
      street2: data.line2 || "",
      city: data.city,
      state: data.region,
      zip: data.postalCode,
      country: data.country,
      phone: data.phone || "",
      email: session.user.email,
    })

    if (!result.validation_results?.is_valid) {
      const messages = result.validation_results?.messages || []
      const errorMessage = messages.find((m) => m.type === "error")?.text || "Address validation failed"
      return { 
        success: false, 
        error: errorMessage,
        suggestions: result.validation_results?.suggested_address || null
      }
    }

    return { 
      success: true, 
      validated: true,
      suggestedAddress: result.validation_results?.suggested_address || null
    }
  } catch (error) {
    console.error("Address validation error:", error)
    return { success: false, error: "Unable to validate address. Please check your details." }
  }
}
