"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [coupon, setCoupon] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadLocal = () => {
      const raw = window.localStorage.getItem("cartItems")
      const rawCoupon = window.localStorage.getItem("cartCoupon")
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          setItems(Array.isArray(parsed) ? parsed : [])
        } catch {
          setItems([])
        }
      }
      if (rawCoupon) {
        try {
          const parsed = JSON.parse(rawCoupon)
          setCoupon(parsed || null)
        } catch {
          setCoupon(null)
        }
      }
      setIsLoaded(true)
    }

    const loadServer = async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.items)) {
            setItems(
              data.items.map((item) => ({
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                qty: item.qty,
                price: item.priceCents / 100,
                productTitle: item.productTitle,
                productImage: item.productImage,
                variant: item.variant,
              })),
            )
          }
        } else {
          loadLocal()
        }
      } catch {
        loadLocal()
      } finally {
        setIsLoaded(true)
      }
    }

    if (status === "authenticated") {
      loadServer()
    } else {
      loadLocal()
    }
  }, [status])

  useEffect(() => {
    if (!isLoaded) return
    window.localStorage.setItem("cartItems", JSON.stringify(items))
    window.localStorage.setItem("cartCoupon", JSON.stringify(coupon))
  }, [items, coupon, isLoaded])

  const syncServerCart = useCallback(
    async (nextItems) => {
      if (status !== "authenticated") return
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: nextItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              qty: item.qty,
            })),
          }),
        })
      } catch (error) {
        console.error("Failed to sync cart", error)
      }
    },
    [status],
  )

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find(
        (entry) => entry.productId === item.productId && entry.variantId === item.variantId
      )
      let next
      if (existing) {
        next = prev.map((entry) =>
          entry.productId === item.productId && entry.variantId === item.variantId
            ? { ...entry, qty: entry.qty + item.qty }
            : entry
        )
      } else {
        next = [...prev, item]
      }
      syncServerCart(next)
      return next
    })
  }, [syncServerCart])

  const updateItem = useCallback((itemId, qty) => {
    setItems((prev) => {
      const next = prev.map((item) => (item.id === itemId ? { ...item, qty } : item))
      syncServerCart(next)
      return next
    })
  }, [syncServerCart])

  const removeItem = useCallback((itemId) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== itemId)
      syncServerCart(next)
      return next
    })
  }, [syncServerCart])

  const clearCart = useCallback(() => {
    setItems([])
    setCoupon(null)
    syncServerCart([])
  }, [syncServerCart])

  const applyCoupon = useCallback((nextCoupon) => {
    setCoupon(nextCoupon)
  }, [])

  const clearCoupon = useCallback(() => {
    setCoupon(null)
  }, [])

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        coupon,
        itemCount,
        isLoaded,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        applyCoupon,
        clearCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
