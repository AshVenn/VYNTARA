"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag, Heart, User, Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function AppShell({ children }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Hide header/footer on admin and account routes
  const isAdminRoute = pathname?.startsWith("/admin")
  const isAccountRoute = pathname?.startsWith("/account")
  const hideNavigation = isAdminRoute || isAccountRoute

  if (hideNavigation) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link href="/" className="text-2xl font-bold tracking-tighter font-deck">
            VYNTARA
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-sm font-medium hover:underline underline-offset-4 font-deck">
              Shop
            </Link>
            <Link
              href="/products?category=new"
              className="text-sm font-medium hover:underline underline-offset-4 font-deck"
            >
              New
            </Link>
            <Link
              href="/products?category=bestseller"
              className="text-sm font-medium hover:underline underline-offset-4 font-deck"
            >
              Bestsellers
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/products">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account/wishlist">
                <Heart className="h-5 w-5" />
                <span className="sr-only">Wishlist</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account">
                <User className="h-5 w-5" />
                <span className="sr-only">Account</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  2
                </span>
                <span className="sr-only">Cart</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <Link
                href="/products"
                className="text-sm font-medium font-deck"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                href="/products?category=new"
                className="text-sm font-medium font-deck"
                onClick={() => setMobileMenuOpen(false)}
              >
                New
              </Link>
              <Link
                href="/products?category=bestseller"
                className="text-sm font-medium font-deck"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bestsellers
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">VYNTARA</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Premium print-on-demand apparel. Art meets streetwear.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/products" className="hover:text-foreground">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=new" className="hover:text-foreground">
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=bestseller" className="hover:text-foreground">
                    Bestsellers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Size Guide
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Shipping
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Returns
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Newsletter</h4>
              <p className="text-sm text-muted-foreground mb-4">Get updates on new drops and exclusive offers.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background"
                />
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2026 VYNTARA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
