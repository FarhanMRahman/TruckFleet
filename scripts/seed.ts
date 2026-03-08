/**
 * TruckFleet demo seed script
 * Run with: pnpm db:seed
 *
 * Seeds a full realistic demo dataset:
 *   - 3 demo user accounts (admin, dispatcher, driver) with known passwords
 *   - 6 trucks in various states
 *   - 3 driver profiles linked to demo users
 *   - 6 chemical load definitions
 *   - 5 trips across all lifecycle states (draft → delivered)
 *   - Messages on in-progress trips
 *   - HOS logs for drivers
 *   - Trip inspections for completed trips
 *
 * Demo credentials:
 *   Admin:      admin@truckfleet.demo   / Demo1234!
 *   Dispatcher: dispatch@truckfleet.demo / Demo1234!
 *   Driver 1:   driver1@truckfleet.demo  / Demo1234!
 *   Driver 2:   driver2@truckfleet.demo  / Demo1234!
 *   Driver 3:   driver3@truckfleet.demo  / Demo1234!
 */

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { hashPassword } from "better-auth/crypto"
import * as schema from "../src/lib/schema"
import { eq } from "drizzle-orm"

const client = postgres(process.env.POSTGRES_URL!)
const db = drizzle(client, { schema })

// ─── Demo users ───────────────────────────────────────────────────────────────

const DEMO_PASSWORD = "Demo1234!"

const demoUsers = [
  { id: "demo-admin-001", name: "Alex Morgan", email: "admin@truckfleet.demo", role: "admin" },
  { id: "demo-dispatch-001", name: "Sam Rivera", email: "dispatch@truckfleet.demo", role: "dispatcher" },
  { id: "demo-driver-001", name: "James Carter", email: "driver1@truckfleet.demo", role: "driver" },
  { id: "demo-driver-002", name: "Maria Santos", email: "driver2@truckfleet.demo", role: "driver" },
  { id: "demo-driver-003", name: "Ravi Patel", email: "driver3@truckfleet.demo", role: "driver" },
]

// ─── Trucks ───────────────────────────────────────────────────────────────────

const trucks: typeof schema.trucks.$inferInsert[] = [
  { id: "demo-truck-001", name: "Tanker One",    plate: "TX-001-HAZ", type: "tanker",       status: "on_trip" },
  { id: "demo-truck-002", name: "Tanker Two",    plate: "TX-002-HAZ", type: "tanker",       status: "available" },
  { id: "demo-truck-003", name: "HazMat Bravo",  plate: "TX-003-HMT", type: "hazmat",       status: "on_trip" },
  { id: "demo-truck-004", name: "Flatbed Alpha", plate: "TX-004-FLT", type: "flatbed",      status: "available" },
  { id: "demo-truck-005", name: "Tanker Three",  plate: "TX-005-HAZ", type: "tanker",       status: "maintenance" },
  { id: "demo-truck-006", name: "Flatbed Beta",  plate: "TX-006-FLT", type: "flatbed",      status: "available" },
]

// ─── Chemical loads ───────────────────────────────────────────────────────────

const loads: typeof schema.chemicalLoads.$inferInsert[] = [
  {
    id: "demo-load-001",
    name: "Gasoline (Regular)",
    hazardClass: "3",
    unNumber: "UN1203",
    requiredVehicleType: "tanker",
    requiredCertifications: ["hazmat", "tanker"],
    handlingNotes: "Keep away from ignition sources. Ground truck before transfer.",
  },
  {
    id: "demo-load-002",
    name: "Sulfuric Acid (Battery Grade)",
    hazardClass: "8",
    unNumber: "UN1830",
    requiredVehicleType: "tanker",
    requiredCertifications: ["hazmat", "tanker", "acid"],
    handlingNotes: "Full PPE required. Neutralising agent must be on board.",
  },
  {
    id: "demo-load-003",
    name: "Chlorine Gas (Compressed)",
    hazardClass: "2.3",
    unNumber: "UN1017",
    requiredVehicleType: "hazmat",
    requiredCertifications: ["hazmat", "compressed_gas", "twic"],
    handlingNotes: "Emergency escape respirator required. Notify LEPC prior to transport.",
  },
  {
    id: "demo-load-004",
    name: "Sodium Hydroxide Solution",
    hazardClass: "8",
    unNumber: "UN1824",
    requiredVehicleType: "tanker",
    requiredCertifications: ["hazmat"],
    handlingNotes: "Avoid contact with skin and eyes. Rinse affected area with water.",
  },
  {
    id: "demo-load-005",
    name: "Ammonium Nitrate Fertiliser",
    hazardClass: "5.1",
    unNumber: "UN2067",
    requiredVehicleType: "flatbed",
    requiredCertifications: ["hazmat", "explosives_precursor"],
    handlingNotes: "Keep dry. Do not store near organic materials or fuel.",
  },
  {
    id: "demo-load-006",
    name: "Liquid Nitrogen (Refrigerated)",
    hazardClass: "2.2",
    unNumber: "UN1977",
    requiredVehicleType: "tanker",
    requiredCertifications: ["hazmat", "compressed_gas"],
    handlingNotes: "Cryogenic liquid. Insulated PPE required. Ensure adequate ventilation.",
  },
]

// ─── Driver profiles ──────────────────────────────────────────────────────────

const drivers = [
  {
    id: "demo-driverprofile-001",
    userId: "demo-driver-001",
    licenseNumber: "CDL-TX-448821",
    certifications: ["hazmat", "tanker"],
    status: "driving",
  },
  {
    id: "demo-driverprofile-002",
    userId: "demo-driver-002",
    licenseNumber: "CDL-TX-338847",
    certifications: ["hazmat", "tanker", "acid", "twic"],
    status: "on_shift",
  },
  {
    id: "demo-driverprofile-003",
    userId: "demo-driver-003",
    licenseNumber: "CDL-TX-229903",
    certifications: ["hazmat", "explosives_precursor"],
    status: "available",
  },
]

// ─── Trips ────────────────────────────────────────────────────────────────────

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000)
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000)

const trips: typeof schema.trips.$inferInsert[] = [
  {
    id: "demo-trip-001",
    truckId: "demo-truck-001",
    driverId: "demo-driverprofile-001",
    loadId: "demo-load-001",
    status: "in_progress",
    origin: "Houston, TX",
    destination: "Dallas, TX",
    scheduledAt: hoursAgo(2),
    startedAt: hoursAgo(1.5),
    notes: "Priority delivery — fuel depot restocking.",
    createdBy: "demo-dispatch-001",
  },
  {
    id: "demo-trip-002",
    truckId: "demo-truck-003",
    driverId: "demo-driverprofile-002",
    loadId: "demo-load-003",
    status: "assigned",
    origin: "Beaumont, TX",
    destination: "San Antonio, TX",
    scheduledAt: hoursFromNow(3),
    notes: "LEPC notification sent. Escort required through city limits.",
    createdBy: "demo-dispatch-001",
  },
  {
    id: "demo-trip-003",
    truckId: "demo-truck-002",
    driverId: "demo-driverprofile-001",
    loadId: "demo-load-002",
    status: "delivered",
    origin: "Port Arthur, TX",
    destination: "Austin, TX",
    scheduledAt: hoursAgo(26),
    startedAt: hoursAgo(25),
    deliveredAt: hoursAgo(18),
    notes: "Delivered successfully. No incidents.",
    createdBy: "demo-dispatch-001",
  },
  {
    id: "demo-trip-004",
    truckId: null,
    driverId: null,
    loadId: "demo-load-005",
    status: "draft",
    origin: "Corpus Christi, TX",
    destination: "Amarillo, TX",
    scheduledAt: hoursFromNow(48),
    notes: "Pending driver assignment. Requires explosives precursor cert.",
    createdBy: "demo-dispatch-001",
  },
  {
    id: "demo-trip-005",
    truckId: "demo-truck-004",
    driverId: "demo-driverprofile-003",
    loadId: "demo-load-005",
    status: "cancelled",
    origin: "Lubbock, TX",
    destination: "El Paso, TX",
    scheduledAt: hoursAgo(10),
    notes: "Cancelled — customer postponed order.",
    createdBy: "demo-dispatch-001",
  },
]

// ─── Messages ─────────────────────────────────────────────────────────────────

const tripMessages: typeof schema.messages.$inferInsert[] = [
  {
    tripId: "demo-trip-001",
    senderId: "demo-dispatch-001",
    senderName: "Sam Rivera",
    content: "Hey James, please confirm once you leave Houston. ETA to Dallas?",
    createdAt: hoursAgo(1.4),
  },
  {
    tripId: "demo-trip-001",
    senderId: "demo-driver-001",
    senderName: "James Carter",
    content: "On my way. Should be there in about 4 hours barring traffic.",
    createdAt: hoursAgo(1.3),
  },
  {
    tripId: "demo-trip-001",
    senderId: "demo-dispatch-001",
    senderName: "Sam Rivera",
    content: "There's construction on I-45 around Corsicana. Consider taking US-287.",
    createdAt: hoursAgo(0.8),
  },
  {
    tripId: "demo-trip-002",
    senderId: "demo-dispatch-001",
    senderName: "Sam Rivera",
    content: "Maria, your trip is confirmed for 3pm. Docs are attached to the trip.",
    createdAt: hoursAgo(0.5),
  },
  {
    tripId: "demo-trip-002",
    senderId: "demo-driver-002",
    senderName: "Maria Santos",
    content: "Got it. I'll do the pre-trip inspection at 2pm.",
    createdAt: hoursAgo(0.3),
  },
]

// ─── HOS logs ─────────────────────────────────────────────────────────────────

const hosLogs: typeof schema.hosLogs.$inferInsert[] = [
  // James — open shift + current driving trip
  {
    driverId: "demo-driverprofile-001",
    type: "shift",
    shiftStart: hoursAgo(2),
    shiftEnd: null,
    drivingMinutes: 0,
  },
  {
    driverId: "demo-driverprofile-001",
    tripId: "demo-trip-003",
    type: "driving",
    shiftStart: hoursAgo(25),
    shiftEnd: hoursAgo(18),
    drivingMinutes: 420, // 7 hours
  },
  // Maria — on shift
  {
    driverId: "demo-driverprofile-002",
    type: "shift",
    shiftStart: hoursAgo(1),
    shiftEnd: null,
    drivingMinutes: 0,
  },
]

// ─── Trip inspections (for the delivered trip) ────────────────────────────────

const inspectionItems = [
  { item: "Brakes operational", checked: true },
  { item: "Lights and signals", checked: true },
  { item: "HazMat placards visible", checked: true },
  { item: "Load secured properly", checked: true },
  { item: "PPE kit present", checked: true },
  { item: "Fire extinguisher present", checked: true },
  { item: "Emergency contact list present", checked: true },
]

const inspections: typeof schema.tripInspections.$inferInsert[] = [
  {
    tripId: "demo-trip-003",
    driverId: "demo-driverprofile-001",
    type: "pre",
    items: inspectionItems,
    completedAt: hoursAgo(25),
  },
  {
    tripId: "demo-trip-003",
    driverId: "demo-driverprofile-001",
    type: "post",
    items: inspectionItems,
    completedAt: hoursAgo(18),
  },
]

// ─── Truck locations (simulated GPS for in-progress trucks) ───────────────────

const truckLocations: typeof schema.truckLocations.$inferInsert[] = [
  // Tanker One — en route Houston → Dallas (roughly halfway)
  {
    truckId: "demo-truck-001",
    driverId: "demo-driverprofile-001",
    lat: 31.548,
    lng: -96.473,
    heading: 350,
    speed: 95,
    recordedAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
  },
  // HazMat Bravo — staged at Beaumont yard
  {
    truckId: "demo-truck-003",
    driverId: "demo-driverprofile-002",
    lat: 30.0802,
    lng: -94.1266,
    heading: 270,
    speed: 0,
    recordedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
  },
]

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding TruckFleet demo database...\n")

  // Clear domain tables (preserve auth tables so existing logins still work)
  console.log("  Clearing existing domain data...")
  await db.delete(schema.hosLogs)
  await db.delete(schema.tripInspections)
  await db.delete(schema.proofOfDeliveries)
  await db.delete(schema.messages)
  await db.delete(schema.notifications)
  await db.delete(schema.truckLocations)
  await db.delete(schema.trips)
  await db.delete(schema.drivers)
  await db.delete(schema.chemicalLoads)
  await db.delete(schema.trucks)

  // Upsert demo users
  console.log("  Creating demo users...")
  const hashedPassword = await hashPassword(DEMO_PASSWORD)
  for (const u of demoUsers) {
    const existing = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, u.email))
    if (existing.length === 0) {
      await db.insert(schema.user).values({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: true,
        role: u.role,
      })
      await db.insert(schema.account).values({
        id: `demo-account-${u.id}`,
        accountId: u.email,
        providerId: "credential",
        userId: u.id,
        password: hashedPassword,
      })
    } else {
      await db.update(schema.user).set({ role: u.role }).where(eq(schema.user.email, u.email))
    }
  }
  console.log(`  ✓ ${demoUsers.length} demo users ready`)

  // Trucks
  console.log("  Inserting trucks...")
  await db.insert(schema.trucks).values(trucks)
  console.log(`  ✓ ${trucks.length} trucks`)

  // Loads
  console.log("  Inserting chemical loads...")
  await db.insert(schema.chemicalLoads).values(loads)
  console.log(`  ✓ ${loads.length} chemical loads`)

  // Drivers
  console.log("  Inserting driver profiles...")
  await db.insert(schema.drivers).values(drivers)
  console.log(`  ✓ ${drivers.length} driver profiles`)

  // Trips
  console.log("  Inserting trips...")
  await db.insert(schema.trips).values(trips)
  console.log(`  ✓ ${trips.length} trips`)

  // Messages
  console.log("  Inserting messages...")
  await db.insert(schema.messages).values(tripMessages)
  console.log(`  ✓ ${tripMessages.length} messages`)

  // HOS logs
  console.log("  Inserting HOS logs...")
  await db.insert(schema.hosLogs).values(hosLogs)
  console.log(`  ✓ ${hosLogs.length} HOS log entries`)

  // Inspections
  console.log("  Inserting trip inspections...")
  await db.insert(schema.tripInspections).values(inspections)
  console.log(`  ✓ ${inspections.length} inspections`)

  // Locations
  console.log("  Inserting truck locations...")
  await db.insert(schema.truckLocations).values(truckLocations)
  console.log(`  ✓ ${truckLocations.length} location pings`)

  console.log("\n✅ Demo seed complete!\n")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("  Demo credentials (password: Demo1234!)")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("  Admin:      admin@truckfleet.demo")
  console.log("  Dispatcher: dispatch@truckfleet.demo")
  console.log("  Driver 1:   driver1@truckfleet.demo")
  console.log("  Driver 2:   driver2@truckfleet.demo")
  console.log("  Driver 3:   driver3@truckfleet.demo")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
  .finally(() => {
    void client.end()
  })
