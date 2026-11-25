CREATE TABLE "custom_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid,
	"user_id" text,
	"stripe_invoice_id" text NOT NULL,
	"number" text,
	"description" text NOT NULL,
	"total" integer NOT NULL,
	"status" text NOT NULL,
	"hosted_url" text,
	"pdf_url" text,
	"due_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
ALTER TABLE "billing_accounts" ADD COLUMN "custom_price_id" text;--> statement-breakpoint
ALTER TABLE "billing_accounts" ADD COLUMN "custom_plan" text;--> statement-breakpoint
ALTER TABLE "billing_accounts" ADD COLUMN "custom_interval" text;--> statement-breakpoint
ALTER TABLE "billing_accounts" ADD COLUMN "custom_amount" integer;--> statement-breakpoint
ALTER TABLE "custom_invoices" ADD CONSTRAINT "custom_invoices_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_invoices" ADD CONSTRAINT "custom_invoices_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_invoices" ADD CONSTRAINT "custom_invoices_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;