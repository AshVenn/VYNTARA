import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format money
export function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Generate slug from string
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
}

// Calculate order totals
export function calculateOrderTotals(items, shippingCost = 10) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const tax = subtotal * 0.09
  const total = subtotal + shippingCost + tax

  return {
    subtotal,
    shipping: shippingCost,
    tax,
    total,
  }
}

// Mock auth helpers
export function getCurrentUser() {
  // In a real app, this would check session/token
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("currentUser")
    return userStr ? JSON.parse(userStr) : null
  }
  return null
}

export function login(email, password) {
  const { getUserByEmail } = require("./data/users")
  const user = getUserByEmail(email)

  if (user && user.password === password) {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(user))
    }
    return { success: true, user }
  }

  return { success: false, error: "Invalid email or password" }
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("currentUser")
  }
}

export function isAdmin() {
  const user = getCurrentUser()
  return user?.role === "admin"
}
