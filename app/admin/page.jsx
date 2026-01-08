import { StatCard } from "@/components/admin/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { deleteCategory, deleteProduct } from "@/app/admin/actions"

export const metadata = {
  title: "Admin Dashboard | VYNTARA",
}

export default async function AdminDashboard() {
  const [orders, totalCustomers, recentOrders, orderItems, categories, products] = await Promise.all([
    prisma.order.findMany(),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.order.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.orderItem.findMany({
      include: { product: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, take: 5 }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ])

  const totalRevenueCents = orders.reduce((sum, order) => sum + order.totalCents, 0)
  const totalOrders = orders.length
  const avgOrderValueCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0

  const productSalesMap = new Map()
  orderItems.forEach((item) => {
    const existing = productSalesMap.get(item.productId) || { quantity: 0, revenueCents: 0, product: item.product }
    existing.quantity += item.qty
    existing.revenueCents += item.priceCents * item.qty
    productSalesMap.set(item.productId, existing)
  })

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${(totalRevenueCents / 100).toLocaleString()}`}
          change="+12.5% from last month"
          trend="up"
          icon={DollarSign}
        />
        <StatCard
          title="Total Orders"
          value={totalOrders}
          change="+8.2% from last month"
          trend="up"
          icon={ShoppingBag}
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          change="+23.1% from last month"
          trend="up"
          icon={Users}
        />
        <StatCard
          title="Avg Order Value"
          value={`$${(avgOrderValueCents / 100).toFixed(0)}`}
          change="-2.4% from last month"
          trend="down"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">
                View all
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                <div>
                  <p className="font-medium">Order #{order.id.slice(-6).toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">{order.user?.name || order.user?.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(order.totalCents / 100).toFixed(2)}</p>
                  <p
                    className={`text-sm ${
                      order.status === "DELIVERED"
                        ? "text-green-600"
                        : order.status === "PRODUCTION"
                          ? "text-blue-600"
                          : order.status === "SHIPPED"
                            ? "text-purple-600"
                            : "text-yellow-600"
                    }`}
                  >
                    {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Top Products</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/products">
                View all
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {topProducts.map((item, index) => (
              <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                <img
                  src={item.product.images[0] || "/placeholder.svg"}
                  alt={item.product.title}
                  className="w-12 h-12 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product.title}</p>
                  <p className="text-sm text-muted-foreground">{item.quantity} sold</p>
                </div>
                <p className="font-medium">${(item.revenueCents / 100).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Products</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/products">
                Manage
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-muted-foreground">{product.slug}</p>
                </div>
                <form action={deleteProduct}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="returnTo" value="/admin" />
                  <Button type="submit" variant="outline" size="sm">
                    Delete
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Categories</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/categories">
                Manage
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.slug}</p>
                </div>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="returnTo" value="/admin" />
                  <Button type="submit" variant="outline" size="sm">
                    Delete
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
