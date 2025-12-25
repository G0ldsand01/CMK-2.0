-- Add visible column to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "visible" boolean DEFAULT true NOT NULL;
