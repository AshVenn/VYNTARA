const SHIPPO_API_BASE = "https://api.goshippo.com"

const requireShippoToken = () => {
  const token = process.env.SHIPPO_API_TOKEN
  if (!token) {
    throw new Error("SHIPPO_API_TOKEN is not configured.")
  }
  return token
}

const shippoRequest = async (path, options = {}) => {
  const token = requireShippoToken()
  const response = await fetch(`${SHIPPO_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `ShippoToken ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.detail || data?.message || "Shippo request failed."
    throw new Error(message)
  }
  return data
}

export const getShippoAddressFromEnv = () => {
  const address = {
    name: process.env.SHIPPO_FROM_NAME || "VYNTARA",
    company: process.env.SHIPPO_FROM_COMPANY || undefined,
    street1: process.env.SHIPPO_FROM_LINE1,
    street2: process.env.SHIPPO_FROM_LINE2 || undefined,
    city: process.env.SHIPPO_FROM_CITY,
    state: process.env.SHIPPO_FROM_REGION,
    zip: process.env.SHIPPO_FROM_POSTAL_CODE,
    country: process.env.SHIPPO_FROM_COUNTRY || "US",
    phone: process.env.SHIPPO_FROM_PHONE || undefined,
    email: process.env.SHIPPO_FROM_EMAIL || undefined,
  }

  if (!address.street1 || !address.city || !address.state || !address.zip || !address.country) {
    throw new Error("Missing SHIPPO_FROM_* address fields.")
  }

  return address
}

export const validateAddress = async (address) => {
  return shippoRequest("/addresses/", {
    method: "POST",
    body: JSON.stringify({
      ...address,
      validate: true,
    }),
  })
}

export const createShipment = async ({ addressFrom, addressTo, parcels }) => {
  return shippoRequest("/shipments/", {
    method: "POST",
    body: JSON.stringify({
      address_from: addressFrom,
      address_to: addressTo,
      parcels,
      async: false,
    }),
  })
}

export const buyLabel = async ({ rateId }) => {
  return shippoRequest("/transactions/", {
    method: "POST",
    body: JSON.stringify({
      rate: rateId,
      label_file_type: "PDF",
      async: false,
    }),
  })
}

export const trackShipment = async ({ carrier, trackingNumber }) => {
  if (!carrier || !trackingNumber) {
    throw new Error("Carrier and tracking number are required.")
  }
  return shippoRequest(`/tracks/${carrier}/${trackingNumber}`, {
    method: "GET",
  })
}
