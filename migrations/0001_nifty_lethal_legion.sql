CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"firm_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_type" text NOT NULL,
	"event_date" timestamp NOT NULL,
	"venue" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"valid_until" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "photo_editor_id" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "video_editor_id" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "storage_disk" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "storage_size" text;--> statement-breakpoint
ALTER TABLE "firms" ADD COLUMN "spreadsheet_id" text;