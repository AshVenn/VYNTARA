import { StatCard } from "@/components/admin/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, ShoppingBag, Users, TrendingUp, ArrowUpRight } from "lucide-react"
import { orders } from "@/lib/data/orders"
import { products } from "@/lib/data/products"
import { users } from "@/lib/data/users"
import Link from "next/link"

export const metadata = {
  title: "Admin Dashboard | VYNTARA",
}

export default function AdminDashboard() {
  // Calculate stats
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const totalCustomers = users.length
  const avgOrderValue = totalRevenue / totalOrders

  // Recent orders
  const recentOrders = orders.slice(0, 5)

  // Top products
  const productSales = {}
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { quantity: 0, revenue: 0 }
      }
      productSales[item.productId].quantity += item.quantity
      productSales[item.productId].revenue += item.price * item.quantity
    })
  })

  const topProducts = Object.entries(productSales)
    .map(([id, data]) => ({
      product: products.find((p) => p.id === Number.parseInt(id)),
      ...data,
    }))
    .sort((a, b) => b.revenue - a.revenue)
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
          value={`$${totalRevenue.toLocaleString()}`}
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
          value={`$${avgOrderValue.toFixed(0)}`}
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
                  <p className="font-medium">Order #{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${order.total}</p>
                  <p
                    className={`text-sm ${
                      order.status === "delivered"
                        ? "text-green-600"
                        : order.status === "processing"
                          ? "text-blue-600"
                          : order.status === "shipped"
                            ? "text-purple-600"
                            : "text-yellow-600"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
                  alt={item.product.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">{item.quantity} sold</p>
                </div>
                <p className="font-medium">${item.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
