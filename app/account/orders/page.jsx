import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/utils"
import { EmptyState } from "@/components/shared/empty-state"
import { Package } from "lucide-react"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)
  const orders = session?.user
    ? await prisma.order.findMany({
        where: { userId: session.user.id },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : []

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
      case "PENDING_PAYMENT":
        return "bg-gray-100 text-gray-800"
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "SHIPPED":
        return "bg-blue-100 text-blue-800"
      case "IN_PRODUCTION":
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
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                {order.status.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-20 bg-muted overflow-hidden shrink-0">
                    <Image
                      src={item.product.images[0] || "/placeholder.svg"}
                      alt={item.product.title}
                      width={64}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.product.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {item.variant.color} / {item.variant.size} / {item.variant.fit}
                    </p>
                    <p className="text-sm mt-1">Qty: {item.qty} - {formatMoney(item.priceCents / 100)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{formatMoney(order.totalCents / 100)}</p>
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
