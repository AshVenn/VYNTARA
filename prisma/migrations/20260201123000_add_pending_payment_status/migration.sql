-- Recreate enum to safely add value and set default in one migration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orderstatus_new') THEN
    CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING_PAYMENT', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED');
  END IF;
END $$;

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");

ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

DROP TYPE "OrderStatus_old";

ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
