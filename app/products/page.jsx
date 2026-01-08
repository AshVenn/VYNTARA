import prisma from "@/lib/prisma"
import ProductsClient from "@/components/products/products-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { variants: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  const canFavorite = Boolean(session?.user)
  const favoriteIds = session?.user
    ? (
        await prisma.favorite.findMany({
          where: { userId: session.user.id },
          select: { productId: true },
        })
      ).map((favorite) => favorite.productId)
    : []

  return (
    <ProductsClient products={products} categories={categories} favoriteIds={favoriteIds} canFavorite={canFavorite} />
  )
}
