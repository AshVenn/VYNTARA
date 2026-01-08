"use client"

import { ProductCard } from "@/components/shared/product-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Heart } from "lucide-react"
import { products } from "@/lib/data/products"

export default function WishlistPage() {
  // Mock wishlist - first 3 products
  const wishlistProducts = products.slice(0, 3)

  if (wishlistProducts.length === 0) {
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
        {wishlistProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
