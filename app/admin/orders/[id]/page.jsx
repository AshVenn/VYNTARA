import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import {
  buyShippingLabel,
  getShippingRates,
  markHandedToCarrier,
  updateOrderStatus,
  updateOrderTracking,
  validateOrderAddress,
  updateAddressValidationStatus,
  refreshTracking,
} from "@/app/admin/actions"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, ExternalLink, CheckCircle, MapPin } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FulfillmentStatusBadge, FulfillmentProgress } from "@/components/admin/fulfillment-status-badge"
import { ShippingRatesCard } from "@/components/admin/shipping-rates-card"
import { TrackingTimeline } from "@/components/admin/tracking-timeline"
import { OrderEventsList } from "@/components/admin/order-events-list"
import { AddressValidationPanel } from "@/components/admin/address-validation-panel"

const buildTimeline = (status) => {
  const stages = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"]
  return stages.map((stage) => ({
    label: stage.charAt(0) + stage.slice(1).toLowerCase(),
    completed: stages.indexOf(stage) <= stages.indexOf(status),
  }))
}

const resolveParamId = async (params) => {
  const resolvedParams =
    params && typeof params.then === "function" ? await params : params
  return resolvedParams?.id
}

export default async function AdminOrderDetail({ params }) {
  const id = await resolveParamId(params)
  if (!id) {
    notFound()
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        include: { addresses: true },
      },
      shippingAddress: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      shipments: {
        orderBy: { createdAt: "desc" },
        include: {
          events: {
            orderBy: { occurredAt: "desc" },
          },
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })

  if (!order) {
    notFound()
  }

  const shippingAddress = order.shippingAddress
  const timeline = buildTimeline(order.status)
  const shipment = order.shipments[0]
  const rates = Array.isArray(shipment?.rates) ? shipment.rates : []
  const sortedRates = [...rates].sort((a, b) => Number(a.amount) - Number(b.amount))
  const addressStatus = order.addressValidationStatus || "UNVALIDATED"
  const addressError = order.addressValidationError
  const addressNote = order.addressValidationNote

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</h1>
          <p className="text-muted-foreground mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Order Items</h2>
            <div className="space-y-6">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-6 border-b last:border-0">
                  <img
                    src={item.product.images[0] || "/placeholder.svg"}
                    alt={item.product.title}
                    className="w-20 h-20 object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Size: {item.variant.size}</span>
                      <span>Color: {item.variant.color}</span>
                      <span>Qty: {item.qty}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${((item.priceCents * item.qty) / 100).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground mt-1">${(item.priceCents / 100).toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${(order.subtotalCents / 100).toFixed(2)}</span>
              </div>
              {order.couponDiscountCents > 0 && order.couponCode && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount ({order.couponCode})</span>
                  <span className="text-green-600">-${(order.couponDiscountCents / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>${(order.shippingCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${(order.taxCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span>${(order.totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Order Progress</h2>
            <div className="space-y-3">
              {timeline.map((stage) => (
                <div key={stage.label} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.label}</span>
                  <span className={stage.completed ? "text-green-600" : "text-muted-foreground"}>
                    {stage.completed ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {order.events && order.events.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Activity Log</h2>
              <OrderEventsList events={order.events} />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Update Status</h2>
            <Badge className="mb-4">{order.status.charAt(0) + order.status.slice(1).toLowerCase()}</Badge>
            <form action={updateOrderStatus} className="space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <Select name="status" defaultValue={order.status}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="IN_PRODUCTION">Production</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full">
                Update Status
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tracking</h2>
            <form action={updateOrderTracking} className="space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <input
                type="url"
                name="trackingUrl"
                defaultValue={order.trackingUrl || ""}
                placeholder="https://tracking.example.com"
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              />
              <Button type="submit" variant="outline" className="w-full bg-transparent">
                Save Tracking
              </Button>
            </form>
            {shipment?.labelUrl ? (
              <Button variant="link" className="mt-3 px-0" asChild>
                <a href={shipment.labelUrl} target="_blank" rel="noopener noreferrer">
                  Print label
                </a>
              </Button>
            ) : null}
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Fulfillment</h2>
              <FulfillmentStatusBadge status={order.fulfillmentStatus} />
            </div>

            <FulfillmentProgress status={order.fulfillmentStatus} />

            <AddressValidationPanel
              orderId={order.id}
              status={addressStatus}
              error={addressError}
              note={addressNote}
              action={updateAddressValidationStatus}
            />

            <div className="pt-4 border-t space-y-3">
              {(order.fulfillmentStatus === "UNFULFILLED" || order.fulfillmentStatus === "IN_PROGRESS") && !shipment?.labelUrl && (
                <>
                  <form action={validateOrderAddress}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button type="submit" variant="outline" className="w-full bg-transparent">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Validate Address
                    </Button>
                  </form>

                  <form action={getShippingRates}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button type="submit" className="w-full">
                      Get Shipping Rates
                    </Button>
                  </form>
                </>
              )}

              {sortedRates.length > 0 && !shipment?.labelUrl && (
                <ShippingRatesCard
                  rates={sortedRates}
                  buyLabelAction={buyShippingLabel}
                  orderId={order.id}
                  shipmentId={shipment?.id}
                />
              )}

              {shipment?.labelUrl && (order.fulfillmentStatus === "LABEL_PURCHASED" || order.fulfillmentStatus === "IN_PROGRESS") && (
                <form action={markHandedToCarrier}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="shipmentId" value={shipment?.id || ""} />
                  <Button type="submit" className="w-full">
                    Mark as Handed to Carrier
                  </Button>
                </form>
              )}
            </div>

            {shipment?.labelUrl && (
              <div className="pt-4 border-t space-y-3">
                <h3 className="text-sm font-semibold">Shipping Label</h3>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent" asChild>
                    <a href={shipment.labelUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download Label
                    </a>
                  </Button>
                  {shipment.trackingUrl && (
                    <Button variant="outline" className="flex-1 bg-transparent" asChild>
                      <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Track Package
                      </a>
                    </Button>
                  )}
                </div>
                <div className="text-sm space-y-1 bg-muted/50 p-3 rounded-lg">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Carrier</span>
                    <span className="font-medium">{shipment.carrier || "—"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{shipment.service || "—"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Tracking #</span>
                    <span className="font-medium font-mono text-xs">{shipment.trackingNumber || "—"}</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Print this label and attach it to the package before handing it to the carrier.
                </p>
              </div>
            )}
          </Card>

          {shipment?.trackingNumber && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Tracking Timeline</h2>
              <TrackingTimeline
                events={shipment.events || []}
                carrier={shipment.carrier}
                trackingNumber={shipment.trackingNumber}
              />
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Customer</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{order.user?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{order.user?.email || "Unknown"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            {shippingAddress ? (
              <p className="text-sm">
                {shippingAddress.fullName}
                <br />
                {shippingAddress.line1}
                {shippingAddress.line2 ? (
                  <>
                    <br />
                    {shippingAddress.line2}
                  </>
                ) : null}
                <br />
                {shippingAddress.city}, {shippingAddress.region} {shippingAddress.postalCode}
                <br />
                {shippingAddress.country}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No shipping address on file.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
