import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { trucks, drivers, chemicalLoads, user } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { eq, inArray } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    await requireRole(["dispatcher", "admin"])
    const { searchParams } = new URL(req.url)
    const loadId = searchParams.get("loadId")

    if (!loadId) {
      return NextResponse.json({ error: "loadId is required" }, { status: 400 })
    }

    const [load] = await db
      .select()
      .from(chemicalLoads)
      .where(eq(chemicalLoads.id, loadId))

    if (!load) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 })
    }

    // Trucks: match required vehicle type and available status
    const eligibleTrucks = await db
      .select()
      .from(trucks)
      .where(eq(trucks.type, load.requiredVehicleType))

    // Drivers: must hold all required certifications
    const allDrivers = await db
      .select({
        id: drivers.id,
        userId: drivers.userId,
        licenseNumber: drivers.licenseNumber,
        certifications: drivers.certifications,
        status: drivers.status,
        userName: user.name,
        userEmail: user.email,
      })
      .from(drivers)
      .leftJoin(user, eq(drivers.userId, user.id))

    const required = load.requiredCertifications
    const eligibleDrivers = allDrivers.filter((d) =>
      required.every((cert) => d.certifications.includes(cert))
    )

    return NextResponse.json({ trucks: eligibleTrucks, drivers: eligibleDrivers, load })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
