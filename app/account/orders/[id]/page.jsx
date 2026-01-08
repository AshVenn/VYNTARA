"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { OrderTimeline } from "@/components/account/order-timeline"
import { getOrderById } from "@/lib/data/orders"
import { formatMoney } from "@/lib/utils"
import { ChevronLeft, ExternalLink } from "lucide-react"

export default function OrderDetailPage({ params }) {
  const { id } = use(params)
  const [order, setOrder] = useState(null)

  useEffect(() => {
    const orderData = getOrderById(id)
    setOrder(orderData)
  }, [id])

  if (!order) {
    return (
      <div className="bg-background rounded-lg border border-border p-6 text-center">
        <p>Order not found</p>
      </div>
    )
  }

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
          <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize bg-blue-100 text-blue-800">
            {order.status}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="font-semibold mb-4">Order Timeline</h2>
            <OrderTimeline events={order.timelineEvents} />
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
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p className="text-muted-foreground">{order.shippingAddress.street}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
              <p className="text-muted-foreground">{order.shippingAddress.country}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="font-semibold mb-4">Order Items</h2>
          <div className="space-y-4 mb-6">
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 border border-border rounded-lg">
                <div className="w-20 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.productImage || "/placeholder.svg"}
                    alt={item.productTitle}
                    width={80}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{item.productTitle}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.variant.color} / {item.variant.size} / {item.variant.fit}
                  </p>
                  <p className="text-sm">
                    Qty: {item.qty} × {formatMoney(item.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(item.price * item.qty)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(order.totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatMoney(order.totals.shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(order.totals.tax)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatMoney(order.totals.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
