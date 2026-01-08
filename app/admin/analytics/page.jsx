import { Card } from "@/components/ui/card"
import { StatCard } from "@/components/admin/stat-card"
import { TrendingUp, ShoppingCart, DollarSign, Package } from "lucide-react"
import prisma from "@/lib/prisma"

export default async function AdminAnalytics() {
  const [orders, orderItems] = await Promise.all([
    prisma.order.findMany(),
    prisma.orderItem.findMany({
      include: {
        product: { include: { category: true } },
      },
    }),
  ])

  const totalRevenueCents = orders.reduce((sum, order) => sum + order.totalCents, 0)
  const totalOrders = orders.length
  const avgOrderValueCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0

  const categoryRevenueMap = new Map()
  orderItems.forEach((item) => {
    const categoryName = item.product.category?.name || "Uncategorized"
    const current = categoryRevenueMap.get(categoryName) || 0
    categoryRevenueMap.set(categoryName, current + item.priceCents * item.qty)
  })

  const categoryData = Array.from(categoryRevenueMap.entries())
    .map(([category, revenueCents]) => ({ category, revenueCents }))
    .sort((a, b) => b.revenueCents - a.revenueCents)

  const revenueDivider = totalRevenueCents || 1

  // Monthly revenue (simulated)
  const monthlyData = [
    { month: "Jan", revenue: 12500 },
    { month: "Feb", revenue: 15200 },
    { month: "Mar", revenue: 18900 },
    { month: "Apr", revenue: 16800 },
    { month: "May", revenue: 21300 },
    { month: "Jun", revenue: 24500 },
  ]

  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your business performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${(totalRevenueCents / 100).toLocaleString()}`}
          change="+12.5%"
          trend="up"
          icon={DollarSign}
        />
        <StatCard title="Total Orders" value={totalOrders} change="+8.2%" trend="up" icon={ShoppingCart} />
        <StatCard
          title="Avg Order Value"
          value={`$${(avgOrderValueCents / 100).toFixed(0)}`}
          change="+3.1%"
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="Products Sold"
          value={orderItems.reduce((sum, item) => sum + item.qty, 0)}
          change="+15.3%"
          trend="up"
          icon={Package}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Revenue Trend</h2>
          <div className="space-y-4">
            {monthlyData.map((item) => (
              <div key={item.month}>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-medium">{item.month}</span>
                  <span className="text-muted-foreground">${item.revenue.toLocaleString()}</span>
                </div>
                <div className="h-8 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sales by Category */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Sales by Category</h2>
          <div className="space-y-6">
            {categoryData.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{item.category}</span>
                  <span className="text-muted-foreground">${(item.revenueCents / 100).toLocaleString()}</span>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(item.revenueCents / revenueDivider) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((item.revenueCents / revenueDivider) * 100).toFixed(1)}% of total revenue
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
