"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { DataTable } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ProductsTable({ products, deleteAction }) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase()
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery),
    )
  }, [products, searchQuery])

  const columns = [
    {
      header: "Product",
      accessorKey: "title",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.image || "/placeholder.svg"} alt={row.title} className="w-12 h-12 object-cover" />
          <div>
            <p className="font-medium">{row.title}</p>
            <p className="text-sm text-muted-foreground">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: (row) => (row.priceCents ? `$${(row.priceCents / 100).toFixed(2)}` : "N/A"),
    },
    {
      header: "Stock",
      accessorKey: "stock",
      cell: (row) => (
        <Badge variant={row.stock > 20 ? "default" : row.stock > 0 ? "secondary" : "destructive"}>
          {row.stock > 0 ? `${row.stock} in stock` : "Out of stock"}
        </Badge>
      ),
    },
    {
      header: "Colors",
      accessorKey: "colorsCount",
      cell: (row) => row.colorsCount,
    },
    {
      header: "Rating",
      accessorKey: "rating",
      cell: (row) => (row.rating ? `${row.rating} stars` : "No rating"),
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
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${row.id}/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="flex items-center text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </form>
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
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable columns={columns} data={filteredProducts} />
    </div>
  )
}
