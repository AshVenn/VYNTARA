"use client"

import { useEffect, useState } from "react"
import { Check, Package, Truck, MapPin, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const statusIcons = {
  UNKNOWN: Clock,
  PRE_TRANSIT: Package,
  TRANSIT: Truck,
  DELIVERED: Check,
  RETURNED: AlertCircle,
  FAILURE: AlertCircle,
  EXCEPTION: AlertCircle,
}

const statusColors = {
  UNKNOWN: "bg-muted text-muted-foreground",
  PRE_TRANSIT: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  TRANSIT: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  RETURNED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  FAILURE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  EXCEPTION: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
}

export function TrackingTimeline({ events = [], carrier, trackingNumber, onRefresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.occurredAt ? new Date(a.occurredAt) : new Date(a.createdAt)
    const dateB = b.occurredAt ? new Date(b.occurredAt) : new Date(b.createdAt)
    return dateB - dateA
  })

  const handleRefresh = async () => {
    if (!onRefresh) return
    setIsRefreshing(true)
    try {
      await onRefresh()
      setLastRefresh(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!trackingNumber || !carrier) return

    const interval = setInterval(() => {
      const latestEvent = sortedEvents[0]
      const isDelivered = latestEvent?.status?.includes("DELIVERED")
      if (!isDelivered && onRefresh) {
        handleRefresh()
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [trackingNumber, carrier, sortedEvents, onRefresh])

  if (!trackingNumber) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No tracking information available yet.</p>
        <p className="text-xs mt-1">Purchase a shipping label to enable tracking.</p>
      </div>
    )
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Awaiting carrier scan.</p>
        <p className="text-xs mt-1">Tracking updates will appear here once the carrier scans the package.</p>
        {onRefresh && (
          <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{carrier}</span>
          <span className="mx-2">|</span>
          <span>{trackingNumber}</span>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
        )}
      </div>

      <div className="space-y-0">
        {sortedEvents.map((event, index) => {
          const status = event.status?.toUpperCase() || "UNKNOWN"
          const Icon = statusIcons[status] || Clock
          const colorClass = statusColors[status] || statusColors.UNKNOWN
          const isFirst = index === 0
          const isLast = index === sortedEvents.length - 1

          const eventDate = event.occurredAt ? new Date(event.occurredAt) : new Date(event.createdAt)

          return (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                {!isLast && <div className="w-0.5 h-full min-h-12 bg-border" />}
              </div>
              <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={cn("font-medium text-sm", isFirst ? "text-foreground" : "text-muted-foreground")}>
                      {event.details || status.replace(/_/g, " ")}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {eventDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    <span className="ml-1">
                      {eventDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {lastRefresh && (
        <p className="text-xs text-muted-foreground text-center">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
