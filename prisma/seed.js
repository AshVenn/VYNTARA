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

const buildVariants = (baseSku, basePrice) => {
  const sizes = ["S", "M", "L", "XL", "XXL"]
  const colors = ["Black", "White"]
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
      const [titlePart] = baseName.split(" - ")
      if (!titlePart) return
      const key = titlePart.trim().toLowerCase()
      if (!images[key]) {
        images[key] = []
      }
      images[key].push(`/images/products/${categoryName}/${file}`)
    })
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

  await prisma.$transaction([
    prisma.favorite.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
  ])

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
        image: imageOverride || category.image,
      },
      create: {
        name: category.name,
        slug,
        image: imageOverride || category.image,
      },
    })
    categoryMap[category.name] = created.id
    if (category.id) {
      categoryIdMap[category.id] = created.id
    }
    categorySlugMap[slug] = created.id
  }

  for (let i = 0; i < productSeeds.length; i += 1) {
    const product = productSeeds[i]
    const slug = product.slug || slugify(product.title)
    const categoryId =
      categoryMap[product.category] ||
      categorySlugMap[product.category] ||
      categoryIdMap[product.categoryId] ||
      Object.values(categoryMap)[0]
    const basePrice = randomPrice(i)
    const imageKey = product.title.toLowerCase()
    const imageOverride = productImages[imageKey]
    const variants =
      product.variants && product.variants.length > 0
        ? product.variants.map((variant) => ({
            size: variant.size,
            color: variant.color,
            fit: variant.fit || "Regular",
            priceCents: Math.round(Number(variant.price) * 100),
            sku: variant.sku || `${slug}-${variant.size}-${variant.color[0]}`.toUpperCase(),
            available: variant.available ?? true,
          }))
        : buildVariants(slug, basePrice)
    const tags = product.tags || []
    const featured = Boolean(product.featured)
    const bestSelling = tags.includes("bestseller") || tags.includes("best-selling")
    const images = imageOverride && imageOverride.length > 0 ? imageOverride : product.images

    await prisma.product.upsert({
      where: { slug },
      update: {
        title: product.title,
        description: product.description,
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
        title: product.title,
        slug,
        description: product.description,
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

  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    take: 2,
  })

  const products = await prisma.product.findMany({
    include: { variants: true },
    take: 6,
  })

  const demoOrderData = [
    { status: "SHIPPED", trackingUrl: "https://tracking.example.com/demo-1" },
    { status: "PRODUCTION", trackingUrl: null },
    { status: "DELIVERED", trackingUrl: "https://tracking.example.com/demo-2" },
    { status: "CANCELLED", trackingUrl: null },
  ]

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
      const shippingCents = 1000
      const taxCents = Math.round(subtotalCents * 0.09)
      const totalCents = subtotalCents + shippingCents + taxCents

      await prisma.order.create({
        data: {
          userId: user.id,
          status: orderConfig.status,
          trackingUrl: orderConfig.trackingUrl,
          subtotalCents,
          shippingCents,
          taxCents,
          totalCents,
          items: {
            create: items,
          },
        },
      })
    }
  }

  const favoriteTargets = products.slice(0, 4)
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
