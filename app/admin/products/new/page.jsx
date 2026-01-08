import Link from "next/link"
import prisma from "@/lib/prisma"
import { createProduct } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ImageUploader from "@/components/admin/image-uploader"

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  const exampleVariants = JSON.stringify(
    [
      { size: "S", color: "Black", fit: "Regular", priceCents: 14900, sku: "SKU-S-B", available: true },
      { size: "M", color: "Black", fit: "Regular", priceCents: 14900, sku: "SKU-M-B", available: true },
    ],
    null,
    2,
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Product</h1>
          <p className="text-muted-foreground mt-1">Create a new product with variants</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Back to Products</Link>
        </Button>
      </div>

      <Card className="p-6">
        <form action={createProduct} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" className="mt-2" required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" className="mt-2" required />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} className="mt-2" required />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="featured" className="h-4 w-4" />
                Featured product
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="bestSelling" className="h-4 w-4" />
                Best selling
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" name="tags" className="mt-2" placeholder="streetwear, new" />
            </div>
            <div>
              <Label htmlFor="imagesManual">Images (comma separated URLs)</Label>
              <Input id="imagesManual" name="imagesManual" className="mt-2" placeholder="/image-1.jpg, /image-2.jpg" />
            </div>
          </div>

          <ImageUploader label="Product Images" name="images" publicIdName="imagesPublicIds" multiple />

          <div>
            <Label htmlFor="variants">Variants (JSON array)</Label>
            <Textarea
              id="variants"
              name="variants"
              rows={8}
              className="mt-2 font-mono text-xs"
              defaultValue={exampleVariants}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Create Product</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
