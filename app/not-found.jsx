import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="max-w-md text-center bg-background border border-border p-8">
        <p className="text-sm text-muted-foreground mb-2">404</p>
        <h1 className="text-3xl font-bold mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-6">
          The page you are looking for doesn’t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild className="bg-transparent">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
