import { Check } from "lucide-react"

export function OrderTimeline({ events }) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                event.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {event.completed ? <Check className="h-5 w-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
            </div>
            {index < events.length - 1 && (
              <div className={`w-0.5 h-12 ${event.completed ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
          <div className="flex-1 pb-8">
            <h4 className={`font-semibold ${event.completed ? "text-foreground" : "text-muted-foreground"}`}>
              {event.label}
            </h4>
            <p className="text-sm text-muted-foreground">{event.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
