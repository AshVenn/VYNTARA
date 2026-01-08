import { notFound } from "next/navigation"
import { orders } from "@/lib/data/orders"
import { products } from "@/lib/data/products"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OrderTimeline } from "@/components/account/order-timeline"
import Link from "next/link"
import { ArrowLeft, Printer, Send } from "lucide-react"

export default function AdminOrderDetail({ params }) {
  const order = orders.find((o) => o.id === Number.parseInt(params.id))

  if (!order) {
    notFound()
  }

  const orderItems = order.items.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground mt-1">
            Placed on{" "}
            {new Date(order.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Send Update
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Order Items</h2>
            <div className="space-y-6">
              {orderItems.map((item, index) => (
                <div key={index} className="flex gap-4 pb-6 border-b last:border-0">
                  <img
                    src={item.product.images[0] || "/placeholder.svg"}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Size: {item.size}</span>
                      <span>Color: {item.color}</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.price * item.quantity}</p>
                    <p className="text-sm text-muted-foreground mt-1">${item.price} each</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.total - 10}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>$10.00</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span>${order.total}</span>
              </div>
            </div>
          </Card>

          {/* Order Timeline */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Order Timeline</h2>
            <OrderTimeline status={order.status} />
          </Card>
        </div>

        <div className="space-y-6">
          {/* Order Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Order Status</h2>
            <Badge className="mb-4">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Badge>
            <p className="text-sm text-muted-foreground mb-4">
              {order.status === "delivered" && "Order has been delivered successfully"}
              {order.status === "shipped" && "Order is on the way"}
              {order.status === "processing" && "Order is being prepared"}
              {order.status === "pending" && "Order is pending confirmation"}
            </p>
            {order.trackingNumber && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Tracking Number</p>
                <p className="font-mono">{order.trackingNumber}</p>
              </div>
            )}
          </Card>

          {/* Customer Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Customer</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{order.customer}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Email</p>
                <p className="font-medium">customer@example.com</p>
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
            <p className="text-sm">
              123 Main Street
              <br />
              Apt 4B
              <br />
              New York, NY 10001
              <br />
              United States
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
