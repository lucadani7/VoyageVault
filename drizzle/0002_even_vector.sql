CREATE TYPE "public"."visit_status" AS ENUM('visited', 'visiting', 'planned');--> statement-breakpoint
ALTER TABLE "trip_stops" ADD COLUMN "visit_status" "visit_status";