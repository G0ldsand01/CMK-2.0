-- Create system_settings table
CREATE TABLE IF NOT EXISTS "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text REFERENCES "user"("id"),
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);

-- Create index on key
CREATE INDEX IF NOT EXISTS "settings_key_idx" ON "system_settings" ("key");
