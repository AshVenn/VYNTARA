"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleFavorite } from "@/app/actions/favorites"

export default function FavoriteButton({ productId, initial = false }) {
  const [isPending, startTransition] = useTransition()
  const [isFavorite, setIsFavorite] = useState(initial)

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const result = await toggleFavorite(productId)
        setIsFavorite(result.isFavorite)
      } catch (error) {
        console.error(error)
      }
    })
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
      onClick={handleToggle}
      disabled={isPending}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
      <span className="sr-only">Add to wishlist</span>
    </Button>
  )
}
