"use client"

import { useEffect, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatMoney } from "@/lib/utils"
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MapPin, 
  Truck, 
  CreditCard, 
  Check, 
  AlertCircle,
  ShieldCheck,
  Package,
  Loader2,
  Edit2,
  Trash2
} from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { createOrder } from "@/app/actions/checkout"
import { getUserAddresses, createAddress, deleteAddress, validateUserAddress } from "@/app/actions/address"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

const STEPS = [
  { id: "address", label: "Address", icon: MapPin },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
]

const COUNTRIES = [
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Australia", label: "Australia" },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart, isLoaded } = useCart()
  const [currentStep, setCurrentStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  
  // Address state
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [addressValidated, setAddressValidated] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  
  // New address form
  const [newAddress, setNewAddress] = useState({
    label: "",
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "United States",
  })
  
  // Shipping & Payment
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Load saved addresses
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addresses = await getUserAddresses()
        setSavedAddresses(addresses)
        if (addresses.length > 0) {
          setSelectedAddressId(addresses[0].id)
        } else {
          setIsAddingNew(true)
        }
      } catch (error) {
        console.error("Failed to load addresses:", error)
      } finally {
        setLoadingAddresses(false)
      }
    }
    loadAddresses()
  }, [])

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shippingCost = shippingMethod === "express" ? 20 : shippingMethod === "standard" ? 10 : 0
  const tax = subtotal * 0.09
  const total = subtotal + shippingCost + tax

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId)

  const handleValidateAddress = async () => {
    const addressToValidate = isAddingNew ? newAddress : selectedAddress
    if (!addressToValidate) {
      toast.error("Please select or enter an address")
      return
    }

    setIsValidating(true)
    try {
      const result = await validateUserAddress(addressToValidate)
      if (result.success) {
        setAddressValidated(true)
        toast.success("Address validated successfully")
      } else {
        toast.error(result.error || "Address validation failed")
      }
    } catch (error) {
      toast.error("Unable to validate address")
    } finally {
      setIsValidating(false)
    }
  }

  const handleSaveNewAddress = async () => {
    if (!newAddress.label) {
      toast.error("Please enter a label for this address")
      return
    }
    if (!newAddress.fullName || !newAddress.line1 || !newAddress.city || !newAddress.region || !newAddress.postalCode) {
      toast.error("Please fill in all required fields")
      return
    }

    startTransition(async () => {
      const result = await createAddress(newAddress)
      if (result.success) {
        setSavedAddresses((prev) => [result.address, ...prev])
        setSelectedAddressId(result.address.id)
        setIsAddingNew(false)
        setShowAddressDialog(false)
        setNewAddress({
          label: "",
          fullName: "",
          phone: "",
          line1: "",
          line2: "",
          city: "",
          region: "",
          postalCode: "",
          country: "United States",
        })
        toast.success("Address saved successfully")
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDeleteAddress = async (id) => {
    startTransition(async () => {
      const result = await deleteAddress(id)
      if (result.success) {
        setSavedAddresses((prev) => prev.filter((a) => a.id !== id))
        if (selectedAddressId === id) {
          setSelectedAddressId(savedAddresses.find((a) => a.id !== id)?.id || null)
        }
        toast.success("Address deleted")
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!selectedAddressId && !isAddingNew) {
        toast.error("Please select a shipping address")
        return
      }
      if (isAddingNew && (!newAddress.fullName || !newAddress.line1 || !newAddress.city)) {
        toast.error("Please fill in the address details")
        return
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handlePlaceOrder = () => {
    if (!items.length) {
      toast.error("Your cart is empty")
      return
    }
    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions")
      return
    }

    const payload = {
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        qty: item.qty,
      })),
      shippingMethod,
      existingAddressId: isAddingNew ? null : selectedAddressId,
      address: isAddingNew ? {
        ...newAddress,
        email: "",
      } : null,
    }

    startTransition(async () => {
      try {
        const result = await createOrder(payload)
        clearCart()
        toast.success("Order placed successfully!")
        router.push(`/account/orders/${result.orderId}`)
      } catch (error) {
        toast.error(error.message || "Failed to place order")
      }
    })
  }

  if (!isLoaded || loadingAddresses) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading checkout...</span>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Add some items to your cart to checkout</p>
        <Button asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cart">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Cart
            </Link>
          </Button>
          <Link href="/" className="text-xl font-bold tracking-tighter">
            VYNTARA
          </Link>
          <div className="w-24" />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 md:mb-12">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => index < currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : index < currentStep
                      ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <step.icon className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={`w-8 md:w-16 h-0.5 mx-2 ${index < currentStep ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Address */}
            {currentStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {savedAddresses.length > 0 && !isAddingNew && (
                    <>
                      <RadioGroup value={selectedAddressId || ""} onValueChange={setSelectedAddressId}>
                        <div className="grid gap-3">
                          {savedAddresses.map((address) => (
                            <div
                              key={address.id}
                              className={`relative flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                                selectedAddressId === address.id ? "border-primary bg-primary/5" : "border-border"
                              }`}
                            >
                              <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                              <label htmlFor={address.id} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{address.fullName}</span>
                                  {address.label && (
                                    <Badge variant="secondary" className="text-xs">
                                      {address.label}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {address.line1}
                                  {address.line2 && `, ${address.line2}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.city}, {address.region} {address.postalCode}
                                </p>
                                <p className="text-sm text-muted-foreground">{address.country}</p>
                              </label>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleDeleteAddress(address.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>

                      {savedAddresses.length < 4 && (
                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() => setShowAddressDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Address
                        </Button>
                      )}
                    </>
                  )}

                  {(isAddingNew || savedAddresses.length === 0) && !showAddressDialog && (
                    <AddressForm
                      address={newAddress}
                      onChange={setNewAddress}
                      onSave={handleSaveNewAddress}
                      isPending={isPending}
                      showSaveButton={savedAddresses.length < 4}
                    />
                  )}

                  {selectedAddress && (
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={handleValidateAddress}
                        disabled={isValidating}
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : addressValidated ? (
                          <>
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                            Address Validated
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Validate Address
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Shipping */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                    <div className="space-y-3">
                      <label
                        htmlFor="standard"
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          shippingMethod === "standard" ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="standard" id="standard" />
                          <div>
                            <p className="font-medium">Standard Shipping</p>
                            <p className="text-sm text-muted-foreground">5-7 business days</p>
                          </div>
                        </div>
                        <span className="font-semibold">{formatMoney(10)}</span>
                      </label>

                      <label
                        htmlFor="express"
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          shippingMethod === "express" ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="express" id="express" />
                          <div>
                            <p className="font-medium">Express Shipping</p>
                            <p className="text-sm text-muted-foreground">2-3 business days</p>
                          </div>
                        </div>
                        <span className="font-semibold">{formatMoney(20)}</span>
                      </label>
                    </div>
                  </RadioGroup>

                  {selectedAddress && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Shipping to:</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAddress.fullName}, {selectedAddress.line1}, {selectedAddress.city},{" "}
                        {selectedAddress.region} {selectedAddress.postalCode}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This is a demo checkout. No real payment will be processed.
                    </AlertDescription>
                  </Alert>

                  <div className="p-6 border border-dashed border-border rounded-lg text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Payment integration placeholder</p>
                    <p className="text-sm text-muted-foreground">
                      In production, integrate Stripe, PayPal, or other payment providers
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={setAgreedToTerms}
                    />
                    <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <Link href="#" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="#" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" className="flex-1 bg-transparent" onClick={handlePrevStep}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {currentStep < STEPS.length - 1 ? (
                <Button className="flex-1" onClick={handleNextStep}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={handlePlaceOrder}
                  disabled={isPending || !agreedToTerms}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Place Order - {formatMoney(total)}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-75 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-20 bg-muted rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={item.productImage || "/placeholder.svg"}
                          alt={item.productTitle}
                          fill
                          className="object-cover"
                        />
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {item.qty}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.variant.color} / {item.variant.size}
                        </p>
                        <p className="text-sm font-medium mt-1">{formatMoney(item.price * item.qty)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatMoney(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatMoney(tax)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatMoney(total)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Secure checkout - Your data is protected</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              You can save up to 4 addresses. ({savedAddresses.length}/4 used)
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            address={newAddress}
            onChange={setNewAddress}
            onSave={handleSaveNewAddress}
            isPending={isPending}
            showSaveButton={false}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressDialog(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSaveNewAddress} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddressForm({ address, onChange, onSave, isPending, showSaveButton = true }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="label">Address Label</Label>
        <Input
          id="label"
          placeholder="Home, Work, etc."
          value={address.label}
          onChange={(e) => onChange({ ...address, label: e.target.value })}
          className="mt-1.5"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={address.fullName}
            onChange={(e) => onChange({ ...address, fullName: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="+1 (555) 123-4567"
            value={address.phone}
            onChange={(e) => onChange({ ...address, phone: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="line1">Street Address *</Label>
        <Input
          id="line1"
          placeholder="123 Main St"
          value={address.line1}
          onChange={(e) => onChange({ ...address, line1: e.target.value })}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="line2">Apartment, suite, etc.</Label>
        <Input
          id="line2"
          placeholder="Apt 4B"
          value={address.line2}
          onChange={(e) => onChange({ ...address, line2: e.target.value })}
          className="mt-1.5"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="San Francisco"
            value={address.city}
            onChange={(e) => onChange({ ...address, city: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="region">State/Region *</Label>
          <Input
            id="region"
            placeholder="CA"
            value={address.region}
            onChange={(e) => onChange({ ...address, region: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input
            id="postalCode"
            placeholder="94102"
            value={address.postalCode}
            onChange={(e) => onChange({ ...address, postalCode: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="country">Country *</Label>
          <Select value={address.country} onValueChange={(value) => onChange({ ...address, country: value })}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {showSaveButton && (
        <Button onClick={onSave} disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Address
        </Button>
      )}
    </div>
  )
}
