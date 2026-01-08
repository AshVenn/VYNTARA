import Link from "next/link"
import Image from "next/image"

export function CategoryCard({ category }) {
  return (
    <Link href={`/products?category=${category.slug}`} className="group block">
      <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3">
        <Image
          src={category.image || "/placeholder.svg"}
          alt={category.name}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-lg">{category.name}</h3>
        <p className="text-sm text-muted-foreground">{category.description}</p>
      </div>
    </Link>
  )
}
