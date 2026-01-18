import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Package, Clock, Tag, Truck, Check, AlertCircle } from "lucide-react"

const statusConfig = {
  UNFULFILLED: {
    label: "Unfulfilled",
    variant: "secondary",
    icon: Clock,
    className: "bg-muted text-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "default",
    icon: Package,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  LABEL_PURCHASED: {
    label: "Label Purchased",
    variant: "default",
    icon: Tag,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  HANDED_TO_CARRIER: {
    label: "Handed to Carrier",
    variant: "default",
    icon: Truck,
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },
  DELIVERED: {
    label: "Delivered",
    variant: "default",
    icon: Check,
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  EXCEPTION: {
    label: "Exception",
    variant: "destructive",
    icon: AlertCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
}

export function FulfillmentStatusBadge({ status, showIcon = true, size = "default" }) {
  const config = statusConfig[status] || statusConfig.UNFULFILLED
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-0 font-medium",
        config.className,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "lg" && "text-sm px-3 py-1"
      )}
    >
      {showIcon && <Icon className={cn("mr-1.5", size === "sm" ? "w-3 h-3" : "w-4 h-4")} />}
      {config.label}
    </Badge>
  )
}

export function FulfillmentProgress({ status }) {
  const stages = ["UNFULFILLED", "LABEL_PURCHASED", "HANDED_TO_CARRIER", "DELIVERED"]
  const currentIndex = stages.indexOf(status)
  const isException = status === "EXCEPTION"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const isActive = index <= currentIndex && !isException
          const isCurrent = index === currentIndex && !isException
          const config = statusConfig[stage]
          const Icon = config.icon

          return (
            <div key={stage} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  isActive ? config.className : "bg-muted text-muted-foreground",
                  isCurrent && "ring-2 ring-offset-2 ring-primary"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={cn("text-xs mt-1 text-center", isActive ? "text-foreground" : "text-muted-foreground")}>
                {config.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-1 px-4">
        {stages.slice(0, -1).map((stage, index) => (
          <div
            key={stage}
            className={cn("h-1 flex-1 rounded-full transition-colors", index < currentIndex && !isException ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>
      {isException && (
        <div className="flex items-center justify-center gap-2 mt-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Shipment Exception</span>
        </div>
      )}
    </div>
  )
}
