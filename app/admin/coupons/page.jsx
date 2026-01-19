import prisma from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCoupon, updateCoupon, deleteCoupon } from "@/app/admin/actions"

const formatDiscountValue = (coupon) =>
  coupon.discountType === "AMOUNT" ? (coupon.discountValue / 100).toFixed(2) : String(coupon.discountValue)

export default async function AdminCoupons() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
        <p className="text-muted-foreground mt-1">Create discount codes for your store</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Add Coupon</h2>
        <form action={createCoupon} className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" placeholder="WELCOME10" className="mt-2" required />
          </div>
          <div>
            <Label htmlFor="discountType">Type</Label>
            <select
              id="discountType"
              name="discountType"
              defaultValue="PERCENT"
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="PERCENT">Percent</option>
              <option value="AMOUNT">Amount</option>
            </select>
          </div>
          <div>
            <Label htmlFor="discountValue">Value</Label>
            <Input
              id="discountValue"
              name="discountValue"
              type="number"
              min="0"
              step="0.01"
              placeholder="10"
              className="mt-2"
              required
            />
            <p className="text-xs text-muted-foreground mt-2">Percent uses whole numbers (1-100). Amount is USD.</p>
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" name="description" placeholder="First order discount" className="mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
            <Label htmlFor="isActive">Active</Label>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Create Coupon</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Existing Coupons</h2>
        <div className="space-y-4">
          {coupons.length === 0 && <p className="text-sm text-muted-foreground">No coupons yet.</p>}
          {coupons.map((coupon) => (
            <div key={coupon.id} className="border border-border rounded-lg p-4">
              <form action={updateCoupon} className="grid gap-4 md:grid-cols-2 items-end">
                <input type="hidden" name="id" value={coupon.id} />
                <div>
                  <Label htmlFor={`code-${coupon.id}`}>Code</Label>
                  <Input
                    id={`code-${coupon.id}`}
                    name="code"
                    defaultValue={coupon.code}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`discountType-${coupon.id}`}>Type</Label>
                  <select
                    id={`discountType-${coupon.id}`}
                    name="discountType"
                    defaultValue={coupon.discountType}
                    className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="PERCENT">Percent</option>
                    <option value="AMOUNT">Amount</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor={`discountValue-${coupon.id}`}>Value</Label>
                  <Input
                    id={`discountValue-${coupon.id}`}
                    name="discountValue"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={formatDiscountValue(coupon)}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`description-${coupon.id}`}>Description</Label>
                  <Input
                    id={`description-${coupon.id}`}
                    name="description"
                    defaultValue={coupon.description || ""}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id={`isActive-${coupon.id}`}
                    name="isActive"
                    type="checkbox"
                    defaultChecked={coupon.isActive}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`isActive-${coupon.id}`}>Active</Label>
                </div>
                <div className="flex gap-2 md:justify-end md:col-span-2">
                  <Button type="submit" variant="outline">
                    Save
                  </Button>
                </div>
              </form>
              <form action={deleteCoupon} className="mt-3">
                <input type="hidden" name="id" value={coupon.id} />
                <Button type="submit" variant="destructive">
                  Delete
                </Button>
              </form>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
