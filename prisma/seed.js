const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const path = require("path")
const fs = require("fs")
const { pathToFileURL } = require("url")

const prisma = new PrismaClient()

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")

const loadMockData = async () => {
  const categoriesModule = await import(
    pathToFileURL(path.join(__dirname, "..", "lib", "data", "categories.js")).href,
  )
  const productsModule = await import(
    pathToFileURL(path.join(__dirname, "..", "lib", "data", "products.js")).href,
  )

  return {
    categories: categoriesModule.categories || [],
    products: productsModule.products || [],
  }
}

const buildVariants = (baseSku, basePrice, colorsOverride) => {
  const sizes = ["S", "M", "L", "XL", "XXL"]
  const colors = colorsOverride && colorsOverride.length > 0 ? colorsOverride : ["Black", "White"]
  const fit = "Regular"
  const variants = []

  sizes.forEach((size) => {
    colors.forEach((color) => {
      variants.push({
        size,
        color,
        fit,
        priceCents: basePrice,
        sku: `${baseSku}-${size}-${color[0]}`.toUpperCase(),
        available: true,
      })
    })
  })

  return variants
}

const randomPrice = (index) => 14900 + (index % 5) * 1000

const imageBasePath = path.join(__dirname, "..", "public", "images", "products")

const readCategoryImages = () => {
  if (!fs.existsSync(imageBasePath)) return {}
  const categoryDirs = fs.readdirSync(imageBasePath, { withFileTypes: true }).filter((dirent) => dirent.isDirectory())
  const images = {}

  categoryDirs.forEach((dirent) => {
    const categoryName = dirent.name
    const files = fs.readdirSync(path.join(imageBasePath, categoryName))
    const categoryImage = files.find((file) => file.toLowerCase().includes("category"))
    if (categoryImage) {
      images[categoryName.toLowerCase()] = `/images/products/${categoryName}/${categoryImage}`
    }
  })

  return images
}

const readProductImages = () => {
  if (!fs.existsSync(imageBasePath)) return {}
  const categoryDirs = fs.readdirSync(imageBasePath, { withFileTypes: true }).filter((dirent) => dirent.isDirectory())
  const images = {}

  categoryDirs.forEach((dirent) => {
    const categoryName = dirent.name
    const files = fs.readdirSync(path.join(imageBasePath, categoryName))
    files.forEach((file) => {
      if (file.toLowerCase().includes("category")) return
      const baseName = file.replace(/\.[^/.]+$/, "")
      const [titlePart, colorPart] = baseName.split(" - ")
      if (!titlePart) return
      const key = titlePart.trim().toLowerCase()
      if (!images[key]) {
        images[key] = { images: [], categoryName, colors: new Set() }
      }
      images[key].images.push(`/images/products/${categoryName}/${file}`)
      if (colorPart) {
        images[key].colors.add(colorPart.trim())
      }
    })
  })

  Object.values(images).forEach((entry) => {
    entry.colors = Array.from(entry.colors)
  })

  return images
}

async function main() {
  const { categories: categorySeeds, products: productSeeds } = await loadMockData()
  const categoryImages = readCategoryImages()
  const productImages = readProductImages()
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for seeding.")
  }

  const adminHash = await bcrypt.hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Admin",
      role: "ADMIN",
      passwordHash: adminHash,
    },
    create: {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      passwordHash: adminHash,
    },
  })

  const demoUsers = [
    { email: "customer@example.com", name: "Demo Customer" },
    { email: "client@example.com", name: "Demo Client" },
  ]

  for (const user of demoUsers) {
    const hash = await bcrypt.hash("password123", 12)
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash: hash,
        role: "CLIENT",
      },
      create: {
        email: user.email,
        name: user.name,
        passwordHash: hash,
        role: "CLIENT",
      },
    })
  }

  await prisma.favorite.deleteMany()
  await prisma.shipmentEvent.deleteMany()
  await prisma.shipment.deleteMany()
  await prisma.orderEvent.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.address.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  const categoryMap = {}
  const categoryIdMap = {}
  const categorySlugMap = {}
  for (const category of categorySeeds) {
    const slug = category.slug || slugify(category.name)
    const imageOverride = categoryImages[category.name.toLowerCase()] || categoryImages[slug]
    const created = await prisma.category.upsert({
      where: { slug },
      update: {
        name: category.name,
        description: category.description || `${category.name} pieces curated for everyday wear.`,
        image: imageOverride || category.image,
      },
      create: {
        name: category.name,
        slug,
        description: category.description || `${category.name} pieces curated for everyday wear.`,
        image: imageOverride || category.image,
      },
    })
    categoryMap[category.name] = created.id
    if (category.id) {
      categoryIdMap[category.id] = created.id
    }
    categorySlugMap[slug] = created.id
  }

  const productSeedMap = new Map(productSeeds.map((product) => [product.title.toLowerCase(), product]))
  const imageEntries = Object.entries(productImages)

  for (let i = 0; i < imageEntries.length; i += 1) {
    const [imageTitleKey, imageData] = imageEntries[i]
    const productSeed = productSeedMap.get(imageTitleKey)
    const title =
      productSeed?.title ||
      imageTitleKey
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    const slug = productSeed?.slug || slugify(title)
    const categoryId =
      categoryMap[productSeed?.category || imageData.categoryName] ||
      categorySlugMap[productSeed?.category || imageData.categoryName] ||
      categoryIdMap[productSeed?.categoryId] ||
      Object.values(categoryMap)[0]
    const basePrice = randomPrice(i)
    const imageOverride = imageData.images
    const variants =
      productSeed?.variants && productSeed.variants.length > 0
        ? productSeed.variants.map((variant) => ({
            size: variant.size,
            color: variant.color,
            fit: variant.fit || "Regular",
            priceCents: Math.round(Number(variant.price) * 100),
            sku: variant.sku || `${slug}-${variant.size}-${variant.color[0]}`.toUpperCase(),
            available: variant.available ?? true,
          }))
        : buildVariants(slug, basePrice, imageData.colors.length > 0 ? imageData.colors : undefined)
    const tags = productSeed?.tags || []
    const featured = Boolean(productSeed?.featured)
    const bestSelling = tags.includes("bestseller") || tags.includes("best-selling")
    const images = imageOverride && imageOverride.length > 0 ? imageOverride : productSeed?.images || []

    await prisma.product.upsert({
      where: { slug },
      update: {
        title,
        description: productSeed?.description || `${title} from the ${imageData.categoryName} collection.`,
        tags,
        images,
        featured,
        bestSelling,
        categoryId,
        variants: {
          deleteMany: {},
          create: variants,
        },
      },
      create: {
        title,
        slug,
        description: productSeed?.description || `${title} from the ${imageData.categoryName} collection.`,
        tags,
        images,
        featured,
        bestSelling,
        categoryId,
        variants: {
          create: variants,
        },
      },
    })
  }

  const couponSeeds = [
    {
      code: "WELCOME10",
      description: "10% off your first order",
      discountType: "PERCENT",
      discountValue: 10,
      isActive: true,
    },
    {
      code: "VYNTARA25",
      description: "$25 off orders over $150",
      discountType: "AMOUNT",
      discountValue: 2500,
      isActive: true,
    },
    {
      code: "STUDIO5",
      description: "Studio pickup perk",
      discountType: "PERCENT",
      discountValue: 5,
      isActive: true,
    },
  ]

  await prisma.coupon.createMany({
    data: couponSeeds,
    skipDuplicates: true,
  })

  const couponByCode = new Map(
    (await prisma.coupon.findMany()).map((coupon) => [coupon.code, coupon])
  )

  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    take: 2,
  })

  const addressTemplates = [
    {
      label: "Home",
      fullName: "Jordan Blake",
      phone: "555-0100",
      line1: "123 Maple Street",
      line2: "Unit 4A",
      city: "Austin",
      region: "TX",
      postalCode: "78701",
      country: "US",
    },
    {
      label: "Studio",
      fullName: "Riley Chen",
      phone: "555-0124",
      line1: "456 Market Avenue",
      line2: null,
      city: "San Francisco",
      region: "CA",
      postalCode: "94105",
      country: "US",
    },
  ]

  const addressMap = new Map()
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i]
    const template = addressTemplates[i % addressTemplates.length]
    const created = await prisma.address.create({
      data: {
        userId: user.id,
        ...template,
      },
    })
    addressMap.set(user.id, created.id)
  }

  const products = await prisma.product.findMany({
    include: { variants: true },
    take: 6,
  })

  const demoOrderData = [
    { status: "SHIPPED", trackingUrl: "https://tracking.example.com/demo-1", couponCode: "WELCOME10" },
    {
      status: "IN_PRODUCTION",
      trackingUrl: null,
      addressValidationStatus: "INVALID",
      addressValidationError: "Street address appears incomplete (missing unit or suite).",
      addressValidationNote: "Please add apartment/suite number or confirm the full address.",
    },
    { status: "DELIVERED", trackingUrl: "https://tracking.example.com/demo-2", couponCode: "VYNTARA25" },
    { status: "CANCELLED", trackingUrl: null },
  ]

  const resolveFulfillmentStatus = (status) => {
    switch (status) {
      case "DELIVERED":
        return "DELIVERED"
      case "SHIPPED":
        return "HANDED_TO_CARRIER"
      case "IN_PRODUCTION":
        return "IN_PROGRESS"
      case "CANCELLED":
        return "EXCEPTION"
      default:
        return "UNFULFILLED"
    }
  }

  const buildOrderEvents = (status) => {
    const events = [
      { type: "ORDER_PLACED", message: "Order placed" },
      { type: "PAID", message: "Payment confirmed" },
    ]

    if (status === "IN_PRODUCTION" || status === "SHIPPED" || status === "DELIVERED") {
      events.push({ type: "IN_PRODUCTION", message: "Order in production" })
    }
    if (status === "SHIPPED" || status === "DELIVERED") {
      events.push({ type: "LABEL_PURCHASED", message: "Shipping label purchased" })
      events.push({ type: "SHIPPED", message: "Handed to carrier" })
    }
    if (status === "DELIVERED") {
      events.push({ type: "DELIVERED", message: "Delivered" })
    }
    if (status === "CANCELLED") {
      events.push({ type: "CANCELLED", message: "Order cancelled" })
    }

    return events
  }

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i]
    const selectedProducts = products.slice(i * 2, i * 2 + 2)

    for (let j = 0; j < 2; j += 1) {
      const orderConfig = demoOrderData[(i + j) % demoOrderData.length]
      const items = selectedProducts.flatMap((product) => {
        const variant = product.variants[j % product.variants.length]
        return [
          {
            productId: product.id,
            variantId: variant.id,
            qty: 1,
            priceCents: variant.priceCents,
          },
        ]
      })

      const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.qty, 0)
      const coupon = orderConfig.couponCode ? couponByCode.get(orderConfig.couponCode) : null
      const couponDiscountCents = coupon
        ? coupon.discountType === "PERCENT"
          ? Math.round(subtotalCents * (coupon.discountValue / 100))
          : Math.min(subtotalCents, coupon.discountValue)
        : 0
      const discountedSubtotalCents = Math.max(0, subtotalCents - couponDiscountCents)
      const shippingCents = 1000
      const taxCents = Math.round(discountedSubtotalCents * 0.09)
      const totalCents = discountedSubtotalCents + shippingCents + taxCents

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          status: orderConfig.status,
          fulfillmentStatus: resolveFulfillmentStatus(orderConfig.status),
          addressValidationStatus: orderConfig.addressValidationStatus || "UNVALIDATED",
          addressValidationError: orderConfig.addressValidationError || null,
          addressValidationNote: orderConfig.addressValidationNote || null,
          trackingUrl: orderConfig.trackingUrl,
          shippingAddressId: addressMap.get(user.id) || null,
          couponId: coupon?.id || null,
          couponCode: coupon?.code || null,
          couponDiscountCents,
          subtotalCents,
          shippingCents,
          taxCents,
          totalCents,
          items: {
            create: items,
          },
          events: {
            create: buildOrderEvents(orderConfig.status),
          },
        },
      })

      if (orderConfig.status === "SHIPPED" || orderConfig.status === "DELIVERED") {
        const shipment = await prisma.shipment.create({
          data: {
            orderId: order.id,
            shippoShipmentId: `shippo_shp_${order.id.slice(-8)}`,
            shippoTransactionId: `shippo_txn_${order.id.slice(-8)}`,
            labelUrl: "https://labels.example.com/demo-label.pdf",
            trackingNumber: `1Z${order.id.slice(-8).toUpperCase()}`,
            trackingUrl: orderConfig.trackingUrl,
            carrier: "USPS",
            service: "Priority",
            rateCents: 1200,
            status: orderConfig.status === "DELIVERED" ? "DELIVERED" : "TRANSIT",
          },
        })

        await prisma.shipmentEvent.createMany({
          data: [
            {
              shipmentId: shipment.id,
              eventId: `evt_${shipment.id.slice(-6)}_pickup`,
              status: "TRANSIT",
              details: "Shipment picked up",
              location: "Austin, TX",
              occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
            },
            {
              shipmentId: shipment.id,
              eventId: `evt_${shipment.id.slice(-6)}_delivery`,
              status: orderConfig.status === "DELIVERED" ? "DELIVERED" : "TRANSIT",
              details: orderConfig.status === "DELIVERED" ? "Delivered" : "In transit",
              location: "Austin, TX",
              occurredAt: new Date(),
            },
          ],
        })
      }
    }
  }

  const favoriteTargets = await prisma.product.findMany({
    select: { id: true },
    take: 4,
  })
  for (const user of users) {
    for (const product of favoriteTargets) {
      await prisma.favorite.upsert({
        where: {
          userId_productId: {
            userId: user.id,
            productId: product.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          productId: product.id,
        },
      })
    }
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
