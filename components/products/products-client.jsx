"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/shared/product-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SlidersHorizontal, Search, Package } from "lucide-react"

export default function ProductsClient({ products, categories, favoriteIds = [], canFavorite = false }) {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")
  const sortParam = searchParams.get("sort")

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState(categoryParam ? [categoryParam] : [])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedFits, setSelectedFits] = useState([])
  const [priceRange, setPriceRange] = useState([0, 500])
  const [sortBy, setSortBy] = useState(sortParam || "newest")

  const allSizes = [...new Set(products.flatMap((p) => p.variants.map((v) => v.size)))]
  const allColors = [...new Set(products.flatMap((p) => p.variants.map((v) => v.color)))]
  const allFits = [...new Set(products.flatMap((p) => p.variants.map((v) => v.fit)))]

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      if (searchQuery && !product.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      if (selectedCategories.length > 0) {
        const matchesCategory = selectedCategories.some((slug) => product.category.slug === slug)
        if (!matchesCategory) return false
      }

      if (selectedSizes.length > 0) {
        const hasSize = product.variants.some((v) => selectedSizes.includes(v.size) && v.available)
        if (!hasSize) return false
      }

      if (selectedColors.length > 0) {
        const hasColor = product.variants.some((v) => selectedColors.includes(v.color) && v.available)
        if (!hasColor) return false
      }

      if (selectedFits.length > 0) {
        const hasFit = product.variants.some((v) => selectedFits.includes(v.fit) && v.available)
        if (!hasFit) return false
      }

      const minPrice = Math.min(...product.variants.map((v) => v.priceCents / 100))
      if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
        return false
      }

      return true
    })

    if (sortBy === "price-low") {
      filtered.sort((a, b) => {
        const minA = Math.min(...a.variants.map((v) => v.priceCents))
        const minB = Math.min(...b.variants.map((v) => v.priceCents))
        return minA - minB
      })
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => {
        const minA = Math.min(...a.variants.map((v) => v.priceCents))
        const minB = Math.min(...b.variants.map((v) => v.priceCents))
        return minB - minA
      })
    } else if (sortBy === "bestseller") {
      filtered.sort((a, b) => {
        if (a.bestSelling === b.bestSelling) {
          return new Date(b.createdAt) - new Date(a.createdAt)
        }
        return a.bestSelling ? -1 : 1
      })
    }

    return filtered
  }, [products, searchQuery, selectedCategories, selectedSizes, selectedColors, selectedFits, priceRange, sortBy])

  const toggleFilter = (value, selected, setSelected) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((item) => item !== value))
    } else {
      setSelected([...selected, value])
    }
  }

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {allSizes.map((size) => (
            <Button
              key={size}
              variant={selectedSizes.includes(size) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(size, selectedSizes, setSelectedSizes)}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.slug}
                checked={selectedCategories.includes(category.slug)}
                onCheckedChange={() => toggleFilter(category.slug, selectedCategories, setSelectedCategories)}
              />
              <Label htmlFor={category.slug} className="text-sm font-normal cursor-pointer">
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Colors</h3>
        <div className="space-y-2">
          {allColors.map((color) => (
            <div key={color} className="flex items-center space-x-2">
              <Checkbox
                id={color}
                checked={selectedColors.includes(color)}
                onCheckedChange={() => toggleFilter(color, selectedColors, setSelectedColors)}
              />
              <Label htmlFor={color} className="text-sm font-normal cursor-pointer">
                {color}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Fit</h3>
        <div className="space-y-2">
          {allFits.map((fit) => (
            <div key={fit} className="flex items-center space-x-2">
              <Checkbox
                id={fit}
                checked={selectedFits.includes(fit)}
                onCheckedChange={() => toggleFilter(fit, selectedFits, setSelectedFits)}
              />
              <Label htmlFor={fit} className="text-sm font-normal cursor-pointer">
                {fit}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">
          Price Range: ${priceRange[0]} - ${priceRange[1]}
        </h3>
        <Slider min={0} max={500} step={10} value={priceRange} onValueChange={setPriceRange} className="mt-2" />
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="text-sm text-muted-foreground">
          <span>Home</span> / <span className="text-foreground">Products</span>
        </nav>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Products</h1>
        <p className="text-muted-foreground">Discover our collection of artistic tees</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategories([])
                  setSelectedSizes([])
                  setSelectedColors([])
                  setSelectedFits([])
                  setPriceRange([0, 500])
                }}
              >
                Clear
              </Button>
            </div>
            <FiltersContent />
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background"
              />
            </div>

            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden bg-transparent">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="bestseller">Best Selling</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6 text-sm text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favoriteIds.includes(product.id)}
                  canFavorite={canFavorite}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No products found"
              description="Try adjusting your filters or search query"
              action={{
                label: "Clear Filters",
                href: "/products",
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
