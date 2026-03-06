CREATE TABLE "truck_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"truck_id" text NOT NULL,
	"driver_id" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"heading" double precision,
	"speed" double precision,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "truck_locations" ADD CONSTRAINT "truck_locations_truck_id_trucks_id_fk" FOREIGN KEY ("truck_id") REFERENCES "public"."trucks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "truck_locations" ADD CONSTRAINT "truck_locations_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "truck_locations_truck_id_idx" ON "truck_locations" USING btree ("truck_id");--> statement-breakpoint
CREATE INDEX "truck_locations_recorded_at_idx" ON "truck_locations" USING btree ("recorded_at");