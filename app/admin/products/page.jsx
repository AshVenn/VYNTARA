"use client"

import { useState } from "react"
import { DataTable } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { products } from "@/lib/data/products"
import { categories } from "@/lib/data/categories"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("")

  const normalizedProducts = products.map((product) => {
    const name = product.title ?? product.name ?? "Untitled"
    const categoryName =
      categories.find((category) => category.id === product.categoryId)?.name ??
      product.category ??
      "Uncategorized"
    const colors = Array.from(new Set((product.variants ?? []).map((variant) => variant.color).filter(Boolean)))
    const stock = (product.variants ?? []).filter((variant) => variant.available).length
    const price =
      product.price ??
      (product.variants ?? []).reduce(
        (lowest, variant) => (typeof variant.price === "number" && variant.price < lowest ? variant.price : lowest),
        Number.POSITIVE_INFINITY,
      )

    return {
      ...product,
      name,
      category: categoryName,
      colors,
      stock,
      price: Number.isFinite(price) ? price : "N/A",
      rating: product.ratingAvg ?? product.rating ?? null,
    }
  })

  const normalizedQuery = searchQuery.toLowerCase()
  const filteredProducts = normalizedProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery),
  )

  const columns = [
    {
      header: "Product",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.images?.[0] || "/placeholder.svg"} alt={row.name} className="w-12 h-12 object-cover" />
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: (row) => (typeof row.price === "number" ? `$${row.price}` : row.price),
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
      accessorKey: "colors",
      cell: (row) => row.colors.length,
    },
    {
      header: "Rating",
      accessorKey: "rating",
      cell: (row) => (row.rating ? row.rating + " stars" : "No rating"),
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
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredProducts} />
    </div>
  )
}
