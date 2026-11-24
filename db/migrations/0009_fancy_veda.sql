CREATE TABLE "billing_accounts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"plan" text,
	"interval" text,
	"status" text,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_accounts_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "billing_user_id" text;--> statement-breakpoint
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_billing_user_id_user_id_fk" FOREIGN KEY ("billing_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Existing sites: billed to their first owner, who gets a fresh 14-day trial
UPDATE "sites" s SET "billing_user_id" = (
    SELECT m."user_id" FROM "site_members" m WHERE m."site_id" = s."id" AND m."role" = 'owner' ORDER BY m."created_at" LIMIT 1
) WHERE s."billing_user_id" IS NULL;--> statement-breakpoint
INSERT INTO "billing_accounts" ("user_id", "trial_ends_at")
SELECT DISTINCT s."billing_user_id", now() + interval '14 days' FROM "sites" s WHERE s."billing_user_id" IS NOT NULL
ON CONFLICT DO NOTHING;
