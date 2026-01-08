"use client"

import { useState } from "react"
import { DataTable } from "@/components/admin/data-table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { orders } from "@/lib/data/orders"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()

  const normalizedOrders = orders.map((order) => {
    const orderNumber = order.orderNumber ?? order.id ?? "Unknown"
    const customer = order.customer ?? order.shippingAddress?.name ?? "Unknown"
    const date = order.date ?? order.createdAt ?? null
    const items = (order.items ?? []).map((item) => ({
      ...item,
      quantity: item.quantity ?? item.qty ?? 0,
    }))
    const total = order.total ?? order.totals?.total ?? 0
    const status = order.status ?? "pending"

    return {
      ...order,
      orderNumber,
      customer,
      date,
      items,
      total,
      status,
    }
  })

  const normalizedQuery = searchQuery.toLowerCase()
  const filteredOrders = normalizedOrders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(normalizedQuery) ||
      order.customer.toLowerCase().includes(normalizedQuery)
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const columns = [
    {
      header: "Order",
      accessorKey: "orderNumber",
      cell: (row) => (
        <div>
          <p className="font-medium">#{row.orderNumber}</p>
          <p className="text-sm text-muted-foreground">{new Date(row.date).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customer",
    },
    {
      header: "Items",
      accessorKey: "items",
      cell: (row) => `${row.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)} items`,
    },
    {
      header: "Total",
      accessorKey: "total",
      cell: (row) => `$${row.total}`,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        const statusColors = {
          pending: "secondary",
          processing: "default",
          production: "default",
          shipped: "default",
          delivered: "default",
        }
        return (
          <Badge variant={statusColors[row.status] ?? "secondary"}>
            {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "Pending"}
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
      />
    </div>
  )
}
