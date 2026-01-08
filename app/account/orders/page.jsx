"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/utils"
import { getOrdersByUserId } from "@/lib/data/orders"
import { formatMoney } from "@/lib/utils"
import { EmptyState } from "@/components/shared/empty-state"
import { Package } from "lucide-react"

export default function OrdersPage() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      const userOrders = getOrdersByUserId(user.id)
      setOrders(userOrders)
    }
  }, [])

  if (orders.length === 0) {
    return (
      <div className="bg-background rounded-lg border border-border">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Start shopping to see your orders here"
          action={{
            label: "Shop Now",
            href: "/products",
          }}
        />
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "production":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="bg-background rounded-lg border border-border p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">{order.id}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(order.status)}`}
              >
                {order.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-16 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.productImage || "/placeholder.svg"}
                      alt={item.productTitle}
                      width={64}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.productTitle}</h4>
                    <p className="text-xs text-muted-foreground">
                      {item.variant.color} / {item.variant.size} / {item.variant.fit}
                    </p>
                    <p className="text-sm mt-1">
                      Qty: {item.qty} × {formatMoney(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{formatMoney(order.totals.total)}</p>
              </div>
              <Button variant="outline" asChild className="bg-transparent">
                <Link href={`/account/orders/${order.id}`}>View Details</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
