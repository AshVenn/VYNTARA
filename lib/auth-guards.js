import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}

export async function requireRole(role) {
  const session = await requireAuth()
  if (session.user.role !== role) {
    throw new Error("FORBIDDEN")
  }
  return session
}
