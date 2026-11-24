ALTER TABLE "support_tickets" ADD COLUMN "category" text DEFAULT 'help' NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "severity" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "details" jsonb;