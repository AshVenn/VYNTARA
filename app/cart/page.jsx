"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { formatMoney } from "@/lib/utils"
import { Trash2, ShoppingBag, Plus, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getCartItems, setCartItems } from "@/lib/cart"

export default function CartPage() {
  const [cartItems, setCartItemsState] = useState([])
  const [couponCode, setCouponCode] = useState("")

  useEffect(() => {
    setCartItemsState(getCartItems())
  }, [])

  useEffect(() => {
    setCartItems(cartItems)
  }, [cartItems])

  const updateQuantity = (itemId, newQty) => {
    if (newQty < 1) return
    setCartItemsState(cartItems.map((item) => (item.id === itemId ? { ...item, qty: newQty } : item)))
  }

  const removeItem = (itemId) => {
    setCartItemsState(cartItems.filter((item) => item.id !== itemId))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = subtotal > 100 ? 0 : 10
  const tax = subtotal * 0.09
  const total = subtotal + shipping + tax

  if (cartItems.length === 0) {
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
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg">
              <div className="w-24 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
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

        {/* Order Summary */}
        <div>
          <div className="border border-border rounded-lg p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            {/* Coupon Code */}
            <div className="mb-6">
              <div className="flex gap-2">
                <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                <Button variant="outline">Apply</Button>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shipping === 0 ? "Free" : formatMoney(shipping)}</span>
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

            {shipping === 10 && (
              <p className="text-xs text-muted-foreground mb-6">
                Add {formatMoney(100 - subtotal)} more to get free shipping
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
