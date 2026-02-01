-- PaymentStatus enum
CREATE TYPE "PaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED');

-- Add columns to Order
ALTER TABLE "Order"
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

-- Indexes
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- Shipment additions (column may already exist in prior schema; skip if so)
ALTER TABLE "Shipment"
  ADD COLUMN "rateCurrency" TEXT,
  ADD COLUMN "selectedRateId" TEXT,
  ADD COLUMN "labelFileType" TEXT,
  ADD COLUMN "labelPurchasedAt" TIMESTAMP(3);

-- Ensure shippoTransactionId is unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Shipment' AND column_name = 'shippoTransactionId'
  ) THEN
    ALTER TABLE "Shipment" ADD COLUMN "shippoTransactionId" TEXT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Shipment_shippoTransactionId_key" ON "Shipment"("shippoTransactionId");

-- Payment table
CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
  "stripeCheckoutSessionId" TEXT,
  "stripePaymentIntentId" TEXT,
  "idempotencyKey" TEXT,
  "lastEventId" TEXT,
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Payment_stripeCheckoutSessionId_key" ON "Payment"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");
