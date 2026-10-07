CREATE TYPE "public"."age_group" AS ENUM('child', 'teen', 'adult', 'senior');--> statement-breakpoint
CREATE TYPE "public"."price_tier" AS ENUM('budget', 'mid', 'premium');--> statement-breakpoint
CREATE TYPE "public"."recommendation_status" AS ENUM('suggested', 'bought', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."relationship" AS ENUM('family', 'friend', 'acquaintance', 'classmate', 'coworker');--> statement-breakpoint
CREATE TYPE "public"."souvenir_category" AS ENUM('food', 'drink', 'clothing', 'accessory', 'jewelry', 'decor', 'toy', 'craft', 'art', 'book', 'cosmetics', 'music');--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"relationship" "relationship" NOT NULL,
	"age_group" "age_group" NOT NULL,
	"interests" text[] DEFAULT '{}'::text[] NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_stop_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"souvenir_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"status" "recommendation_status" DEFAULT 'suggested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendations_stop_recipient_souvenir_key" UNIQUE("trip_stop_id","recipient_id","souvenir_id")
);
--> statement-breakpoint
CREATE TABLE "souvenir_translations" (
	"souvenir_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "souvenir_translations_souvenir_id_locale_pk" PRIMARY KEY("souvenir_id","locale")
);
--> statement-breakpoint
CREATE TABLE "souvenirs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"country_code" text NOT NULL,
	"region" text,
	"category" "souvenir_category" NOT NULL,
	"price_tier" "price_tier" NOT NULL,
	"season_months" smallint[] DEFAULT '{}'::smallint[] NOT NULL,
	"age_groups" "age_group"[] NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "souvenirs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "trip_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"country_code" text NOT NULL,
	"region" text,
	"city" text,
	"lat" double precision,
	"lng" double precision,
	"arrival_date" date NOT NULL,
	"departure_date" date NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_trip_stop_id_trip_stops_id_fk" FOREIGN KEY ("trip_stop_id") REFERENCES "public"."trip_stops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_souvenir_id_souvenirs_id_fk" FOREIGN KEY ("souvenir_id") REFERENCES "public"."souvenirs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "souvenir_translations" ADD CONSTRAINT "souvenir_translations_souvenir_id_souvenirs_id_fk" FOREIGN KEY ("souvenir_id") REFERENCES "public"."souvenirs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipients_user_id_idx" ON "recipients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recommendations_recipient_id_idx" ON "recommendations" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "souvenirs_country_code_idx" ON "souvenirs" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "trip_stops_trip_id_idx" ON "trip_stops" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trips_user_id_idx" ON "trips" USING btree ("user_id");