"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { requireRole } from "@/lib/auth-guards"
import { getCloudinaryConfig, signCloudinaryParams } from "@/lib/cloudinary"
import { z } from "zod"
import {
  categorySchema,
  productSchema,
  productVariantSchema,
  couponSchema,
  orderStatusSchema,
  orderTrackingSchema,
} from "@/lib/validators/admin"
import { orderIdSchema, ratePurchaseSchema, shipmentActionSchema } from "@/lib/validators/shippo"
import { buyLabel, createShipment, getShippoAddressFromEnv, validateAddress, trackShipment } from "@/lib/shippo"

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
    if (isRedirect(error)) {
      throw error
    }
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

const parseDiscountValue = (discountType, value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return null
  if (discountType === "PERCENT") return Math.round(amount)
  return Math.round(amount * 100)
}

const buildToastRedirect = (target, message, type = "success") => {
  if (!target) return `/admin?toast=${message}`
  const separator = target.includes("?") ? "&" : "?"
  return `${target}${separator}toast=${message}&toastType=${type}`
}

const toToastMessage = (message, fallback = "Something went wrong") =>
  encodeURIComponent(message || fallback)

const isRedirect = (error) => {
  if (!error) return false
  const digest = typeof error === "object" ? error.digest : null
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")
}

const buildShippoAddressTo = (order) => {
  const address = order.shippingAddress
  if (!address) {
    throw new Error("Order is missing a shipping address.")
  }
  return {
    name: address.fullName,
    street1: address.line1,
    street2: address.line2 || undefined,
    city: address.city,
    state: address.region,
    zip: address.postalCode,
    country: address.country,
    phone: address.phone || undefined,
    email: order.user?.email || undefined,
  }
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

export async function createCoupon(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  const payload = {
    code: String(formData.get("code") || "").trim().toUpperCase(),
    description: formData.get("description") || null,
    discountType: formData.get("discountType"),
    discountValue: parseDiscountValue(formData.get("discountType"), formData.get("discountValue")),
    isActive: formData.get("isActive") === "on",
  }
  const parsed = couponSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Invalid coupon data")
  }

  await prisma.coupon.create({ data: parsed.data })
  revalidatePath("/admin/coupons")
  redirect(buildToastRedirect(returnTo || "/admin/coupons", "Coupon%20created"))
}

export async function updateCoupon(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  const payload = {
    id: formData.get("id"),
    code: String(formData.get("code") || "").trim().toUpperCase(),
    description: formData.get("description") || null,
    discountType: formData.get("discountType"),
    discountValue: parseDiscountValue(formData.get("discountType"), formData.get("discountValue")),
    isActive: formData.get("isActive") === "on",
  }
  const parsed = couponSchema.safeParse(payload)
  if (!parsed.success || !parsed.data.id) {
    throw new Error("Invalid coupon data")
  }

  await prisma.coupon.update({
    where: { id: parsed.data.id },
    data: {
      code: parsed.data.code,
      description: parsed.data.description,
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      isActive: parsed.data.isActive,
    },
  })
  revalidatePath("/admin/coupons")
  redirect(buildToastRedirect(returnTo || "/admin/coupons", "Coupon%20updated"))
}

export async function deleteCoupon(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  const id = formData.get("id")
  if (!id) {
    throw new Error("Missing coupon id")
  }

  await prisma.coupon.delete({ where: { id } })
  revalidatePath("/admin/coupons")
  redirect(buildToastRedirect(returnTo || "/admin/coupons", "Coupon%20deleted", "warning"))
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

export async function validateOrderAddress(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  try {
    const payload = {
      orderId: formData.get("orderId"),
    }
    const parsed = orderIdSchema.safeParse(payload)
    if (!parsed.success) {
      throw new Error("Invalid order id")
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: {
        user: true,
        shippingAddress: true,
      },
    })

    if (!order) {
      throw new Error("Order not found")
    }

    const addressTo = buildShippoAddressTo(order)
    const response = await validateAddress(addressTo)
    const isValid = response?.validation_results?.is_valid
    const messages = response?.validation_results?.messages || []
    const validationError =
      messages.find((message) => message.type === "error")?.text ||
      messages[0]?.text ||
      "Check address fields."

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          addressValidationStatus: isValid ? "VALID" : "INVALID",
          addressValidationError: isValid ? null : validationError,
          addressValidationNote: isValid ? null : order.addressValidationNote,
        },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: isValid ? "NOTE" : "EXCEPTION",
          message: isValid
            ? "Address validated successfully."
            : `Address validation failed: ${validationError}`,
        },
      }),
    ])

    revalidatePath(`/admin/orders/${order.id}`)
    revalidatePath(`/account/orders/${order.id}`)
    const toastMessage = isValid ? "Address%20validated" : "Address%20invalid"
    redirect(buildToastRedirect(returnTo || `/admin/orders/${order.id}`, toastMessage, isValid ? "success" : "warning"))
  } catch (error) {
    if (isRedirect(error)) {
      throw error
    }
    console.error(error)
    redirect(
      buildToastRedirect(
        returnTo || "/admin/orders",
        toToastMessage(error?.message, "Address validation failed"),
        "error",
      ),
    )
  }
}

export async function updateAddressValidationStatus(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  try {
    const payload = {
      orderId: formData.get("orderId"),
      status: formData.get("status"),
      note: formData.get("note"),
    }
    const parsed = z
      .object({
        orderId: z.string().min(1),
        status: z.enum(["UNVALIDATED", "VALID", "INVALID", "CLIENT_UPDATED"]),
        note: z.string().max(500).optional().nullable(),
      })
      .safeParse(payload)

    if (!parsed.success) {
      throw new Error("Invalid address validation update")
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: { shippingAddress: true },
    })

    if (!order) {
      throw new Error("Order not found")
    }

    const note = parsed.data.note?.trim() || null
    const status = parsed.data.status

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          addressValidationStatus: status,
          addressValidationNote: note,
        },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: status === "INVALID" ? "EXCEPTION" : "NOTE",
          message: note
            ? `Address validation status updated: ${status}. Note: ${note}`
            : `Address validation status updated: ${status}.`,
        },
      }),
    ])

    revalidatePath(`/admin/orders/${order.id}`)
    revalidatePath(`/account/orders/${order.id}`)
    redirect(buildToastRedirect(returnTo || `/admin/orders/${order.id}`, "Address%20status%20updated"))
  } catch (error) {
    if (isRedirect(error)) {
      throw error
    }
    console.error(error)
    redirect(
      buildToastRedirect(
        returnTo || "/admin/orders",
        toToastMessage(error?.message, "Failed to update address status"),
        "error",
      ),
    )
  }
}

export async function getShippingRates(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  try {
    const payload = {
      orderId: formData.get("orderId"),
    }
    const parsed = orderIdSchema.safeParse(payload)
    if (!parsed.success) {
      throw new Error("Invalid order id")
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: {
        user: true,
        items: true,
        shippingAddress: true,
        shipments: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!order) {
      throw new Error("Order not found")
    }

    const addressFrom = getShippoAddressFromEnv()
    const addressTo = buildShippoAddressTo(order)
    const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0)
    const weight = Math.max(1, totalQty)
    const parcels = [
      {
        length: "12",
        width: "9",
        height: "2",
        distance_unit: "in",
        weight: String(weight),
        mass_unit: "lb",
      },
    ]

    const shipmentResponse = await createShipment({
      addressFrom,
      addressTo,
      parcels,
    })

    const rates = Array.isArray(shipmentResponse?.rates) ? shipmentResponse.rates : []
    const latestShipment = order.shipments[0]

    if (latestShipment && !latestShipment.shippoTransactionId) {
      await prisma.shipment.update({
        where: { id: latestShipment.id },
        data: {
          shippoShipmentId: shipmentResponse.object_id,
          status: shipmentResponse.status || "RATES_READY",
          rates,
        },
      })
    } else {
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          shippoShipmentId: shipmentResponse.object_id,
          status: shipmentResponse.status || "RATES_READY",
          rates,
        },
      })
    }

    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "NOTE",
        message: "Shipping rates fetched.",
      },
    })

    revalidatePath(`/admin/orders/${order.id}`)
    redirect(buildToastRedirect(returnTo || `/admin/orders/${order.id}`, "Rates%20updated"))
  } catch (error) {
    if (isRedirect(error)) {
      throw error
    }
    console.error(error)
    redirect(
      buildToastRedirect(
        returnTo || "/admin/orders",
        toToastMessage(error?.message, "Failed to fetch rates"),
        "error",
      ),
    )
  }
}

export async function buyShippingLabel(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  try {
    const payload = {
      orderId: formData.get("orderId"),
      rateId: formData.get("rateId"),
      shipmentId: formData.get("shipmentId") || null,
    }
    const parsed = ratePurchaseSchema.safeParse(payload)
    if (!parsed.success) {
      throw new Error("Invalid label request")
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: {
        shipments: { orderBy: { createdAt: "desc" } },
      },
    })

    if (!order) {
      throw new Error("Order not found")
    }

    const targetShipmentId = parsed.data.shipmentId || order.shipments[0]?.id
    if (!targetShipmentId) {
      throw new Error("No shipment available to purchase a label.")
    }

    const transaction = await buyLabel({ rateId: parsed.data.rateId })
    const rate = transaction?.rate || {}
    const rateCents = rate?.amount ? Math.round(Number(rate.amount) * 100) : null

    await prisma.$transaction([
      prisma.shipment.update({
        where: { id: targetShipmentId },
        data: {
          shippoTransactionId: transaction.object_id,
          labelUrl: transaction.label_url,
          trackingNumber: transaction.tracking_number,
          trackingUrl: transaction.tracking_url_provider || transaction.tracking_url || null,
          carrier: rate.provider || transaction.carrier || null,
          service: rate.servicelevel?.name || rate.servicelevel?.token || null,
          rateCents,
          status: transaction.status || "PURCHASED",
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "SHIPPED",
          fulfillmentStatus: "LABEL_PURCHASED",
          trackingUrl: transaction.tracking_url_provider || transaction.tracking_url || undefined,
        },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "LABEL_PURCHASED",
          message: "Shipping label purchased.",
        },
      }),
    ])

    revalidatePath(`/admin/orders/${order.id}`)
    revalidatePath("/admin/orders")
    redirect(buildToastRedirect(returnTo || `/admin/orders/${order.id}`, "Label%20purchased"))
  } catch (error) {
    if (isRedirect(error)) {
      throw error
    }
    console.error(error)
    redirect(
      buildToastRedirect(
        returnTo || "/admin/orders",
        toToastMessage(error?.message, "Failed to buy label"),
        "error",
      ),
    )
  }
}

export async function markHandedToCarrier(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  try {
    const payload = {
      orderId: formData.get("orderId"),
      shipmentId: formData.get("shipmentId") || null,
    }
    const parsed = shipmentActionSchema.safeParse(payload)
    if (!parsed.success) {
      throw new Error("Invalid order id")
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: {
        shipments: { orderBy: { createdAt: "desc" } },
      },
    })
    if (!order) {
      throw new Error("Order not found")
    }

    const shipmentId = parsed.data.shipmentId || order.shipments[0]?.id

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "SHIPPED",
          fulfillmentStatus: "HANDED_TO_CARRIER",
        },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "SHIPPED",
          message: "Handed to carrier.",
        },
      }),
      shipmentId
        ? prisma.shipment.update({
            where: { id: shipmentId },
            data: { status: "TRANSIT" },
          })
        : prisma.shipment.findMany({ take: 0 }),
    ])

    revalidatePath(`/admin/orders/${order.id}`)
    revalidatePath("/admin/orders")
    redirect(buildToastRedirect(returnTo || `/admin/orders/${order.id}`, "Marked%20as%20handed%20to%20carrier"))
  } catch (error) {
    if (isRedirect(error)) {
      throw error
    }
    console.error(error)
    redirect(
      buildToastRedirect(
        returnTo || "/admin/orders",
        toToastMessage(error?.message, "Failed to update fulfillment"),
        "error",
      ),
    )
  }
}

export async function refreshTracking(formData) {
  await requireRole("ADMIN")
  const returnTo = formData.get("returnTo")
  try {
    const payload = {
      orderId: formData.get("orderId"),
      shipmentId: formData.get("shipmentId") || null,
    }
    const parsed = shipmentActionSchema.safeParse(payload)
    if (!parsed.success) {
      throw new Error("Invalid order id")
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: {
        shipments: {
          orderBy: { createdAt: "desc" },
          include: { events: true },
        },
      },
    })

    if (!order) {
      throw new Error("Order not found")
    }

    const shipment = order.shipments.find((s) => s.id === parsed.data.shipmentId) || order.shipments[0]
    if (!shipment?.trackingNumber || !shipment?.carrier) {
      throw new Error("No tracking information available")
    }

    const trackingData = await trackShipment({
      carrier: shipment.carrier.toLowerCase(),
      trackingNumber: shipment.trackingNumber,
    })

    const trackingStatus = trackingData?.tracking_status
    const trackingHistory = trackingData?.tracking_history || []

    const updates = []

    if (trackingStatus) {
      const status = trackingStatus.status?.toUpperCase() || "UNKNOWN"
      updates.push(
        prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            status,
            trackingUrl: trackingData.tracking_url_provider || shipment.trackingUrl,
          },
        })
      )

      if (status.includes("DELIVERED")) {
        updates.push(
          prisma.order.update({
            where: { id: order.id },
            data: {
              status: "DELIVERED",
              fulfillmentStatus: "DELIVERED",
            },
          })
        )
      }
    }

    for (const event of trackingHistory) {
      const eventId = event.object_id || `${shipment.trackingNumber}-${event.status_date}`
      const existingEvent = shipment.events.find((e) => e.eventId === eventId)
      if (!existingEvent) {
        updates.push(
          prisma.shipmentEvent.create({
            data: {
              shipmentId: shipment.id,
              eventId,
              status: event.status?.toUpperCase() || "UNKNOWN",
              details: event.status_details || null,
              location: event.location
                ? [event.location.city, event.location.state, event.location.country].filter(Boolean).join(", ")
                : null,
              occurredAt: event.status_date ? new Date(event.status_date) : new Date(),
              rawPayload: event,
            },
          })
        )
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates)
    }

    revalidatePath(`/admin/orders/${order.id}`)
    redirect(buildToastRedirect(returnTo || `/admin/orders/${order.id}`, "Tracking%20refreshed"))
  } catch (error) {
    if (isRedirect(error)) {
      throw error
    }
    console.error(error)
    redirect(
      buildToastRedirect(
        returnTo || "/admin/orders",
        toToastMessage(error?.message, "Failed to refresh tracking"),
        "error",
      ),
    )
  }
}
