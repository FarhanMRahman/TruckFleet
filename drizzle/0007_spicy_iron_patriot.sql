CREATE TABLE "proof_of_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"trip_id" text NOT NULL,
	"driver_id" text NOT NULL,
	"signature_data_url" text NOT NULL,
	"signed_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "proof_of_deliveries_trip_id_unique" UNIQUE("trip_id")
);
--> statement-breakpoint
ALTER TABLE "proof_of_deliveries" ADD CONSTRAINT "proof_of_deliveries_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_of_deliveries" ADD CONSTRAINT "proof_of_deliveries_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pod_trip_id_idx" ON "proof_of_deliveries" USING btree ("trip_id");