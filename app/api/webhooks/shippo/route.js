import crypto from "crypto"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const getSignatureHeaders = (headers) => {
  return (
    headers.get("x-shippo-signature") ||
    headers.get("shippo-signature") ||
    headers.get("x-hub-signature") ||
    ""
  )
}

const normalizeSignature = (value) => {
  if (!value) return ""
  return value.replace(/^sha256=/i, "").trim()
}

const verifyShippoSignature = (rawBody, signature) => {
  const secret = process.env.SHIPPO_WEBHOOK_SECRET
  if (!secret) {
    return true
  }
  if (!signature) return false

  const cleaned = normalizeSignature(signature)
  const hmacHex = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  const hmacBase64 = crypto.createHmac("sha256", secret).update(rawBody).digest("base64")

  return cleaned === hmacHex || cleaned === hmacBase64
}

const normalizeStatus = (value) => (value ? String(value).toUpperCase() : "")

const buildLocation = (location) => {
  if (!location) return null
  if (typeof location === "string") return location
  const parts = [location.city, location.state, location.zip, location.country].filter(Boolean)
  return parts.join(", ") || null
}

export async function POST(request) {
  const rawBody = await request.text()
  const signature = getSignatureHeaders(request.headers)

  try {
    if (!verifyShippoSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType = payload.event || payload.event_type || payload.type
  const data = payload.data || payload.payload || payload
  const trackingNumber = data.tracking_number || data.trackingNumber || data.tracking
  const carrier = data.carrier || data.carrier_code || data.carrier_code_token
  const trackingStatus = data.tracking_status || data.trackingStatus || {}
  const status = normalizeStatus(trackingStatus.status || trackingStatus.status_code || data.status)
  const statusDetails = trackingStatus.status_details || trackingStatus.details || data.details || null
  const statusDate = trackingStatus.status_date || trackingStatus.statusDate || data.status_date || null
  const location = buildLocation(trackingStatus.location || data.location)
  const eventId =
    payload.object_id ||
    payload.id ||
    trackingStatus.object_id ||
    data.tracking_status_id ||
    crypto.createHash("sha256").update(rawBody).digest("hex")

  if (!trackingNumber) {
    return NextResponse.json({ received: true })
  }

  const orConditions = [{ trackingNumber }]
  if (data.transaction_id || data.transaction) {
    orConditions.push({ shippoTransactionId: data.transaction_id || data.transaction })
  }
  if (data.shipment_id || data.shipment) {
    orConditions.push({ shippoShipmentId: data.shipment_id || data.shipment })
  }

  const shipment = await prisma.shipment.findFirst({
    where: {
      OR: orConditions,
    },
    include: {
      order: true,
    },
  })

  if (!shipment) {
    return NextResponse.json({ received: true })
  }

  const existingEvent = await prisma.shipmentEvent.findFirst({
    where: {
      shipmentId: shipment.id,
      eventId,
    },
  })

  if (existingEvent) {
    return NextResponse.json({ received: true })
  }

  const occurredAt = statusDate ? new Date(statusDate) : new Date()
  const normalizedStatus = status || "UNKNOWN"

  const updates = []

  updates.push(
    prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        eventId,
        status: normalizedStatus,
        details: statusDetails || null,
        location,
        occurredAt,
        rawPayload: payload,
      },
    }),
  )

  updates.push(
    prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: normalizedStatus,
        trackingUrl: data.tracking_url || data.tracking_url_provider || shipment.trackingUrl,
      },
    }),
  )

  const shouldMarkDelivered = normalizedStatus.includes("DELIVERED")
  const shouldMarkException =
    normalizedStatus.includes("EXCEPTION") ||
    normalizedStatus.includes("FAIL") ||
    normalizedStatus.includes("RETURN")

  if (shouldMarkDelivered) {
    updates.push(
      prisma.order.update({
        where: { id: shipment.orderId },
        data: {
          status: "DELIVERED",
          fulfillmentStatus: "DELIVERED",
        },
      }),
    )
    const existingDelivered = await prisma.orderEvent.findFirst({
      where: { orderId: shipment.orderId, type: "DELIVERED" },
    })
    if (!existingDelivered) {
      updates.push(
        prisma.orderEvent.create({
          data: {
            orderId: shipment.orderId,
            type: "DELIVERED",
            message: "Delivered",
          },
        }),
      )
    }
  } else if (shouldMarkException) {
    const existingException = await prisma.orderEvent.findFirst({
      where: { orderId: shipment.orderId, type: "EXCEPTION" },
    })
    updates.push(
      prisma.order.update({
        where: { id: shipment.orderId },
        data: {
          fulfillmentStatus: "EXCEPTION",
        },
      }),
    )
    if (!existingException) {
      updates.push(
        prisma.orderEvent.create({
          data: {
            orderId: shipment.orderId,
            type: "EXCEPTION",
            message: statusDetails || "Shipment exception.",
          },
        }),
      )
    }
  } else if (eventType || normalizedStatus) {
    updates.push(
      prisma.orderEvent.create({
        data: {
          orderId: shipment.orderId,
          type: "NOTE",
          message: statusDetails || `Tracking update: ${normalizedStatus}`,
        },
      }),
    )
  }

  await prisma.$transaction(updates)

  return NextResponse.json({ received: true })
}
