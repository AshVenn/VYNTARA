-- Inventory on variants
ALTER TABLE "ProductVariant"
  ADD COLUMN "stockQty" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "reservedQty" INTEGER NOT NULL DEFAULT 0;

-- Cart models
CREATE TABLE "Cart" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "qty" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");
