"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { getCloudinaryConfig, signCloudinaryParams } from "@/lib/cloudinary"
import {
  categorySchema,
  productSchema,
  productVariantSchema,
  orderStatusSchema,
  orderTrackingSchema,
} from "@/lib/validators/admin"

const parseList = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : []

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return

  try {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = signCloudinaryParams({ public_id: publicId, timestamp }, apiSecret)

    const formData = new FormData()
    formData.append("public_id", publicId)
    formData.append("api_key", apiKey)
    formData.append("timestamp", timestamp.toString())
    formData.append("signature", signature)

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData,
    })
  } catch (error) {
    console.error(error)
  }
}

const parseVariants = (value) => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

const buildToastRedirect = (target, message, type = "success") => {
  if (!target) return `/admin?toast=${message}`
  const separator = target.includes("?") ? "&" : "?"
  return `${target}${separator}toast=${message}&toastType=${type}`
}

export async function createCategory(formData) {
  await requireRole("ADMIN")
  const imageValue = formData.get("image") || formData.get("imageManual") || null
  const returnTo = formData.get("returnTo")
  const payload = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image: imageValue,
    imagePublicId: formData.get("imagePublicId") || null,
  }
  const parsed = categorySchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Invalid category data")
  }

  await prisma.category.create({ data: parsed.data })
  revalidatePath("/admin/categories")
  revalidatePath("/")
  redirect(buildToastRedirect(returnTo || "/admin/categories", "Category%20created"))
}

export async function updateCategory(formData) {
  await requireRole("ADMIN")
  const imageValue = formData.get("image") || formData.get("imageManual") || null
  const returnTo = formData.get("returnTo")
  const payload = {
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    image: imageValue,
    imagePublicId: formData.get("imagePublicId") || null,
  }
  const parsed = categorySchema.safeParse(payload)
  if (!parsed.success || !parsed.data.id) {
    throw new Error("Invalid category data")
  }

  const existing = await prisma.category.findUnique({ where: { id: parsed.data.id } })

  await prisma.category.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      image: parsed.data.image,
      imagePublicId: parsed.data.imagePublicId,
    },
  })

  if (existing?.imagePublicId && existing.imagePublicId !== parsed.data.imagePublicId) {
    await deleteCloudinaryImage(existing.imagePublicId)
  }
  revalidatePath("/admin/categories")
  revalidatePath("/")
  redirect(buildToastRedirect(returnTo || "/admin/categories", "Category%20updated"))
}

export async function deleteCategory(formData) {
  await requireRole("ADMIN")
  const id = formData.get("id")
  const returnTo = formData.get("returnTo")
  if (!id) {
    throw new Error("Missing category id")
  }
  const existing = await prisma.category.findUnique({ where: { id } })
  await prisma.category.delete({ where: { id } })
  if (existing?.imagePublicId) {
    await deleteCloudinaryImage(existing.imagePublicId)
  }
  revalidatePath("/admin/categories")
  revalidatePath("/")
  redirect(buildToastRedirect(returnTo || "/admin/categories", "Category%20deleted", "warning"))
}

export async function createProduct(formData) {
  await requireRole("ADMIN")
  const imagesValue = formData.get("images") || formData.get("imagesManual") || ""
  const returnTo = formData.get("returnTo")
  const payload = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    tags: parseList(formData.get("tags")),
    images: parseList(imagesValue),
    imagesPublicIds: parseList(formData.get("imagesPublicIds")),
    featured: formData.get("featured") === "on",
    bestSelling: formData.get("bestSelling") === "on",
  }
  const variantsInput = parseVariants(formData.get("variants"))
  const parsed = productSchema.safeParse(payload)
  const parsedVariants = variantsInput.map((variant) => productVariantSchema.safeParse(variant))

  if (!parsed.success || parsedVariants.some((variant) => !variant.success)) {
    throw new Error("Invalid product data")
  }

  const variants = parsedVariants.map((variant) => variant.data)

  await prisma.product.create({
    data: {
      ...parsed.data,
      variants: {
        create: variants,
      },
    },
  })
  revalidatePath("/admin/products")
  revalidatePath("/")
  redirect(buildToastRedirect(returnTo || "/admin/products", "Product%20created"))
}

export async function updateProduct(formData) {
  await requireRole("ADMIN")
  const imagesValue = formData.get("images") || formData.get("imagesManual") || ""
  const returnTo = formData.get("returnTo")
  const payload = {
    id: formData.get("id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    tags: parseList(formData.get("tags")),
    images: parseList(imagesValue),
    imagesPublicIds: parseList(formData.get("imagesPublicIds")),
    featured: formData.get("featured") === "on",
    bestSelling: formData.get("bestSelling") === "on",
  }
  const variantsInput = parseVariants(formData.get("variants"))
  const parsed = productSchema.safeParse(payload)
  const parsedVariants = variantsInput.map((variant) => productVariantSchema.safeParse(variant))

  if (!parsed.success || !parsed.data.id || parsedVariants.some((variant) => !variant.success)) {
    throw new Error("Invalid product data")
  }

  const variants = parsedVariants.map((variant) => variant.data)

  const existing = await prisma.product.findUnique({ where: { id: parsed.data.id } })

  await prisma.product.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      tags: parsed.data.tags,
      images: parsed.data.images,
      imagesPublicIds: parsed.data.imagesPublicIds,
      featured: parsed.data.featured,
      bestSelling: parsed.data.bestSelling,
      variants: {
        deleteMany: {},
        create: variants,
      },
    },
  })

  if (existing?.imagesPublicIds?.length) {
    const removed = existing.imagesPublicIds.filter((id) => !parsed.data.imagesPublicIds.includes(id))
    await Promise.all(removed.map((id) => deleteCloudinaryImage(id)))
  }
  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${parsed.data.id}/edit`)
  revalidatePath("/")
  redirect(buildToastRedirect(returnTo || `/admin/products/${parsed.data.id}/edit`, "Product%20updated"))
}

export async function deleteProduct(formData) {
  await requireRole("ADMIN")
  const id = formData.get("id")
  const returnTo = formData.get("returnTo")
  if (!id) {
    throw new Error("Missing product id")
  }
  const existing = await prisma.product.findUnique({ where: { id } })
  await prisma.product.delete({ where: { id } })
  if (existing?.imagesPublicIds?.length) {
    await Promise.all(existing.imagesPublicIds.map((imageId) => deleteCloudinaryImage(imageId)))
  }
  revalidatePath("/admin/products")
  revalidatePath("/")
  redirect(buildToastRedirect(returnTo || "/admin/products", "Product%20deleted", "warning"))
}

export async function updateOrderStatus(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  const payload = {
    id: formData.get("id"),
    status: formData.get("status"),
  }
  const parsed = orderStatusSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Invalid status")
  }
  await prisma.order.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  })
  revalidatePath(`/admin/orders/${parsed.data.id}`)
  revalidatePath("/admin/orders")
  redirect(buildToastRedirect(returnTo || `/admin/orders/${parsed.data.id}`, "Order%20status%20updated"))
}

export async function updateOrderTracking(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  const payload = {
    id: formData.get("id"),
    trackingUrl: formData.get("trackingUrl"),
  }
  const parsed = orderTrackingSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Invalid tracking URL")
  }
  await prisma.order.update({
    where: { id: parsed.data.id },
    data: {
      trackingUrl: parsed.data.trackingUrl || null,
    },
  })
  revalidatePath(`/admin/orders/${parsed.data.id}`)
  revalidatePath("/admin/orders")
  redirect(buildToastRedirect(returnTo || `/admin/orders/${parsed.data.id}`, "Tracking%20updated"))
}
