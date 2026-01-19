"use client"

import { useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/shared/product-card"
import { useCart } from "@/lib/cart-context"

export default function ProductCardWithCart({ product, isFavorite, canFavorite, imagePriority = false }) {
  const { addItem } = useCart()
  const defaultVariant = useMemo(() => {
    const variants = product.variants || []
    return variants.find((variant) => variant.available) || variants[0] || null
  }, [product.variants])

  const handleAddToCart = () => {
    if (!defaultVariant) {
      toast.error("This product is currently unavailable.")
      return
    }

    addItem({
      id: `${product.id}-${defaultVariant.id}`,
      productId: product.id,
      variantId: defaultVariant.id,
      productTitle: product.title,
      productImage: product.images?.[0] || "/placeholder.svg",
      variant: {
        size: defaultVariant.size,
        color: defaultVariant.color,
        fit: defaultVariant.fit,
      },
      price: defaultVariant.priceCents / 100,
      qty: 1,
    })
    toast.success("Added to cart")
  }

  return (
    <div className="space-y-3">
      <ProductCard product={product} isFavorite={isFavorite} canFavorite={canFavorite} imagePriority={imagePriority} />
      <Button size="sm" className="w-full" onClick={handleAddToCart} disabled={!defaultVariant}>
        Add to Cart
      </Button>
    </div>
  )
}
