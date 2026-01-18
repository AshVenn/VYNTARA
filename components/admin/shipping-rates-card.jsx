"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Check, Clock, Truck, Loader2 } from "lucide-react"

const carrierLogos = {
  usps: "/carriers/usps.svg",
  ups: "/carriers/ups.svg",
  fedex: "/carriers/fedex.svg",
  dhl: "/carriers/dhl.svg",
}

function SubmitButton({ disabled, children }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export function ShippingRatesCard({ rates = [], selectedRateId, onSelectRate, buyLabelAction, orderId, shipmentId }) {
  const [selected, setSelected] = useState(selectedRateId || rates[0]?.object_id)

  const sortedRates = [...rates].sort((a, b) => Number(a.amount) - Number(b.amount))

  const handleSelect = (rateId) => {
    setSelected(rateId)
    onSelectRate?.(rateId)
  }

  if (rates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No shipping rates available.</p>
        <p className="text-xs mt-1">Click "Get Shipping Rates" to fetch available options.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {sortedRates.map((rate, index) => {
          const isSelected = selected === rate.object_id
          const isCheapest = index === 0
          const carrierLower = rate.provider?.toLowerCase()
          const logoUrl = carrierLogos[carrierLower]

          const estimatedDays = rate.estimated_days || rate.duration_terms
          const serviceName = rate.servicelevel?.name || rate.servicelevel?.token || rate.service

          return (
            <button
              key={rate.object_id}
              type="button"
              onClick={() => handleSelect(rate.object_id)}
              className={cn(
                "w-full text-left p-4 border rounded-lg transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{rate.provider}</p>
                    {isCheapest && (
                      <Badge variant="secondary" className="text-xs">
                        Best Value
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{serviceName}</p>
                  {estimatedDays && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {typeof estimatedDays === "number"
                        ? `${estimatedDays} business day${estimatedDays !== 1 ? "s" : ""}`
                        : estimatedDays}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${Number(rate.amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{rate.currency || "USD"}</p>
                  {isSelected && <Check className="w-5 h-5 text-primary mt-2 ml-auto" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <form action={buyLabelAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="shipmentId" value={shipmentId || ""} />
        <input type="hidden" name="rateId" value={selected} />
        <SubmitButton disabled={!selected}>Buy Shipping Label</SubmitButton>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        Select a shipping rate and click "Buy Shipping Label" to purchase.
      </p>
    </div>
  )
}
