import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import ProductDetailClient from "@/components/products/product-detail-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function resolveSlug(params) {
  const resolvedParams =
    params && typeof params.then === "function" ? await params : params
  return resolvedParams?.slug
}

export async function generateMetadata({ params }) {
  const slug = await resolveSlug(params)
  if (!slug) {
    return { title: "VYNTARA" }
  }
  const product = await prisma.product.findUnique({
    where: { slug },
  })

  if (!product) {
    return { title: "Product not found" }
  }

  return {
    title: `${product.title} | VYNTARA`,
    description: product.description,
  }
}

export default async function ProductDetailPage({ params }) {
  const slug = await resolveSlug(params)
  if (!slug) {
    return null
  }
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: true,
      category: true,
    },
  })

  if (!product) {
    notFound()
  }

  const session = await getServerSession(authOptions)
  const favorite = session?.user
    ? await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId: session.user.id,
            productId: product.id,
          },
        },
      })
    : null

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      NOT: { id: product.id },
    },
    include: { variants: true },
    take: 4,
  })

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      isFavorite={Boolean(favorite)}
      canFavorite={Boolean(session?.user)}
    />
  )
}
