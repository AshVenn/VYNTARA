"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"
import { getUserAddresses, createAddress, updateAddress, deleteAddress, validateUserAddress } from "@/app/actions/address"
import { toast } from "sonner"
import { 
  User, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Check, 
  ShieldCheck,
  Home,
  Building2,
  X
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const MAX_ADDRESSES = 4

const COUNTRIES = [
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Australia", label: "Australia" },
]

const emptyAddress = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "United States",
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  
  // Profile state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  
  // Address state
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressForm, setAddressForm] = useState(emptyAddress)
  const [deletingId, setDeletingId] = useState(null)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
    }
  }, [session])

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = async () => {
    try {
      const data = await getUserAddresses()
      setAddresses(data)
    } catch (error) {
      toast.error("Failed to load addresses")
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    toast.success("Profile updated successfully")
  }

  const openAddDialog = () => {
    setEditingAddress(null)
    setAddressForm(emptyAddress)
    setShowAddressDialog(true)
  }

  const openEditDialog = (address) => {
    setEditingAddress(address)
    setAddressForm({
      label: address.label || "",
      fullName: address.fullName,
      phone: address.phone || "",
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
    })
    setShowAddressDialog(true)
  }

  const handleValidateAddress = async () => {
    setIsValidating(true)
    try {
      const result = await validateUserAddress(addressForm)
      if (result.success) {
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

  const handleSaveAddress = async () => {
    if (!addressForm.fullName || !addressForm.line1 || !addressForm.city || !addressForm.region || !addressForm.postalCode) {
      toast.error("Please fill in all required fields")
      return
    }

    startTransition(async () => {
      if (editingAddress) {
        const result = await updateAddress(editingAddress.id, addressForm)
        if (result.success) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === editingAddress.id ? result.address : a))
          )
          toast.success("Address updated")
          setShowAddressDialog(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createAddress(addressForm)
        if (result.success) {
          setAddresses((prev) => [result.address, ...prev])
          toast.success("Address added")
          setShowAddressDialog(false)
        } else {
          toast.error(result.error)
        }
      }
    })
  }

  const handleDeleteAddress = async () => {
    if (!deletingId) return

    startTransition(async () => {
      const result = await deleteAddress(deletingId)
      if (result.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== deletingId))
        toast.success("Address deleted")
      } else {
        toast.error(result.error)
      }
      setDeletingId(null)
    })
  }

  const getLabelIcon = (label) => {
    if (!label) return MapPin
    const lower = label.toLowerCase()
    if (lower.includes("home")) return Home
    if (lower.includes("work") || lower.includes("office")) return Building2
    return MapPin
  }

  if (!session?.user) return null

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>Manage your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  disabled
                />
              </div>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Saved Addresses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Saved Addresses
              </CardTitle>
              <CardDescription>
                Manage your shipping addresses ({addresses.length}/{MAX_ADDRESSES})
              </CardDescription>
            </div>
            {addresses.length < MAX_ADDRESSES && (
              <Button onClick={openAddDialog} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingAddresses ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No saved addresses yet</p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {addresses.map((address) => {
                const LabelIcon = getLabelIcon(address.label)
                return (
                  <div
                    key={address.id}
                    className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <LabelIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
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
                      {address.phone && (
                        <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(address)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingId(address.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update your address details"
                : `You can save up to ${MAX_ADDRESSES} addresses.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="label">Address Label</Label>
              <Input
                id="label"
                placeholder="Home, Work, etc."
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="line1">Street Address *</Label>
              <Input
                id="line1"
                placeholder="123 Main St"
                value={addressForm.line1}
                onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="line2">Apartment, suite, etc.</Label>
              <Input
                id="line2"
                placeholder="Apt 4B"
                value={addressForm.line2}
                onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="San Francisco"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="region">State/Region *</Label>
                <Input
                  id="region"
                  placeholder="CA"
                  value={addressForm.region}
                  onChange={(e) => setAddressForm({ ...addressForm, region: e.target.value })}
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
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={addressForm.country}
                  onValueChange={(value) => setAddressForm({ ...addressForm, country: value })}
                >
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
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleValidateAddress}
              disabled={isValidating}
              className="bg-transparent"
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              Validate
            </Button>
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="outline" onClick={() => setShowAddressDialog(false)} className="bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleSaveAddress} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingAddress ? "Update" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddress} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
