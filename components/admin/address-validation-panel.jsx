"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const statusLabels = {
  UNVALIDATED: "Not validated",
  VALID: "Validated",
  INVALID: "Invalid - customer action needed",
  CLIENT_UPDATED: "Customer updated address",
}

export function AddressValidationPanel({
  orderId,
  status,
  error,
  note,
  action,
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!error) return
    try {
      await navigator.clipboard.writeText(error)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Address validation</span>
        <Badge variant="secondary">{statusLabels[status] || "Not validated"}</Badge>
      </div>

      {error && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Validation error</label>
          <div className="flex gap-2">
            <textarea
              readOnly
              value={error}
              className="w-full min-h-[72px] resize-none rounded-md border border-border bg-background px-3 py-2 text-xs"
            />
            <Button type="button" variant="outline" className="bg-transparent" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      <form action={action} className="space-y-2">
        <input type="hidden" name="orderId" value={orderId} />
        <div className="space-y-1">
          <label htmlFor="address-status" className="text-xs text-muted-foreground">
            Status
          </label>
          <select
            id="address-status"
            name="status"
            defaultValue={status}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="UNVALIDATED">Not validated</option>
            <option value="VALID">Validated</option>
            <option value="INVALID">Invalid - needs customer fix</option>
            <option value="CLIENT_UPDATED">Customer updated address</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="address-note" className="text-xs text-muted-foreground">
            Note to customer (optional)
          </label>
          <textarea
            id="address-note"
            name="note"
            defaultValue={note || ""}
            placeholder="Example: Please add apartment number or confirm ZIP code."
            className="w-full min-h-[80px] resize-none rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" className="w-full">
          Update address status
        </Button>
      </form>
    </div>
  )
}
