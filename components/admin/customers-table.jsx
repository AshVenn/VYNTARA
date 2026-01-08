"use client"

import { useMemo, useState } from "react"
import { DataTable } from "@/components/admin/data-table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MoreVertical, Mail, UserX } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export default function CustomersTable({ customers }) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase()
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(normalizedQuery) ||
        customer.email.toLowerCase().includes(normalizedQuery),
    )
  }, [customers, searchQuery])

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
      cell: (row) => `$${(row.totalSpentCents / 100).toFixed(2)}`,
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
      cell: () => (
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
    <div className="space-y-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable columns={columns} data={filteredCustomers} />
    </div>
  )
}
