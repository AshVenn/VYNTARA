"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

const toastMap = {
  success: toast.success,
  warning: toast.warning,
  error: toast.error,
}

export default function AdminToastHandler() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const message = searchParams.get("toast")
    if (!message) return

    const type = searchParams.get("toastType") || "success"
    const show = toastMap[type] || toast.success
    show(message)

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("toast")
    nextParams.delete("toastType")
    const next = nextParams.toString()
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  return null
}
