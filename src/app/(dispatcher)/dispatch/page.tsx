import { requireRole } from "@/lib/session";
import { MapPin, Truck, Clock, AlertCircle } from "lucide-react";

export const metadata = { title: "Dispatch Dashboard" };

export default async function DispatchDashboardPage() {
  const { session } = await requireRole(["dispatcher", "admin"]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dispatch Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}
        </p>
      </div>

      {/* Summary cards — will be wired to real data in Phase 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4" />
            <span>Active Trips</span>
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Truck className="h-4 w-4" />
            <span>Available Trucks</span>
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            <span>Scheduled Today</span>
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Alerts</span>
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>
      </div>

      <div className="border rounded-lg p-6 text-center text-muted-foreground">
        <p className="text-sm">Trip creation and fleet management coming in Phase 2.</p>
      </div>
    </div>
  );
}
