// Mock order database
export const orders = [
  {
    id: "ORD-2024-001",
    userId: 1,
    items: [
      {
        productId: 1,
        productTitle: "Abstract Print Shirt",
        productImage: "/images/image.png",
        variant: { size: "L", color: "Black", fit: "Relaxed" },
        qty: 1,
        price: 99,
      },
    ],
    status: "shipped",
    timelineEvents: [
      { status: "paid", label: "Order Paid", date: "2024-01-03", completed: true },
      { status: "production", label: "In Production", date: "2024-01-04", completed: true },
      { status: "shipped", label: "Shipped", date: "2024-01-06", completed: true },
      { status: "delivered", label: "Delivered", date: "2024-01-08 (est)", completed: false },
    ],
    trackingUrl: "https://tracking.example.com/ORD-2024-001",
    totals: {
      subtotal: 99,
      shipping: 10,
      tax: 8.91,
      total: 117.91,
    },
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      country: "United States",
    },
    createdAt: "2024-01-03T10:30:00Z",
  },
  {
    id: "ORD-2024-002",
    userId: 1,
    items: [
      {
        productId: 4,
        productTitle: "Basic Heavy Weight T-Shirt",
        productImage: "/black-heavyweight-oversized-tshirt.jpg",
        variant: { size: "L", color: "Black", fit: "Oversized" },
        qty: 1,
        price: 199,
      },
      {
        productId: 1,
        productTitle: "Abstract Print Shirt",
        productImage: "/images/image.png",
        variant: { size: "L", color: "Black", fit: "Relaxed" },
        qty: 1,
        price: 99,
      },
    ],
    status: "production",
    timelineEvents: [
      { status: "paid", label: "Order Paid", date: "2024-01-07", completed: true },
      { status: "production", label: "In Production", date: "2024-01-08", completed: true },
      { status: "shipped", label: "Shipped", date: "2024-01-10 (est)", completed: false },
      { status: "delivered", label: "Delivered", date: "2024-01-12 (est)", completed: false },
    ],
    trackingUrl: null,
    totals: {
      subtotal: 298,
      shipping: 10,
      tax: 26.82,
      total: 334.82,
    },
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      country: "United States",
    },
    createdAt: "2024-01-07T14:20:00Z",
  },
]

export const getOrderById = (id) => orders.find((o) => o.id === id)
export const getOrdersByUserId = (userId) => orders.filter((o) => o.userId === userId)
export const getActiveOrder = (userId) => {
  const userOrders = getOrdersByUserId(userId)
  return userOrders.find((o) => o.status !== "delivered" && o.status !== "cancelled")
}
