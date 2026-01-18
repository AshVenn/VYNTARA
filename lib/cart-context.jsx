"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem("cartItems")
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setItems(Array.isArray(parsed) ? parsed : [])
      } catch {
        setItems([])
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    window.localStorage.setItem("cartItems", JSON.stringify(items))
  }, [items, isLoaded])

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
  }, [])

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        isLoaded,
        addItem,
        updateItem,
        removeItem,
        clearCart,
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
