"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { formatMoney } from "@/lib/utils"
import { Trash2, ShoppingBag, Plus, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { getStoreSettings } from "@/app/actions/store-settings"
import { ScrollArea } from "@/components/ui/scroll-area"
import { validateCoupon } from "@/app/actions/coupons"
import { calculateCouponDiscount } from "@/lib/coupons"
import { toast } from "sonner"

export default function CartPage() {
  const { items, updateItem, removeItem, isLoaded, coupon, applyCoupon, clearCoupon } = useCart()
  const [couponCode, setCouponCode] = useState(coupon?.code || "")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [shippingSettings, setShippingSettings] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getStoreSettings()
        setShippingSettings(settings)
      } catch (error) {
        console.error("Failed to load shipping settings:", error)
      } finally {
        setLoadingSettings(false)
      }
    }

    loadSettings()
  }, [])

  useEffect(() => {
    setCouponCode(coupon?.code || "")
  }, [coupon?.code])

  const updateQuantity = (itemId, newQty) => {
    if (newQty < 1) {
      removeItem(itemId)
      return
    }
    updateItem(itemId, newQty)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code")
      return
    }
    setIsApplyingCoupon(true)
    try {
      const result = await validateCoupon(couponCode)
      if (result.success) {
        applyCoupon(result.coupon)
        toast.success("Coupon applied")
      } else {
        toast.error(result.error || "Coupon not valid")
      }
    } catch (error) {
      toast.error("Unable to apply coupon")
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    clearCoupon()
    setCouponCode("")
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const subtotalCents = Math.round(subtotal * 100)
  const discountCents = calculateCouponDiscount(subtotalCents, coupon)
  const discountedSubtotalCents = Math.max(0, subtotalCents - discountCents)
  const shippingStandard = shippingSettings?.shippingStandardCents ?? 0
  const freeShippingThreshold = shippingSettings?.freeShippingThresholdCents ?? 0
  const qualifiesFreeShipping = freeShippingThreshold > 0 && subtotalCents >= freeShippingThreshold
  const shipping = (qualifiesFreeShipping ? 0 : shippingStandard) / 100
  const formatShipping = (amount) => (amount === 0 ? "Free" : formatMoney(amount))
  const taxCents = Math.round(discountedSubtotalCents * 0.09)
  const tax = taxCents / 100
  const total = discountedSubtotalCents / 100 + shipping + tax

  if (!isLoaded || loadingSettings) {
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
          description="Add some products to your cart to get started"
          action={{
            label: "Shop Now",
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
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / <span className="text-foreground">Shopping Bag</span>
      </nav>

      <h1 className="text-4xl font-bold tracking-tight mb-8">Shopping Bag</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <ScrollArea className="max-h-[70vh] pr-3">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg">
                  <div className="w-24 h-32 bg-muted rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={item.productImage || "/placeholder.svg"}
                      alt={item.productTitle}
                      width={96}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold mb-1">{item.productTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.variant.color} / {item.variant.size} / {item.variant.fit}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(item.id, item.qty - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-lg font-semibold">{formatMoney(item.price * item.qty)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Order Summary */}
        <div>
          <div className="border border-border rounded-lg p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            {/* Coupon Code */}
            <div className="mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={Boolean(coupon)}
                />
                {coupon ? (
                  <Button variant="outline" onClick={handleRemoveCoupon} className="bg-transparent">
                    Remove
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon}
                    className="bg-transparent"
                  >
                    {isApplyingCoupon ? "..." : "Apply"}
                  </Button>
                )}
              </div>
              {coupon && (
                <p className="text-xs text-muted-foreground mt-2">
                  Applied: <span className="font-medium text-foreground">{coupon.code}</span>
                  {coupon.description ? ` - ${coupon.description}` : ""}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              {discountCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount ({coupon.code})</span>
                  <span className="text-green-600">-{formatMoney(discountCents / 100)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatShipping(shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(tax)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>

            {freeShippingThreshold > 0 && shipping > 0 && (
              <p className="text-xs text-muted-foreground mb-6">
                Add {formatMoney(Math.max(0, freeShippingThreshold / 100 - subtotal))} more to get free shipping
              </p>
            )}

            <Button size="lg" className="w-full mb-3" asChild>
              <Link href="/checkout">Continue to Checkout</Link>
            </Button>

            <Button variant="outline" size="lg" className="w-full bg-transparent" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
