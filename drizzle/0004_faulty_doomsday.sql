CREATE TABLE "shop_searches" (
	"key" text PRIMARY KEY NOT NULL,
	"shops" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
