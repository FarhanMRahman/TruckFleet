/**
 * TruckFleet seed script
 * Run with: pnpm db:seed
 *
 * Seeds sample trucks and chemical loads.
 * After running, sign in with your account and use `pnpm db:studio`
 * to manually set your user's `role` field to "admin", "dispatcher", or "driver".
 */

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../src/lib/schema"

const client = postgres(process.env.POSTGRES_URL!)
const db = drizzle(client, { schema })

const sampleTrucks: typeof schema.trucks.$inferInsert[] = [
  { name: "Truck Alpha", plate: "TX-001-HAZ", type: "tanker", status: "available" },
  { name: "Truck Bravo", plate: "TX-002-HAZ", type: "hazmat", status: "available" },
  { name: "Truck Charlie", plate: "TX-003-FLT", type: "flatbed", status: "available" },
  { name: "Truck Delta", plate: "TX-004-HAZ", type: "tanker", status: "maintenance" },
  { name: "Truck Echo", plate: "TX-005-FLT", type: "flatbed", status: "inactive" },
]

const sampleChemicalLoads: typeof schema.chemicalLoads.$inferInsert[] = [
  {
    name: "Gasoline (Regular)",
    hazardClass: "Class 3 - Flammable Liquids",
    unNumber: "UN1203",
    requiredVehicleType: "tanker",
    requiredCertifications: ["hazmat", "tanker"],
    handlingNotes: "Keep away from ignition sources. Ground truck before transfer.",
  },
  {
    name: "Sulfuric Acid (Battery Grade)",
    hazardClass: "Class 8 - Corrosives",
    unNumber: "UN1830",
    requiredVehicleType: "tanker",
    requiredCertifications: ["hazmat", "tanker", "acid"],
    handlingNotes: "Full PPE required. Neutralizing agent must be on board.",
  },
  {
    name: "Chlorine Gas (Compressed)",
    hazardClass: "Class 2.3 - Toxic Gas",
    unNumber: "UN1017",
    requiredVehicleType: "hazmat",
    requiredCertifications: ["hazmat", "compressed_gas", "twic"],
    handlingNotes: "Emergency escape respirator required. Notify LEPC prior to transport.",
  },
  {
    name: "Sodium Hydroxide Solution",
    hazardClass: "Class 8 - Corrosives",
    unNumber: "UN1824",
    requiredVehicleType: "tanker",
    requiredCertifications: ["hazmat"],
    handlingNotes: "Avoid contact with skin and eyes. Rinse affected area with water.",
  },
  {
    name: "Ammonium Nitrate Fertilizer",
    hazardClass: "Class 5.1 - Oxidizers",
    unNumber: "UN2067",
    requiredVehicleType: "flatbed",
    requiredCertifications: ["hazmat", "explosives_precursor"],
    handlingNotes: "Keep dry. Do not store near organic materials or fuel.",
  },
]

async function seed() {
  console.log("🌱 Seeding TruckFleet database...")

  // Clear existing seed data
  console.log("  Clearing existing trucks and chemical loads...")
  await db.delete(schema.chemicalLoads)
  await db.delete(schema.trucks)

  // Insert trucks
  console.log("  Inserting trucks...")
  await db.insert(schema.trucks).values(sampleTrucks)
  console.log(`  ✓ ${sampleTrucks.length} trucks inserted`)

  // Insert chemical loads
  console.log("  Inserting chemical loads...")
  await db.insert(schema.chemicalLoads).values(sampleChemicalLoads)
  console.log(`  ✓ ${sampleChemicalLoads.length} chemical loads inserted`)

  console.log("\n✅ Seed complete!")
  console.log("\n📝 Next step:")
  console.log("   Sign in at http://localhost:3000/login, then run:")
  console.log("   pnpm db:studio")
  console.log("   → Find your user in the `user` table")
  console.log("   → Set the `role` field to: admin | dispatcher | driver")
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
  .finally(() => {
    void client.end()
  })
