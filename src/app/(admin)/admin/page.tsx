import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { trucks, drivers, chemicalLoads, trips, user } from "@/lib/schema";
import { count, eq, inArray } from "drizzle-orm";
import {
  Truck,
  Users,
  FlaskConical,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard" };

const TRUCK_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  on_trip: "On Trip",
  maintenance: "Maintenance",
  inactive: "Inactive",
};

const DRIVER_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  on_shift: "On Shift",
  driving: "Driving",
  delivering: "Delivering",
  off_duty: "Off Duty",
};

const TRIP_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  assigned: "Assigned",
  in_progress: "In Progress",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const TRUCK_STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500/10 text-green-600 dark:text-green-400",
  on_trip: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  maintenance: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  inactive: "bg-muted text-muted-foreground",
};

const DRIVER_STATUS_COLORS: Record<string, string> = {
  available: "bg-green-500/10 text-green-600 dark:text-green-400",
  on_shift: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  driving: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  delivering: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  off_duty: "bg-muted text-muted-foreground",
};

const TRIP_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  assigned: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  delivered: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const TRIP_STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <Clock className="h-3.5 w-3.5" />,
  assigned: <Clock className="h-3.5 w-3.5" />,
  in_progress: <MapPin className="h-3.5 w-3.5" />,
  delivered: <CheckCircle2 className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
};

import type React from "react";

export default async function AdminDashboardPage() {
  const { session } = await requireRole(["admin"]);

  // ── Parallel queries ────────────────────────────────────────────────────────

  const [
    truckRows,
    driverRows,
    loadsResult,
    activeTripsResult,
    recentTrips,
  ] = await Promise.all([
    // All trucks (for status breakdown)
    db.select({ status: trucks.status }).from(trucks),

    // All drivers (for status breakdown)
    db.select({ status: drivers.status }).from(drivers),

    // Total chemical loads
    db.select({ value: count() }).from(chemicalLoads),

    // Active trips (in_progress)
    db
      .select({ value: count() })
      .from(trips)
      .where(eq(trips.status, "in_progress")),


    // Recent trips with joined names
    db
      .select({
        id: trips.id,
        status: trips.status,
        origin: trips.origin,
        destination: trips.destination,
        scheduledAt: trips.scheduledAt,
        createdAt: trips.createdAt,
        truckId: trips.truckId,
        driverId: trips.driverId,
        loadId: trips.loadId,
      })
      .from(trips)
      .orderBy(trips.createdAt)
      .limit(5),
  ]);

  // ── Enrich recent trips with names ─────────────────────────────────────────

  const truckIds = recentTrips.map((t) => t.truckId).filter(Boolean) as string[];
  const driverIds = recentTrips.map((t) => t.driverId).filter(Boolean) as string[];
  const loadIds = recentTrips.map((t) => t.loadId).filter(Boolean) as string[];

  const [truckNames, driverDetails, loadNames] = await Promise.all([
    truckIds.length
      ? db
          .select({ id: trucks.id, name: trucks.name })
          .from(trucks)
          .where(inArray(trucks.id, truckIds))
      : [],
    driverIds.length
      ? db
          .select({ id: drivers.id, userId: drivers.userId })
          .from(drivers)
          .where(inArray(drivers.id, driverIds))
      : [],
    loadIds.length
      ? db
          .select({ id: chemicalLoads.id, name: chemicalLoads.name })
          .from(chemicalLoads)
          .where(inArray(chemicalLoads.id, loadIds))
      : [],
  ]);

  const driverUserIds = driverDetails.map((d) => d.userId);
  const userNames =
    driverUserIds.length
      ? await db
          .select({ id: user.id, name: user.name })
          .from(user)
          .where(inArray(user.id, driverUserIds))
      : [];

  const truckMap = Object.fromEntries(truckNames.map((t) => [t.id, t.name]));
  const userMap = Object.fromEntries(userNames.map((u) => [u.id, u.name]));
  const driverMap = Object.fromEntries(
    driverDetails.map((d) => [d.id, userMap[d.userId] ?? "Unknown"])
  );
  const loadMap = Object.fromEntries(loadNames.map((l) => [l.id, l.name]));

  // ── Derived counts ──────────────────────────────────────────────────────────

  const totalLoads = loadsResult[0]?.value ?? 0;
  const activeTrips = activeTripsResult[0]?.value ?? 0;

  const totalTrucks = truckRows.length;
  const activeDrivers = driverRows.filter((d) => d.status !== "off_duty").length;

  const truckStatusCounts = truckRows.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  const driverStatusCounts = driverRows.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/trucks">
          <div className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Truck className="h-4 w-4" />
              <span>Total Trucks</span>
            </div>
            <p className="text-3xl font-bold">{totalTrucks}</p>
          </div>
        </Link>

        <Link href="/admin/drivers">
          <div className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              <span>Active Drivers</span>
            </div>
            <p className="text-3xl font-bold">{activeDrivers}</p>
            <p className="text-xs text-muted-foreground">{driverRows.length} total</p>
          </div>
        </Link>

        <Link href="/admin/loads">
          <div className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <FlaskConical className="h-4 w-4" />
              <span>Chemical Loads</span>
            </div>
            <p className="text-3xl font-bold">{totalLoads}</p>
          </div>
        </Link>

        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4" />
            <span>Active Trips</span>
          </div>
          <p className="text-3xl font-bold">{activeTrips}</p>
        </div>
      </div>

      {/* Fleet & Driver status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Fleet status */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Fleet Status</h2>
            <Link href="/admin/trucks" className="text-xs text-muted-foreground hover:underline">
              Manage →
            </Link>
          </div>
          <div className="space-y-2">
            {Object.entries(TRUCK_STATUS_LABELS).map(([status, label]) => {
              const cnt = truckStatusCounts[status] ?? 0;
              const pct = totalTrucks > 0 ? Math.round((cnt / totalTrucks) * 100) : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${TRUCK_STATUS_COLORS[status]}`}>
                      {label}
                    </span>
                    <span className="text-muted-foreground">{cnt} / {totalTrucks}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === "available" ? "bg-green-500" :
                        status === "on_trip" ? "bg-blue-500" :
                        status === "maintenance" ? "bg-yellow-500" :
                        "bg-muted-foreground/40"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver status */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Driver Status</h2>
            <Link href="/admin/drivers" className="text-xs text-muted-foreground hover:underline">
              Manage →
            </Link>
          </div>
          <div className="space-y-2">
            {Object.entries(DRIVER_STATUS_LABELS).map(([status, label]) => {
              const cnt = driverStatusCounts[status] ?? 0;
              const total = driverRows.length;
              const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${DRIVER_STATUS_COLORS[status]}`}>
                      {label}
                    </span>
                    <span className="text-muted-foreground">{cnt} / {total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        status === "available" ? "bg-green-500" :
                        status === "on_shift" ? "bg-blue-500" :
                        status === "driving" ? "bg-purple-500" :
                        status === "delivering" ? "bg-orange-500" :
                        "bg-muted-foreground/40"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent trips */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Recent Trips</h2>
        </div>

        {recentTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
            <AlertTriangle className="h-8 w-8 opacity-30" />
            <p className="text-sm">No trips yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-medium truncate">
                    {trip.origin} → {trip.destination}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trip.driverId ? driverMap[trip.driverId] : "No driver"} ·{" "}
                    {trip.truckId ? truckMap[trip.truckId] : "No truck"} ·{" "}
                    {trip.loadId ? loadMap[trip.loadId] : "No load"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${TRIP_STATUS_COLORS[trip.status]}`}
                >
                  {TRIP_STATUS_ICONS[trip.status]}
                  {TRIP_STATUS_LABELS[trip.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
