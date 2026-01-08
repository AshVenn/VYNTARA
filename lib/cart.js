export function getCartItems() {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem("cartItems")
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

export function setCartItems(items) {
  if (typeof window === "undefined") return
  window.localStorage.setItem("cartItems", JSON.stringify(items))
}

export function clearCartItems() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem("cartItems")
}

export function addCartItem(item) {
  const items = getCartItems()
  const existing = items.find(
    (entry) => entry.productId === item.productId && entry.variantId === item.variantId,
  )
  if (existing) {
    existing.qty += item.qty
    setCartItems([...items])
    return
  }
  setCartItems([...items, item])
}

export function updateCartItem(itemId, qty) {
  const items = getCartItems()
  const next = items.map((item) => (item.id === itemId ? { ...item, qty } : item))
  setCartItems(next)
}

export function removeCartItem(itemId) {
  const items = getCartItems()
  setCartItems(items.filter((item) => item.id !== itemId))
}
