ALTER TABLE "interest_signups" ADD COLUMN "source" jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "signup_source" jsonb;