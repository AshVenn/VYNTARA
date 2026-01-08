"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/admin/data-table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrdersTable({ orders }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase()
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(normalizedQuery) ||
        order.customer.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === "all" || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

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
      accessorKey: "itemsCount",
      cell: (row) => `${row.itemsCount} items`,
    },
    {
      header: "Total",
      accessorKey: "totalCents",
      cell: (row) => `$${(row.totalCents / 100).toFixed(2)}`,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        const statusColors = {
          PAID: "secondary",
          PRODUCTION: "default",
          SHIPPED: "default",
          DELIVERED: "default",
          CANCELLED: "destructive",
        }
        return (
          <Badge variant={statusColors[row.status] ?? "secondary"}>
            {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
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
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PRODUCTION">Production</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filteredOrders} onRowClick={(order) => router.push(`/admin/orders/${order.id}`)} />
    </div>
  )
}
