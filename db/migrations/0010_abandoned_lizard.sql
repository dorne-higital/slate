CREATE TABLE "domain_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid,
	"user_id" text,
	"domain_name" text NOT NULL,
	"price" integer NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"simulated" boolean DEFAULT true NOT NULL,
	"stripe_session_id" text,
	"stripe_subscription_id" text,
	"expires_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "domain_orders" ADD CONSTRAINT "domain_orders_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_orders" ADD CONSTRAINT "domain_orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "domain_orders_site_idx" ON "domain_orders" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "domain_orders_name_idx" ON "domain_orders" USING btree ("domain_name");