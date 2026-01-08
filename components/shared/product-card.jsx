import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/utils"

export function ProductCard({ product }) {
  const minPrice = Math.min(...product.variants.map((v) => v.price))

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden mb-3">
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.title}
            width={400}
            height={533}
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

      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
      >
        <Heart className="h-4 w-4" />
        <span className="sr-only">Add to wishlist</span>
      </Button>
    </div>
  )
}
