CREATE TABLE "hos_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"driver_id" text NOT NULL,
	"trip_id" text,
	"type" text NOT NULL,
	"shift_start" timestamp,
	"shift_end" timestamp,
	"driving_minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hos_logs" ADD CONSTRAINT "hos_logs_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hos_logs" ADD CONSTRAINT "hos_logs_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hos_logs_driver_id_idx" ON "hos_logs" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "hos_logs_created_at_idx" ON "hos_logs" USING btree ("created_at");