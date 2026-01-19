"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [coupon, setCoupon] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
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
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    window.localStorage.setItem("cartItems", JSON.stringify(items))
    window.localStorage.setItem("cartCoupon", JSON.stringify(coupon))
  }, [items, coupon, isLoaded])

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find(
        (entry) => entry.productId === item.productId && entry.variantId === item.variantId
      )
      if (existing) {
        return prev.map((entry) =>
          entry.productId === item.productId && entry.variantId === item.variantId
            ? { ...entry, qty: entry.qty + item.qty }
            : entry
        )
      }
      return [...prev, item]
    })
  }, [])

  const updateItem = useCallback((itemId, qty) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, qty } : item))
    )
  }, [])

  const removeItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setCoupon(null)
  }, [])

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
