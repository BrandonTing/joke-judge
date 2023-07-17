CREATE TABLE IF NOT EXISTS "jokes" (
	"msg_id" text PRIMARY KEY NOT NULL,
	"msg_content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "judges" (
	"judge_id" text PRIMARY KEY NOT NULL,
	"judge_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ratings" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ratings" DROP COLUMN IF EXISTS "msg_content";--> statement-breakpoint
ALTER TABLE "ratings" DROP COLUMN IF EXISTS "judge_name";