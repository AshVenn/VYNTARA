import prisma from "@/lib/prisma"
import CustomersTable from "@/components/admin/customers-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const resolveParams = async (params) => (params && typeof params.then === "function" ? await params : params)

export default async function AdminCustomers({ searchParams }) {
  const resolved = await resolveParams(searchParams)
  const page = Math.max(1, Number(resolved?.page) || 1)
  const pageSize = 20
  const skip = (page - 1) * pageSize

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      skip,
      take: pageSize,
      include: { orders: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: "CLIENT" } }),
  ])

  const customersWithStats = users.map((user) => {
    const ordersCount = user.orders.length
    const totalSpentCents = user.orders.reduce((sum, order) => sum + order.totalCents, 0)
    const lastOrderDate =
      ordersCount > 0
        ? new Date(Math.max(...user.orders.map((order) => new Date(order.createdAt)))).toLocaleDateString()
        : "Never"

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      ordersCount,
      totalSpentCents,
      lastOrder: lastOrderDate,
    }
  })

  const hasNext = skip + users.length < totalCount

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">View and manage your customer base</p>
      </div>

      <CustomersTable customers={customersWithStats} />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Page {page} • {Math.min(skip + users.length, totalCount)} of {totalCount}
        </span>
        <div className="flex gap-2">
          <Button asChild variant="outline" disabled={page <= 1} className="bg-transparent">
            <Link href={`/admin/customers?page=${page - 1}`}>Previous</Link>
          </Button>
          <Button asChild variant="outline" disabled={!hasNext} className="bg-transparent">
            <Link href={`/admin/customers?page=${page + 1}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
