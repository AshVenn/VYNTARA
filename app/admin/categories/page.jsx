import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { createCategory, updateCategory, deleteCategory } from "@/app/admin/actions"
import ImageUploader from "@/components/admin/image-uploader"

export default async function AdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground mt-1">Create and manage product categories</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Add Category</h2>
        <form action={createCategory} className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Streetwear" className="mt-2" required />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" placeholder="streetwear" className="mt-2" required />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="imageManual">Image URL (optional)</Label>
            <Input id="imageManual" name="imageManual" placeholder="/placeholder.svg" className="mt-2" />
          </div>
          <div className="md:col-span-3">
            <ImageUploader label="Upload Image" name="image" publicIdName="imagePublicId" />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button type="submit">Create Category</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Existing Categories</h2>
        <div className="space-y-4">
          {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
          {categories.map((category) => (
            <div key={category.id} className="border border-border rounded-lg p-4">
              <form action={updateCategory} className="grid gap-4 md:grid-cols-4 items-end">
                <input type="hidden" name="id" value={category.id} />
                <div>
                  <Label htmlFor={`name-${category.id}`}>Name</Label>
                  <Input
                    id={`name-${category.id}`}
                    name="name"
                    defaultValue={category.name}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`slug-${category.id}`}>Slug</Label>
                  <Input
                    id={`slug-${category.id}`}
                    name="slug"
                    defaultValue={category.slug}
                    className="mt-2"
                    required
                  />
                </div>
                <div className="md:col-span-4">
                  <Label htmlFor={`imageManual-${category.id}`}>Image URL (optional)</Label>
                  <Input
                    id={`imageManual-${category.id}`}
                    name="imageManual"
                    defaultValue={category.image || ""}
                    className="mt-2"
                  />
                </div>
                <div className="md:col-span-4">
                  <ImageUploader
                    label="Upload Image"
                    name="image"
                    publicIdName="imagePublicId"
                    initial={category.image ? [{ url: category.image, publicId: category.imagePublicId }] : []}
                  />
                </div>
                <div className="flex gap-2 md:justify-end md:col-span-4">
                  <Button type="submit" variant="outline">
                    Save
                  </Button>
                </div>
              </form>
              <form action={deleteCategory} className="mt-3">
                <input type="hidden" name="id" value={category.id} />
                <Button type="submit" variant="destructive">
                  Delete
                </Button>
              </form>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
