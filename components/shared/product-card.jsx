import Link from "next/link"
import Image from "next/image"
import { formatMoney } from "@/lib/utils"
import FavoriteButton from "@/components/shared/favorite-button"

export function ProductCard({ product, isFavorite = false, canFavorite = false, imagePriority = false }) {
  const variants = product.variants || []
  const variantPrices = variants.map((variant) =>
    typeof variant.price === "number" ? variant.price : variant.priceCents / 100,
  )
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden mb-3">
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.title}
            width={400}
            height={533}
            priority={imagePriority}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="space-y-1">
          <h3 className="font-medium text-sm leading-tight">{product.title}</h3>
          <p className="text-sm font-semibold">{formatMoney(minPrice)}</p>
          {product.ratingCount > 0 && (
            <p className="text-xs text-muted-foreground">
              ★ {product.ratingAvg} ({product.ratingCount})
            </p>
          )}
        </div>
      </Link>

      {canFavorite ? <FavoriteButton productId={product.id} initial={isFavorite} /> : null}
    </div>
  )
}
