CREATE TABLE IF NOT EXISTS "ratings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"msg_id" text NOT NULL,
	"msg_content" text NOT NULL,
	"judge_id" text NOT NULL,
	"judge_name" text NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
