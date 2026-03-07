CREATE TABLE "trip_inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"driver_id" text NOT NULL,
	"type" text NOT NULL,
	"items" json NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_inspections" ADD CONSTRAINT "trip_inspections_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_inspections" ADD CONSTRAINT "trip_inspections_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trip_inspections_trip_id_idx" ON "trip_inspections" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "trip_inspections_type_idx" ON "trip_inspections" USING btree ("trip_id","type");