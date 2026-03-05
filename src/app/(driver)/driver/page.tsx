import { requireRole } from "@/lib/session";
import { MapPin, Package, CheckCircle } from "lucide-react";

export const metadata = { title: "Driver Home" };

export default async function DriverHomePage() {
  const { session } = await requireRole(["driver"]);

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Hello, {session.user.name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground text-sm">Here&apos;s your day at a glance.</p>
      </div>

      {/* Today's trip card — placeholder until Phase 3 */}
      <div className="border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wide">
          <MapPin className="h-4 w-4" />
          Today&apos;s Trip
        </div>
        <p className="text-muted-foreground text-sm">No trips assigned yet.</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Package className="h-3.5 w-3.5" />
            <span>Deliveries</span>
          </div>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Completed</span>
          </div>
          <p className="text-2xl font-bold">—</p>
        </div>
      </div>

      <div className="border rounded-lg p-4 text-center text-muted-foreground">
        <p className="text-sm">Driver app features coming in Phase 3.</p>
      </div>
    </div>
  );
}
