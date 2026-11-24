CREATE TABLE "domains" (
	"hostname" text PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"cloudflare_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"status_detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "domains_site_idx" ON "domains" USING btree ("site_id");