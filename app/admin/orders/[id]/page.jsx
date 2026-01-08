import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { updateOrderStatus, updateOrderTracking } from "@/app/admin/actions"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const buildTimeline = (status) => {
  const stages = ["PAID", "PRODUCTION", "SHIPPED", "DELIVERED"]
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
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  const shippingAddress = order.user.addresses[0]
  const timeline = buildTimeline(order.status)

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
            <h2 className="text-xl font-semibold mb-6">Order Timeline</h2>
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
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Update Status</h2>
            <Badge className="mb-4">{order.status.charAt(0) + order.status.slice(1).toLowerCase()}</Badge>
            <form action={updateOrderStatus} className="space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="PAID">Paid</option>
                <option value="PRODUCTION">Production</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
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
              <Button type="submit" variant="outline" className="w-full">
                Save Tracking
              </Button>
            </form>
          </Card>

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
