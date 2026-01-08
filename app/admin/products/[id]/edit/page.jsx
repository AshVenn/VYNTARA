import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { updateProduct } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ImageUploader from "@/components/admin/image-uploader"
import VariantsEditor from "@/components/admin/variants-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const resolveParamId = async (params) => {
  const resolvedParams =
    params && typeof params.then === "function" ? await params : params
  return resolvedParams?.id
}

export default async function EditProductPage({ params }) {
  const id = await resolveParamId(params)
  if (!id) {
    notFound()
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  })

  if (!product) {
    notFound()
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  const initialVariants = product.variants.map((variant) => ({
    size: variant.size,
    color: variant.color,
    fit: variant.fit,
    priceCents: variant.priceCents,
    sku: variant.sku,
    available: variant.available,
  }))

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Update product details and variants</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Back to Products</Link>
        </Button>
      </div>

      <Card className="p-6">
        <form action={updateProduct} className="space-y-6">
          <input type="hidden" name="id" value={product.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={product.title} className="mt-2" required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={product.slug} className="mt-2" required />
              <p className="text-xs text-muted-foreground mt-2">Lowercase, numbers, and hyphens only.</p>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={product.description} rows={4} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Aim for 50-160 characters for SEO.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select name="categoryId" defaultValue={product.categoryId} required>
                <SelectTrigger id="categoryId" className="mt-2 w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="featured" className="h-4 w-4" defaultChecked={product.featured} />
                Featured product
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="bestSelling" className="h-4 w-4" defaultChecked={product.bestSelling} />
                Best selling
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" name="tags" defaultValue={product.tags.join(", ")} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="imagesManual">Images (comma separated URLs)</Label>
              <Input
                id="imagesManual"
                name="imagesManual"
                defaultValue={product.images.join(", ")}
                className="mt-2"
              />
            </div>
          </div>

          <ImageUploader
            label="Product Images"
            name="images"
            publicIdName="imagesPublicIds"
            multiple
            initial={product.images.map((url, index) => ({
              url,
              publicId: product.imagesPublicIds[index] || "",
            }))}
          />

          <VariantsEditor name="variants" initialVariants={initialVariants} />

          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
