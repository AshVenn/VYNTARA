import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { registerSchema } from "@/lib/validators/auth"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request) {
  try {
    const ip =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for") ||
      "unknown"

    if (!checkRateLimit(`register:${ip}`, { limit: 5, windowMs: 60_000 })) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { name, email, password } = parsed.data
    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "CLIENT",
      },
    })

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
