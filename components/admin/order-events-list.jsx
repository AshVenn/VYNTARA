import { cn } from "@/lib/utils"
import {
  ShoppingCart,
  CreditCard,
  Factory,
  Tag,
  Truck,
  Check,
  X,
  MessageSquare,
  AlertCircle,
} from "lucide-react"

const eventConfig = {
  ORDER_PLACED: {
    icon: ShoppingCart,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  PAID: {
    icon: CreditCard,
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  IN_PRODUCTION: {
    icon: Factory,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  LABEL_PURCHASED: {
    icon: Tag,
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },
  SHIPPED: {
    icon: Truck,
    className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
  DELIVERED: {
    icon: Check,
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  CANCELLED: {
    icon: X,
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  NOTE: {
    icon: MessageSquare,
    className: "bg-muted text-muted-foreground",
  },
  EXCEPTION: {
    icon: AlertCircle,
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
}

export function OrderEventsList({ events = [] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No events recorded yet.
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const config = eventConfig[event.type] || eventConfig.NOTE
        const Icon = config.icon
        const isLast = index === events.length - 1

        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                  config.className
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              {!isLast && <div className="w-0.5 h-full min-h-8 bg-border" />}
            </div>
            <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {event.type.replace(/_/g, " ")}
                  </p>
                  {event.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {event.message}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {new Date(event.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
