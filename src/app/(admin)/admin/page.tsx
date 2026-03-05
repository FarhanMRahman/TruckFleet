import { requireRole } from "@/lib/session";
import { Truck, Users, FlaskConical, MapPin } from "lucide-react";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const { session } = await requireRole(["admin"]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}
        </p>
      </div>

      {/* Summary cards — will be wired to real data in Phase 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Truck className="h-4 w-4" />
            <span>Total Trucks</span>
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            <span>Active Drivers</span>
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <FlaskConical className="h-4 w-4" />
            <span>Chemical Loads</span>
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>
        <div className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4" />
            <span>Active Trips</span>
          </div>
          <p className="text-3xl font-bold">—</p>
        </div>
      </div>

      <div className="border rounded-lg p-6 text-center text-muted-foreground">
        <p className="text-sm">Fleet management features coming in Phase 1.</p>
      </div>
    </div>
  );
}
