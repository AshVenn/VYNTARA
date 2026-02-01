import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/utils"
import { ChevronLeft, ExternalLink } from "lucide-react"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { markAddressUpdated } from "@/app/actions/orders"

const formatTimelineDate = (value) => {
  if (!value) return ""
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

const orderEventLabels = {
  ORDER_PLACED: "Order placed",
  PAID: "Payment confirmed",
  IN_PRODUCTION: "In production",
  LABEL_PURCHASED: "Label purchased",
  SHIPPED: "Handed to carrier",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  NOTE: "Update",
  EXCEPTION: "Delivery issue",
}

const mapOrderEvent = (event) => ({
  label: orderEventLabels[event.type] || event.type,
  date: formatTimelineDate(event.createdAt),
  message: event.message || null,
})

const resolveParamId = async (params) => {
  const resolvedParams =
    params && typeof params.then === "function" ? await params : params
  return resolvedParams?.id
}

export default async function OrderDetailPage({ params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    notFound()
  }

  const id = await resolveParamId(params)
  if (!id) {
    notFound()
  }

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      shippingAddress: true,
      events: {
        orderBy: { createdAt: "asc" },
      },
      shipments: {
        orderBy: { createdAt: "desc" },
        include: {
          events: {
            orderBy: { occurredAt: "asc" },
          },
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  const timelineEvents = order.events.length
    ? order.events.map(mapOrderEvent)
    : [
        {
          label: "Order placed",
          date: formatTimelineDate(order.createdAt),
          message: null,
        },
      ]
  const shipment = order.shipments[0]
  const trackingUrl = order.trackingUrl || shipment?.trackingUrl
  const trackingEvents = shipment?.events || []
  const shippingAddress = order.shippingAddress
  const addressStatus = order.addressValidationStatus || "UNVALIDATED"
  const addressError = order.addressValidationError
  const addressNote = order.addressValidationNote

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/account/orders">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Link>
      </Button>

      <div className="bg-background rounded-lg border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{order.id}</h1>
            <p className="text-sm text-muted-foreground">
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
          <span className="px-3 py-1 text-xs font-semibold capitalize bg-blue-100 text-blue-800">
            {order.status.replace(/_/g, " ").toLowerCase()}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="font-semibold mb-4">Order Timeline</h2>
            <div className="space-y-4">
              {timelineEvents.map((event, index) => (
                <div key={`${event.label}-${index}`} className="border border-border rounded-md p-3">
                  <p className="font-medium">{event.label}</p>
                  <p className="text-sm text-muted-foreground">{event.date}</p>
                  {event.message ? <p className="text-sm text-muted-foreground mt-1">{event.message}</p> : null}
                </div>
              ))}
            </div>
            {trackingUrl && (
              <Button variant="outline" size="sm" className="mt-4 bg-transparent" asChild>
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                  Track Shipment
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          <div>
            <h2 className="font-semibold mb-4">Shipping Address</h2>
            {addressStatus === "INVALID" && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
                <p className="font-medium text-destructive">Address needs attention</p>
                <p className="text-muted-foreground">
                  {addressError || "Please review your address details and update them if needed."}
                </p>
                {addressNote && <p className="text-muted-foreground mt-2">{addressNote}</p>}
                <form action={markAddressUpdated} className="mt-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button type="submit" size="sm" variant="outline" className="bg-transparent">
                    I updated my address
                  </Button>
                </form>
              </div>
            )}
            {addressStatus === "CLIENT_UPDATED" && (
              <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3 text-sm">
                <p className="font-medium">Address update sent</p>
                <p className="text-muted-foreground">
                  We are rechecking your address and will update the order soon.
                </p>
              </div>
            )}
            {shippingAddress ? (
              <div className="text-sm space-y-1">
                <p className="font-medium">{shippingAddress.fullName}</p>
                <p className="text-muted-foreground">{shippingAddress.line1}</p>
                {shippingAddress.line2 ? <p className="text-muted-foreground">{shippingAddress.line2}</p> : null}
                <p className="text-muted-foreground">
                  {shippingAddress.city}, {shippingAddress.region} {shippingAddress.postalCode}
                </p>
                <p className="text-muted-foreground">{shippingAddress.country}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No shipping address on file.</p>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="font-semibold mb-4">Order Items</h2>
          <div className="space-y-4 mb-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg">
                <div className="w-20 h-24 bg-muted overflow-hidden flex-shrink-0">
                  <Image
                    src={item.product.images[0] || "/placeholder.svg"}
                    alt={item.product.title}
                    width={80}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{item.product.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.variant.color} / {item.variant.size} / {item.variant.fit}
                  </p>
                  <p className="text-sm">
                    Qty: {item.qty} - {formatMoney(item.priceCents / 100)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney((item.priceCents * item.qty) / 100)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(order.subtotalCents / 100)}</span>
              </div>
              {order.couponDiscountCents > 0 && order.couponCode && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount ({order.couponCode})</span>
                  <span className="text-green-600">-{formatMoney(order.couponDiscountCents / 100)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatMoney(order.shippingCents / 100)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(order.taxCents / 100)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatMoney(order.totalCents / 100)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 mt-6">
            <h2 className="font-semibold mb-4">Tracking History</h2>
            {trackingEvents.length > 0 ? (
              <div className="space-y-3">
                {trackingEvents.map((event) => (
                  <div key={event.id} className="text-sm border border-border rounded-md p-3">
                    <p className="font-medium">{event.status || "Update"}</p>
                    {event.details ? <p className="text-muted-foreground">{event.details}</p> : null}
                    <p className="text-muted-foreground">{formatTimelineDate(event.occurredAt || event.createdAt)}</p>
                    {event.location ? <p className="text-muted-foreground">{event.location}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tracking updates will appear once the carrier scans the package.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
