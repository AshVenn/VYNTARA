// Mock category database
export const categories = [
  {
    id: 1,
    name: "Minimal",
    slug: "minimal",
    image: "/placeholder.svg?height=400&width=400",
    description: "Clean, essential designs",
  },
  {
    id: 2,
    name: "Streetwear",
    slug: "streetwear",
    image: "/placeholder.svg?height=400&width=400",
    description: "Urban style statements",
  },
  {
    id: 3,
    name: "Sports",
    slug: "sports",
    image: "/placeholder.svg?height=400&width=400",
    description: "Performance wear",
  },
  {
    id: 4,
    name: "Vintage",
    slug: "vintage",
    image: "/placeholder.svg?height=400&width=400",
    description: "Retro-inspired classics",
  },
  {
    id: 5,
    name: "Anime",
    slug: "anime",
    image: "/placeholder.svg?height=400&width=400",
    description: "Japanese-inspired graphics",
  },
  {
    id: 6,
    name: "Gym",
    slug: "gym",
    image: "/placeholder.svg?height=400&width=400",
    description: "Built for training",
  },
]

export const getCategoryById = (id) => categories.find((c) => c.id === Number.parseInt(id))
export const getCategoryBySlug = (slug) => categories.find((c) => c.slug === slug)
