import { pgTable, text, timestamp, boolean, index, doublePrecision, json, integer } from "drizzle-orm/pg-core";

// IMPORTANT! ID fields should ALWAYS use UUID types, EXCEPT the BetterAuth tables.

// ─── BetterAuth core tables ───────────────────────────────────────────────────

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    // TruckFleet: role for access control
    role: text("role").default("driver"), // admin | dispatcher | driver
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("user_email_idx").on(table.email)]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_token_idx").on(table.token),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_account_idx").on(table.providerId, table.accountId),
  ]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// ─── TruckFleet domain tables ─────────────────────────────────────────────────

export const trucks = pgTable(
  "trucks",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    plate: text("plate").notNull().unique(),
    // e.g. "flatbed" | "tanker" | "hazmat" | "refrigerated"
    type: text("type").notNull(),
    // "available" | "on_trip" | "maintenance" | "inactive"
    status: text("status").notNull().default("available"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("trucks_status_idx").on(table.status)]
);

export const drivers = pgTable(
  "drivers",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    licenseNumber: text("license_number").notNull(),
    // Array of certification codes, e.g. ["hazmat", "twic", "tanker"]
    certifications: text("certifications").array().notNull().default([]),
    // "available" | "on_shift" | "driving" | "delivering" | "off_duty"
    status: text("status").notNull().default("available"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("drivers_user_id_idx").on(table.userId)]
);

export const chemicalLoads = pgTable(
  "chemical_loads",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    // DOT hazard class, e.g. "Class 3 - Flammable Liquids"
    hazardClass: text("hazard_class").notNull(),
    // UN identification number, e.g. "UN1203"
    unNumber: text("un_number"),
    // Required truck type for this chemical
    requiredVehicleType: text("required_vehicle_type").notNull(),
    // Required driver certifications, e.g. ["hazmat", "tanker"]
    requiredCertifications: text("required_certifications").array().notNull().default([]),
    handlingNotes: text("handling_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  }
);

export const trips = pgTable(
  "trips",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    truckId: text("truck_id").references(() => trucks.id),
    driverId: text("driver_id").references(() => drivers.id),
    loadId: text("load_id").references(() => chemicalLoads.id),
    // "draft" | "assigned" | "in_progress" | "delivered" | "cancelled"
    status: text("status").notNull().default("draft"),
    origin: text("origin").notNull(),
    destination: text("destination").notNull(),
    scheduledAt: timestamp("scheduled_at"),
    startedAt: timestamp("started_at"),
    deliveredAt: timestamp("delivered_at"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("trips_status_idx").on(table.status),
    index("trips_driver_id_idx").on(table.driverId),
    index("trips_truck_id_idx").on(table.truckId),
  ]
);

export const truckLocations = pgTable(
  "truck_locations",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    truckId: text("truck_id")
      .notNull()
      .references(() => trucks.id, { onDelete: "cascade" }),
    driverId: text("driver_id")
      .references(() => drivers.id, { onDelete: "set null" }),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    heading: doublePrecision("heading"),
    speed: doublePrecision("speed"), // km/h
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (table) => [
    index("truck_locations_truck_id_idx").on(table.truckId),
    index("truck_locations_recorded_at_idx").on(table.recordedAt),
  ]
)

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    senderName: text("sender_name").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("messages_trip_id_idx").on(table.tripId)]
)

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "trip_assigned" | "trip_updated" | "trip_cancelled"
    message: text("message").notNull(),
    tripId: text("trip_id").references(() => trips.id, { onDelete: "set null" }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_read_idx").on(table.read),
  ]
)

export const proofOfDeliveries = pgTable(
  "proof_of_deliveries",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tripId: text("trip_id")
      .notNull()
      .unique()
      .references(() => trips.id, { onDelete: "cascade" }),
    driverId: text("driver_id")
      .notNull()
      .references(() => drivers.id, { onDelete: "cascade" }),
    // Base64 PNG data URL of the signature
    signatureDataUrl: text("signature_data_url").notNull(),
    signedAt: timestamp("signed_at").defaultNow().notNull(),
    notes: text("notes"),
  },
  (table) => [index("pod_trip_id_idx").on(table.tripId)]
)

export const tripInspections = pgTable(
  "trip_inspections",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    driverId: text("driver_id")
      .notNull()
      .references(() => drivers.id, { onDelete: "cascade" }),
    // "pre" | "post"
    type: text("type").notNull(),
    // Array of { item: string, checked: boolean }
    items: json("items").notNull().$type<{ item: string; checked: boolean }[]>(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (table) => [
    index("trip_inspections_trip_id_idx").on(table.tripId),
    index("trip_inspections_type_idx").on(table.tripId, table.type),
  ]
)

export const hosLogs = pgTable(
  "hos_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    driverId: text("driver_id")
      .notNull()
      .references(() => drivers.id, { onDelete: "cascade" }),
    // null for shift records; set for driving records linked to a trip
    tripId: text("trip_id").references(() => trips.id, { onDelete: "set null" }),
    // "shift" | "driving"
    type: text("type").notNull(),
    shiftStart: timestamp("shift_start"),
    shiftEnd: timestamp("shift_end"),
    // Populated for type="driving" when trip is delivered
    drivingMinutes: integer("driving_minutes").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("hos_logs_driver_id_idx").on(table.driverId),
    index("hos_logs_created_at_idx").on(table.createdAt),
  ]
)

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type Truck = typeof trucks.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type ChemicalLoad = typeof chemicalLoads.$inferSelect;
export type Trip = typeof trips.$inferSelect;

export type TruckLocation = typeof truckLocations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type TripInspection = typeof tripInspections.$inferSelect;
export type ProofOfDelivery = typeof proofOfDeliveries.$inferSelect;
export type HosLog = typeof hosLogs.$inferSelect;
export type UserRole = "admin" | "dispatcher" | "driver";
export type TruckStatus = "available" | "on_trip" | "maintenance" | "inactive";
export type DriverStatus = "available" | "on_shift" | "driving" | "delivering" | "off_duty";
export type TripStatus = "draft" | "assigned" | "in_progress" | "delivered" | "cancelled";
