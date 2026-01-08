import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import ProductDetailClient from "@/components/products/product-detail-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function generateMetadata({ params }) {
  if (!params?.slug) {
    return { title: "Product not found" }
  }
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
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
  if (!params?.slug) {
    notFound()
  }
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
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
