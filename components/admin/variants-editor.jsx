"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"]
const FIT_OPTIONS = ["Regular", "Slim", "Oversized"]

const buildDefaultVariant = () => ({
  size: "M",
  color: "Black",
  fit: "Regular",
  priceCents: 14900,
  sku: "SKU-M-B",
  available: true,
})

export default function VariantsEditor({ name, initialVariants }) {
  const seedVariants = useMemo(() => {
    if (Array.isArray(initialVariants) && initialVariants.length > 0) {
      return initialVariants.map((variant) => ({
        size: variant.size || "M",
        color: variant.color || "Black",
        fit: variant.fit || "Regular",
        priceCents: Number(variant.priceCents) || 0,
        sku: variant.sku || "",
        available: Boolean(variant.available),
      }))
    }
    return [buildDefaultVariant()]
  }, [initialVariants])

  const [variants, setVariants] = useState(seedVariants)

  const updateVariant = (index, updates) => {
    setVariants((prev) =>
      prev.map((variant, current) => (current === index ? { ...variant, ...updates } : variant)),
    )
  }

  const addVariant = () => {
    setVariants((prev) => [...prev, buildDefaultVariant()])
  }

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, current) => current !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Variants</Label>
          <p className="text-sm text-muted-foreground">Add sizes, colors, and pricing for each option.</p>
        </div>
        <Button type="button" variant="outline" onClick={addVariant}>
          Add Variant
        </Button>
      </div>

      <input type="hidden" name={name} value={JSON.stringify(variants)} readOnly />

      <div className="space-y-4">
        {variants.map((variant, index) => (
          <div key={`${variant.sku || "variant"}-${index}`} className="rounded-lg border border-border p-4">
            <div className="grid gap-4 md:grid-cols-6">
              <div>
                <Label htmlFor={`variant-size-${index}`}>Size</Label>
                <Select value={variant.size} onValueChange={(value) => updateVariant(index, { size: value })}>
                  <SelectTrigger id={`variant-size-${index}`} className="mt-2">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`variant-color-${index}`}>Color</Label>
                <Input
                  id={`variant-color-${index}`}
                  className="mt-2"
                  value={variant.color}
                  onChange={(event) => updateVariant(index, { color: event.target.value })}
                />
              </div>

              <div>
                <Label htmlFor={`variant-fit-${index}`}>Fit</Label>
                <Select value={variant.fit} onValueChange={(value) => updateVariant(index, { fit: value })}>
                  <SelectTrigger id={`variant-fit-${index}`} className="mt-2">
                    <SelectValue placeholder="Fit" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIT_OPTIONS.map((fit) => (
                      <SelectItem key={fit} value={fit}>
                        {fit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`variant-price-${index}`}>Price (cents)</Label>
                <Input
                  id={`variant-price-${index}`}
                  type="number"
                  min="0"
                  className="mt-2"
                  value={variant.priceCents}
                  onChange={(event) =>
                    updateVariant(index, { priceCents: Number.parseInt(event.target.value, 10) || 0 })
                  }
                />
              </div>

              <div>
                <Label htmlFor={`variant-sku-${index}`}>SKU</Label>
                <Input
                  id={`variant-sku-${index}`}
                  className="mt-2"
                  value={variant.sku}
                  onChange={(event) => updateVariant(index, { sku: event.target.value })}
                />
              </div>

              <div className="flex items-end justify-between gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`variant-available-${index}`}>Available</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`variant-available-${index}`}
                      checked={variant.available}
                      onCheckedChange={(checked) => updateVariant(index, { available: checked })}
                    />
                    <span className="text-sm text-muted-foreground">{variant.available ? "In stock" : "Hidden"}</span>
                  </div>
                </div>
                {variants.length > 1 ? (
                  <Button type="button" variant="ghost" onClick={() => removeVariant(index)}>
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
