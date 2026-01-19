"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/shared/product-card"
import { formatMoney } from "@/lib/utils"
import { Heart, Truck, Shield, RotateCcw, Star, ChevronLeft, ChevronRight, ShoppingBag, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCart } from "@/lib/cart-context"
import FavoriteButton from "@/components/shared/favorite-button"
import { toast } from "sonner"

export default function ProductDetailClient({ product, relatedProducts, isFavorite, canFavorite }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedFit, setSelectedFit] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  const currentVariant = product.variants.find(
    (variant) => variant.size === selectedSize && variant.color === selectedColor && variant.fit === selectedFit,
  )

  const availableColors = [
    ...new Set(
      product.variants
        .filter((variant) =>
          variant.available &&
          (!selectedSize || variant.size === selectedSize) &&
          (!selectedFit || variant.fit === selectedFit)
        )
        .map((variant) => variant.color),
    ),
  ]

  const availableSizes = [
    ...new Set(
      product.variants
        .filter((variant) =>
          variant.available &&
          (!selectedColor || variant.color === selectedColor) &&
          (!selectedFit || variant.fit === selectedFit)
        )
        .map((variant) => variant.size),
    ),
  ]

  const availableFits = [
    ...new Set(
      product.variants
        .filter((variant) =>
          variant.available &&
          (!selectedColor || variant.color === selectedColor) &&
          (!selectedSize || variant.size === selectedSize)
        )
        .map((variant) => variant.fit),
    ),
  ]

  const price = currentVariant
    ? currentVariant.priceCents / 100
    : Math.min(...product.variants.map((variant) => variant.priceCents / 100))

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor || !selectedFit || !currentVariant) {
      toast.error("Please select size, color, and fit")
      return
    }

    addItem({
      id: `${product.id}-${currentVariant.id}`,
      productId: product.id,
      variantId: currentVariant.id,
      productTitle: product.title,
      productImage: product.images[0] || "/placeholder.svg",
      variant: {
        size: currentVariant.size,
        color: currentVariant.color,
        fit: currentVariant.fit,
      },
      price: price,
      qty: quantity,
    })
    toast.success("Added to cart", {
      description: `${product.title} - ${currentVariant.color} / ${currentVariant.size}`,
      action: {
        label: "View Cart",
        onClick: () => window.location.href = "/cart"
      }
    })
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>{" "}
          / <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <div className="aspect-3/4 bg-muted overflow-hidden mb-4 relative group">
              <Image
                src={product.images[selectedImageIndex] || "/placeholder.svg"}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square bg-muted overflow-hidden border-2 ${
                    selectedImageIndex === index ? "border-primary" : "border-transparent"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.title} ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6">
              <h1 className="text-4xl font-bold tracking-tight mb-2">{product.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold">{formatMoney(price)}</div>
                {product.ratingCount > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-medium">{product.ratingAvg}</span>
                    <span className="text-muted-foreground">({product.ratingCount})</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-sm">MRP incl. of all taxes</p>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8">{product.description}</p>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Color</Label>
                {selectedColor && <span className="text-sm text-muted-foreground">{selectedColor}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => (
                  <Button
                    key={color}
                    variant={selectedColor === color ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Size</Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      Size Guide
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Size Guide</DialogTitle>
                      <DialogDescription>Find the best fit using our size chart.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Size</th>
                            <th className="text-left py-2">Chest (in)</th>
                            <th className="text-left py-2">Length (in)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2">XS</td>
                            <td className="py-2">34-36</td>
                            <td className="py-2">26</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">S</td>
                            <td className="py-2">36-38</td>
                            <td className="py-2">27</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">M</td>
                            <td className="py-2">38-40</td>
                            <td className="py-2">28</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">L</td>
                            <td className="py-2">40-42</td>
                            <td className="py-2">29</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2">XL</td>
                            <td className="py-2">42-44</td>
                            <td className="py-2">30</td>
                          </tr>
                          <tr>
                            <td className="py-2">2X</td>
                            <td className="py-2">44-46</td>
                            <td className="py-2">31</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <Label className="text-sm font-semibold mb-3 block">Fit</Label>
              <div className="flex flex-wrap gap-2">
                {availableFits.map((fit) => (
                  <Button
                    key={fit}
                    variant={selectedFit === fit ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFit(fit)}
                  >
                    {fit}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <Label className="text-sm font-semibold mb-3 block">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                  +
                </Button>
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                Add to Cart
              </Button>
              {canFavorite ? (
                <div className="relative">
                  <FavoriteButton productId={product.id} initial={isFavorite} />
                </div>
              ) : (
                <Button size="lg" variant="outline">
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
                </Button>
              )}
            </div>

            <div className="space-y-3 text-sm border-t border-border pt-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span>Secure checkout</span>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="border-t border-border pt-16">
            <h2 className="text-2xl font-bold tracking-tight mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} isFavorite={false} canFavorite={canFavorite} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Label({ children, className = "", ...props }) {
  return (
    <label className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  )
}
