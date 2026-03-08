/**
 * One-time demo database setup.
 * Creates the postgres_demo database and runs all migrations.
 * Run with: pnpm demo:init
 */

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

const demoUrl = process.env.POSTGRES_URL!
// Connect to the default postgres_dev DB to create postgres_demo
const adminUrl = demoUrl.replace("/postgres_demo", "/postgres_dev")

async function init() {
  console.log("🔧 Setting up demo database...\n")

  // Create the demo database if it doesn't exist
  const adminClient = postgres(adminUrl, { max: 1 })
  try {
    await adminClient`CREATE DATABASE postgres_demo`
    console.log("  ✓ Created postgres_demo database")
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("already exists")) {
      console.log("  ✓ postgres_demo already exists")
    } else {
      throw e
    }
  } finally {
    await adminClient.end()
  }

  // Run migrations against the demo database
  const client = postgres(demoUrl, { max: 1 })
  const db = drizzle(client)
  try {
    await migrate(db, { migrationsFolder: "./drizzle" })
    console.log("  ✓ Migrations applied")
  } finally {
    await client.end()
  }

  console.log("\n✅ Demo database ready. Run pnpm demo:seed to populate it.\n")
}

init().catch((err) => {
  console.error("❌ Demo init failed:", err)
  process.exit(1)
})
