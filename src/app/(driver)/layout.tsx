import { requireRole } from "@/lib/session";
import { DriverBottomNav } from "@/components/layouts/driver-bottom-nav";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["driver"]);

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20">
      {children}
      <DriverBottomNav />
    </div>
  );
}
