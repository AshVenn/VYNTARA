import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/shared/product-card"
import { CategoryCard } from "@/components/shared/category-card"
import { getFeaturedProducts } from "@/lib/data/products"
import { categories } from "@/lib/data/categories"
import { ArrowRight } from "lucide-react"

export default function HomePage() {
  const featuredProducts = getFeaturedProducts()

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-muted overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  New Collection
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">
                Summer
                <br />
                2024
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                Discover our latest drop of artist-designed tees. Where contemporary art meets premium streetwear.
              </p>
              <Button size="lg" asChild className="group">
                <Link href="/products">
                  Go To Shop
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="relative h-[500px] md:h-[600px]">
              <Image src="/images/image.png" alt="Featured product" fill className="object-contain" priority />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Featured Drops</h2>
            <p className="text-muted-foreground mt-1">Curated designs from our latest collection</p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex bg-transparent">
            <Link href="/products">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/products">View All Products</Link>
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Shop by Style</h2>
          <p className="text-muted-foreground mt-2">Find your aesthetic</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-muted">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Stay in the Loop</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Be the first to know about new drops, exclusive designs, and special offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-input rounded-md bg-background"
              />
              <Button size="lg">Subscribe</Button>
            </div>
            <p className="text-xs text-muted-foreground">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
