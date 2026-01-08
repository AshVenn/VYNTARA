"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { formatMoney } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"

// Mock cart data
const cartItems = [
  {
    id: 1,
    productTitle: "Basic Heavy Weight T-Shirt",
    productImage: "/black-heavyweight-oversized-tshirt.jpg",
    variant: { size: "L", color: "Black", fit: "Oversized" },
    price: 199,
    qty: 1,
  },
  {
    id: 2,
    productTitle: "Abstract Print Shirt",
    productImage: "/images/image.png",
    variant: { size: "L", color: "Black", fit: "Relaxed" },
    price: 99,
    qty: 1,
  },
]

export default function CheckoutPage() {
  const [step, setStep] = useState("information") // information, shipping, payment
  const [shippingMethod, setShippingMethod] = useState("standard")

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shippingCost = shippingMethod === "express" ? 20 : shippingMethod === "standard" ? 10 : 0
  const tax = subtotal * 0.09
  const total = subtotal + shippingCost + tax

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/cart">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Link>
        </Button>

        <h1 className="text-4xl font-bold tracking-tight mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === "information" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </div>
            <span
              className={`text-sm font-medium ${step === "information" ? "text-foreground" : "text-muted-foreground"}`}
            >
              Information
            </span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === "shipping" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <span
              className={`text-sm font-medium ${step === "shipping" ? "text-foreground" : "text-muted-foreground"}`}
            >
              Shipping
            </span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === "payment" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
            <span className={`text-sm font-medium ${step === "payment" ? "text-foreground" : "text-muted-foreground"}`}>
              Payment
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2">
            <div className="bg-background rounded-lg border border-border p-6">
              {step === "information" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Contact Info</h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" className="mt-2" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" placeholder="John" className="mt-2" />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" placeholder="Doe" className="mt-2" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select defaultValue="us">
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">United States</SelectItem>
                            <SelectItem value="ca">Canada</SelectItem>
                            <SelectItem value="uk">United Kingdom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" placeholder="123 Main St" className="mt-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input id="city" placeholder="San Francisco" className="mt-2" />
                        </div>
                        <div>
                          <Label htmlFor="state">State / Region</Label>
                          <Input id="state" placeholder="CA" className="mt-2" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="zip">Postal Code</Label>
                        <Input id="zip" placeholder="94102" className="mt-2" />
                      </div>
                    </div>
                  </div>

                  <Button size="lg" className="w-full" onClick={() => setStep("shipping")}>
                    Continue to Shipping
                  </Button>
                </div>
              )}

              {step === "shipping" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Shipping Method</h2>
                    <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="standard" id="standard" />
                            <Label htmlFor="standard" className="font-normal cursor-pointer">
                              <div className="font-semibold">Standard Shipping</div>
                              <div className="text-sm text-muted-foreground">5-7 business days</div>
                            </Label>
                          </div>
                          <div className="font-semibold">{formatMoney(10)}</div>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="express" id="express" />
                            <Label htmlFor="express" className="font-normal cursor-pointer">
                              <div className="font-semibold">Express Shipping</div>
                              <div className="text-sm text-muted-foreground">2-3 business days</div>
                            </Label>
                          </div>
                          <div className="font-semibold">{formatMoney(20)}</div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 bg-transparent"
                      onClick={() => setStep("information")}
                    >
                      Back
                    </Button>
                    <Button size="lg" className="flex-1" onClick={() => setStep("payment")}>
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              )}

              {step === "payment" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <p className="text-muted-foreground mb-4">Payment integration placeholder</p>
                      <p className="text-sm text-muted-foreground">
                        In a real app, integrate Stripe, PayPal, or other payment providers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox id="terms" />
                    <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                      I agree to the Terms and Conditions
                    </Label>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 bg-transparent"
                      onClick={() => setStep("shipping")}
                    >
                      Back
                    </Button>
                    <Button size="lg" className="flex-1">
                      Place Order
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="bg-background rounded-lg border border-border p-6 sticky top-20">
              <h2 className="text-xl font-bold mb-6">Your Order ({cartItems.length})</h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.productImage || "/placeholder.svg"}
                        alt={item.productTitle}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                        {item.qty}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium mb-1 truncate">{item.productTitle}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.variant.color} / {item.variant.size}
                      </p>
                      <p className="text-sm font-semibold mt-1">{formatMoney(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{step === "information" ? "Calculated at next step" : formatMoney(shippingCost)}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
