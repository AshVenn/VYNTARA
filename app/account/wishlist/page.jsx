import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ProductCard } from "@/components/shared/product-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Heart } from "lucide-react"

export default async function WishlistPage() {
  const session = await getServerSession(authOptions)
  const favorites = session?.user
    ? await prisma.favorite.findMany({
        where: { userId: session.user.id },
        include: { product: { include: { variants: true } } },
      })
    : []

  if (favorites.length === 0) {
    return (
      <div className="bg-background rounded-lg border border-border">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save your favorite items for later"
          action={{
            label: "Browse Products",
            href: "/products",
          }}
        />
      </div>
    )
  }

  return (
    <div className="bg-background rounded-lg border border-border p-6">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {favorites.map((favorite) => (
          <ProductCard key={favorite.product.id} product={favorite.product} isFavorite canFavorite />
        ))}
      </div>
    </div>
  )
}
