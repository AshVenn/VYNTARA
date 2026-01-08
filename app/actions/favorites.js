"use server"

import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-guards"

export async function toggleFavorite(productId) {
  const session = await requireAuth()

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId,
      },
    },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return { isFavorite: false }
  }

  await prisma.favorite.create({
    data: {
      userId: session.user.id,
      productId,
    },
  })

  return { isFavorite: true }
}
