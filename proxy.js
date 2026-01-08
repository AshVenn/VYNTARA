import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/account", request.url))
    }
  }

  if (pathname.startsWith("/account")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
}
