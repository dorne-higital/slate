ALTER TABLE "pages" ADD COLUMN "share_image" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "no_index" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "seo" jsonb;