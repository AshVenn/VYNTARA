"use client"

import { useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { updateStoreSettings } from "@/app/actions/store-settings"

const formatCents = (value) => (value / 100).toFixed(2)

export default function SettingsFormClient({ settings }) {
  const [isPending, startTransition] = useTransition()

  const onSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      try {
        await updateStoreSettings(formData)
        toast.success("Settings saved")
      } catch (error) {
        toast.error(error?.message || "Failed to save settings")
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your store settings and preferences</p>
      </div>

      {/* Store Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Store Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="store-name">Store Name</Label>
            <Input id="store-name" defaultValue="VYNTARA" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="store-email">Contact Email</Label>
            <Input id="store-email" type="email" defaultValue="contact@vyntara.com" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="store-phone">Phone Number</Label>
            <Input id="store-phone" type="tel" defaultValue="+1 (555) 123-4567" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="store-description">Store Description</Label>
            <Textarea
              id="store-description"
              defaultValue="Premium print-on-demand t-shirts with unique artistic designs"
              className="mt-2"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Shipping Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Shipping Settings</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="shipping-fee">Standard Shipping Fee</Label>
            <Input
              id="shipping-fee"
              name="shippingStandard"
              type="number"
              min="0"
              step="0.01"
              defaultValue={formatCents(settings.shippingStandardCents)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="express-shipping-fee">Express Shipping Fee</Label>
            <Input
              id="express-shipping-fee"
              name="shippingExpress"
              type="number"
              min="0"
              step="0.01"
              defaultValue={formatCents(settings.shippingExpressCents)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="free-shipping">Free Shipping Threshold</Label>
            <Input
              id="free-shipping"
              name="freeShippingThreshold"
              type="number"
              min="0"
              step="0.01"
              defaultValue={formatCents(settings.freeShippingThresholdCents)}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">Orders above this amount qualify for free shipping</p>
          </div>
          <div>
            <Label htmlFor="processing-time">Processing Time (days)</Label>
            <Input id="processing-time" type="number" defaultValue="2" className="mt-2" />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Notifications</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Order Notifications</p>
              <p className="text-sm text-muted-foreground">Receive emails for new orders</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Low Stock Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Customer Messages</p>
              <p className="text-sm text-muted-foreground">Notifications for customer inquiries</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* Tax Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Tax Settings</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
            <Input id="tax-rate" type="number" defaultValue="8.5" step="0.1" className="mt-2" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Include Tax in Prices</p>
              <p className="text-sm text-muted-foreground">Display prices with tax included</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
