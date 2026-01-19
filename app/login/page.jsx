"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSession, signIn } from "next-auth/react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError("Invalid email or password")
        toast.error("Login failed. Check your credentials.")
        return
      }

      toast.success("Connected. Welcome back!")
      const session = await getSession()
      if (session?.user?.role === "ADMIN") {
        router.push("/admin")
        return
      }
      router.push("/account")
      router.refresh()
    } catch (err) {
      setError("Something went wrong. Please try again.")
      toast.error("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden lg:flex flex-col justify-between bg-background px-12 py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.05),_transparent_55%)]" />
          <div className="relative z-10">
            <Link href="/" className="text-3xl font-bold tracking-tighter">
              VYNTARA
            </Link>
            <h1 className="text-4xl font-bold mt-10 mb-4">Welcome back</h1>
            <p className="text-muted-foreground max-w-md">
              Sign in to track orders, manage favorites, and keep your shipping details ready for checkout.
            </p>
            <div className="mt-10 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-xs font-semibold">
                  01
                </span>
                <span>Review your latest orders and shipping updates.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-xs font-semibold">
                  02
                </span>
                <span>Save your favorite drops and restock reminders.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-xs font-semibold">
                  03
                </span>
                <span>Speed through checkout with saved addresses.</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 text-xs text-muted-foreground">
            Need help? Contact support@vyntara.com
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link href="/" className="text-3xl font-bold tracking-tighter lg:hidden">
                VYNTARA
              </Link>
              <h1 className="text-2xl font-bold mt-6 mb-2">Sign in</h1>
              <p className="text-muted-foreground">Access your account dashboard</p>
            </div>

            <div className="bg-background/80 backdrop-blur rounded-lg border border-border p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/register" className="font-semibold hover:underline">
                  Sign up
                </Link>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">Demo: customer@example.com / password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
