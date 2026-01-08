import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { OrderTimeline } from "@/components/account/order-timeline"
import { formatMoney } from "@/lib/utils"
import { ChevronLeft, ExternalLink } from "lucide-react"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const buildTimeline = (status, createdAt) => {
  const stages = ["PAID", "PRODUCTION", "SHIPPED", "DELIVERED"]
  return stages.map((stage) => ({
    label: stage.charAt(0) + stage.slice(1).toLowerCase(),
    date: new Date(createdAt).toLocaleDateString("en-US"),
    completed: stages.indexOf(stage) <= stages.indexOf(status),
  }))
}

export default async function OrderDetailPage({ params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    notFound()
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      user: { include: { addresses: true } },
    },
  })

  if (!order) {
    notFound()
  }

  const timelineEvents = buildTimeline(order.status, order.createdAt)
  const shippingAddress = order.user.addresses[0]

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
            {order.status.toLowerCase()}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="font-semibold mb-4">Order Timeline</h2>
            <OrderTimeline events={timelineEvents} />
            {order.trackingUrl && (
              <Button variant="outline" size="sm" className="mt-4 bg-transparent" asChild>
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                  Track Shipment
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          <div>
            <h2 className="font-semibold mb-4">Shipping Address</h2>
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
        </div>
      </div>
    </div>
  )
}
