import prisma from "@/lib/prisma"
import OrdersTable from "@/components/admin/orders-table"

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: true,
      shipments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const tableData = orders.map((order) => ({
    id: order.id,
    orderNumber: order.id.slice(-6).toUpperCase(),
    customer: order.user?.name || order.user?.email || "Unknown",
    date: order.createdAt,
    itemsCount: order.items.reduce((sum, item) => sum + item.qty, 0),
    totalCents: order.totalCents,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    hasLabel: !!order.shipments[0]?.labelUrl,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
      </div>

      <OrdersTable orders={tableData} />
    </div>
  )
}
