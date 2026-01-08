import Link from "next/link"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import ProductsTable from "@/components/admin/products-table"
import { deleteProduct } from "@/app/admin/actions"

export default async function AdminProducts() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true,
      reviews: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const tableData = products.map((product) => {
    const priceCents =
      product.variants.length > 0
        ? product.variants.reduce(
            (lowest, variant) => (variant.priceCents < lowest ? variant.priceCents : lowest),
            product.variants[0].priceCents,
          )
        : null
    const colors = new Set(product.variants.map((variant) => variant.color))
    const rating =
      product.reviews.length > 0
        ? (
            product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          ).toFixed(1)
        : null

    return {
      id: product.id,
      title: product.title,
      category: product.category?.name || "Uncategorized",
      priceCents,
      stock: product.variants.filter((variant) => variant.available).length,
      colorsCount: colors.size,
      image: product.images[0] || null,
      rating,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">Add Product</Link>
        </Button>
      </div>

      <ProductsTable products={tableData} deleteAction={deleteProduct} />
    </div>
  )
}
