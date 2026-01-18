"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { formatMoney } from "@/lib/utils"
import { Trash2, ShoppingBag, Plus, Minus, Tag, Truck, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function CartPage() {
  const { items, updateItem, removeItem, isLoaded } = useCart()
  const [couponCode, setCouponCode] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const updateQuantity = (itemId, newQty) => {
    if (newQty < 1) {
      removeItem(itemId)
      toast.success("Item removed from cart")
      return
    }
    updateItem(itemId, newQty)
  }

  const handleRemoveItem = (itemId, itemName) => {
    removeItem(itemId)
    toast.success(`${itemName} removed from cart`)
  }

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code")
      return
    }
    setIsApplyingCoupon(true)
    setTimeout(() => {
      toast.error("Invalid coupon code")
      setIsApplyingCoupon(false)
    }, 1000)
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = subtotal > 100 ? 0 : 10
  const tax = subtotal * 0.09
  const total = subtotal + shipping + tax

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading cart...</div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Start shopping to fill it up!"
          action={{
            label: "Start Shopping",
            href: "/products",
          }}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Shopping Bag</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Shopping Bag</h1>
        <p className="text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Link
                    href={`/products/${item.productId}`}
                    className="w-24 h-32 sm:w-28 sm:h-36 bg-muted rounded-lg overflow-hidden shrink-0tive group"
                  >
                    <Image
                      src={item.productImage || "/placeholder.svg"}
                      alt={item.productTitle}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between gap-2 mb-1">
                      <Link href={`/products/${item.productId}`} className="hover:underline">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-2">
                          {item.productTitle}
                        </h3>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id, item.productTitle)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {item.variant.color} / {item.variant.size} / {item.variant.fit}
                    </p>

                    <p className="text-sm font-medium mb-auto">
                      {formatMoney(item.price)}
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-border rounded-lg">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-r-none"
                          onClick={() => updateQuantity(item.id, item.qty - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-10 text-center">
                          {item.qty}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-l-none"
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-base sm:text-lg font-semibold">
                        {formatMoney(item.price * item.qty)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Truck className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Free Shipping</p>
                <p className="text-muted-foreground">On orders over $100</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Secure Checkout</p>
                <p className="text-muted-foreground">100% protected payments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Promo Code</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    className="bg-transparent"
                  >
                    {isApplyingCoupon ? "..." : "Apply"}
                  </Button>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Totals */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                    {shipping === 0 ? "Free" : formatMoney(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Tax</span>
                  <span>{formatMoney(tax)}</span>
                </div>
              </div>

              <Separator className="mb-4" />

              <div className="flex justify-between font-semibold text-lg mb-6">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>

              {shipping > 0 && subtotal < 100 && (
                <div className="mb-6 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-center">
                    Add <span className="font-semibold">{formatMoney(100 - subtotal)}</span> more for free shipping
                  </p>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (subtotal / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <Button size="lg" className="w-full mb-3" asChild>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>

              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
