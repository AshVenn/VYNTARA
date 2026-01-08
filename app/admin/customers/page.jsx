"use client"

import { useState } from "react"
import { DataTable } from "@/components/admin/data-table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MoreVertical, Mail, UserX } from "lucide-react"
import { users } from "@/lib/data/users"
import { orders } from "@/lib/data/orders"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export default function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState("")

  // Calculate customer stats
  const customersWithStats = users.map((user) => {
    const userOrders = orders.filter((order) => order.customer === user.name)
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0)
    return {
      ...user,
      ordersCount: userOrders.length,
      totalSpent,
      lastOrder:
        userOrders.length > 0
          ? new Date(Math.max(...userOrders.map((o) => new Date(o.date)))).toLocaleDateString()
          : "Never",
    }
  })

  const filteredCustomers = customersWithStats.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const columns = [
    {
      header: "Customer",
      accessorKey: "name",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      header: "Orders",
      accessorKey: "ordersCount",
      cell: (row) => `${row.ordersCount} orders`,
    },
    {
      header: "Total Spent",
      accessorKey: "totalSpent",
      cell: (row) => `$${row.totalSpent.toLocaleString()}`,
    },
    {
      header: "Last Order",
      accessorKey: "lastOrder",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => (
        <Badge variant={row.ordersCount > 0 ? "default" : "secondary"}>{row.ordersCount > 0 ? "Active" : "New"}</Badge>
      ),
    },
    {
      header: "",
      accessorKey: "actions",
      className: "text-right",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <UserX className="w-4 h-4 mr-2" />
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground mt-1">View and manage your customer base</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredCustomers} />
    </div>
  )
}
