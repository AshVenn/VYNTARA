import prisma from "@/lib/prisma"
import CustomersTable from "@/components/admin/customers-table"

export default async function AdminCustomers() {
  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: { orders: true },
    orderBy: { createdAt: "desc" },
  })

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">View and manage your customer base</p>
      </div>

      <CustomersTable customers={customersWithStats} />
    </div>
  )
}
