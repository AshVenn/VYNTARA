"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { OrderTimeline } from "@/components/account/order-timeline"
import { getActiveOrder, getOrdersByUserId } from "@/lib/data/orders"
import { formatMoney } from "@/lib/utils"
import { Package, Download } from "lucide-react"
import { useSession } from "next-auth/react"

export default function AccountDashboardPage() {
  const { data: session } = useSession()
  const [user, setUser] = useState(null)
  const [activeOrder, setActiveOrder] = useState(null)
  const [pastOrders, setPastOrders] = useState([])

  useEffect(() => {
    if (session?.user) {
      setUser(session.user)
      const active = getActiveOrder(session.user.id)
      const all = getOrdersByUserId(session.user.id)
      const past = all.filter((o) => o.status === "delivered")

      setActiveOrder(active)
      setPastOrders(past)
    }
  }, [session])

  if (!user) return null

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-background rounded-lg border border-border p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user.name}!</h1>
        <p className="text-muted-foreground">Manage your orders and account settings</p>
      </div>

      {/* Active Order */}
      {activeOrder && (
        <div className="bg-background rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Active Order</h2>
            <Link href={`/account/orders/${activeOrder.id}`} className="text-sm font-medium hover:underline">
              View Details
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-semibold">{activeOrder.id}</p>
                </div>
              </div>

              <div className="space-y-3">
                {activeOrder.items.map((item, index) => (
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
                    <div>
                      <h4 className="font-medium text-sm">{item.productTitle}</h4>
                      <p className="text-xs text-muted-foreground">
                        {item.variant.color} / {item.variant.size}
                      </p>
                      <p className="text-sm font-semibold mt-1">{formatMoney(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Order Status</h3>
              <OrderTimeline events={activeOrder.timelineEvents} />
            </div>
          </div>
        </div>
      )}

      {/* Past Orders */}
      <div className="bg-background rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Past Orders</h2>
          <Button variant="outline" size="sm" asChild className="bg-transparent">
            <Link href="/account/orders">View All</Link>
          </Button>
        </div>

        {pastOrders.length > 0 ? (
          <div className="space-y-4">
            {pastOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex gap-4">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 bg-muted rounded-lg overflow-hidden border-2 border-background"
                      >
                        <Image
                          src={item.productImage || "/placeholder.svg"}
                          alt={item.productTitle}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} item{order.items.length > 1 ? "s" : ""} - {formatMoney(order.totals.total)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="bg-transparent">
                    Reorder
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No past orders yet</p>
        )}
      </div>
    </div>
  )
}
