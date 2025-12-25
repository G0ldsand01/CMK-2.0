-- Create table for 3D print orders
CREATE TABLE IF NOT EXISTS "3dprint_orders" (
  "id" SERIAL PRIMARY KEY,
  "customerEmail" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zip" TEXT,
  "country" TEXT,
  "stripeSessionId" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "filename" TEXT NOT NULL,
  "fileUrl" TEXT,
  "material" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "infill" INTEGER,
  "volumeCm3" NUMERIC,
  "dims" JSONB,
  "printer" TEXT,
  "price" NUMERIC NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "3dprint_orders_stripeSessionId_idx" ON "3dprint_orders"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "3dprint_orders_customerEmail_idx" ON "3dprint_orders"("customerEmail");
CREATE INDEX IF NOT EXISTS "3dprint_orders_status_idx" ON "3dprint_orders"("status");

