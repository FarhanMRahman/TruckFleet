CREATE TABLE "chemical_loads" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hazard_class" text NOT NULL,
	"un_number" text,
	"required_vehicle_type" text NOT NULL,
	"required_certifications" text[] DEFAULT '{}' NOT NULL,
	"handling_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"license_number" text NOT NULL,
	"certifications" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "drivers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" text PRIMARY KEY NOT NULL,
	"truck_id" text,
	"driver_id" text,
	"load_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"delivered_at" timestamp,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trucks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"plate" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trucks_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'driver';--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_truck_id_trucks_id_fk" FOREIGN KEY ("truck_id") REFERENCES "public"."trucks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_load_id_chemical_loads_id_fk" FOREIGN KEY ("load_id") REFERENCES "public"."chemical_loads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drivers_user_id_idx" ON "drivers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trips_status_idx" ON "trips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trips_driver_id_idx" ON "trips" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "trips_truck_id_idx" ON "trips" USING btree ("truck_id");--> statement-breakpoint
CREATE INDEX "trucks_status_idx" ON "trucks" USING btree ("status");