import prisma from "@/lib/prisma"
import OrdersTable from "@/components/admin/orders-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const resolveParams = async (params) => (params && typeof params.then === "function" ? await params : params)

export default async function AdminOrders({ searchParams }) {
  const resolved = await resolveParams(searchParams)
  const page = Math.max(1, Number(resolved?.page) || 1)
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: pageSize,
      include: {
        user: true,
        items: true,
        shipments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count(),
  ])

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
    labelUrl: order.shipments[0]?.labelUrl || null,
    trackingNumber: order.shipments[0]?.trackingNumber || null,
    trackingUrl: order.shipments[0]?.trackingUrl || null,
  }))

  const hasNext = skip + orders.length < totalCount

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
      </div>

      <OrdersTable orders={tableData} />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Page {page} • {Math.min(skip + orders.length, totalCount)} of {totalCount}
        </span>
        <div className="flex gap-2">
          <Button asChild variant="outline" disabled={page <= 1} className="bg-transparent">
            <Link href={`/admin/orders?page=${page - 1}`}>Previous</Link>
          </Button>
          <Button asChild variant="outline" disabled={!hasNext} className="bg-transparent">
            <Link href={`/admin/orders?page=${page + 1}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
