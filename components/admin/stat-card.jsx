import { Card } from "@/components/ui/card"

export function StatCard({ title, value, change, trend, icon: Icon }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
              {trend === "up" ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
    </Card>
  )
}
