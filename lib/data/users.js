// Mock user database
export const users = [
  {
    id: 1,
    email: "customer@example.com",
    password: "password123",
    name: "John Doe",
    role: "customer",
    addresses: [
      {
        id: 1,
        isDefault: true,
        name: "John Doe",
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        zip: "94102",
        country: "United States",
        phone: "+1 (555) 123-4567",
      },
    ],
  },
  {
    id: 2,
    email: "admin@vyntara.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
    addresses: [],
  },
]

export const getUserByEmail = (email) => users.find((u) => u.email === email)
export const getUserById = (id) => users.find((u) => u.id === Number.parseInt(id))
