import { requireRole } from "@/lib/session";
import { DispatcherNav } from "@/components/layouts/dispatcher-nav";

export default async function DispatcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["dispatcher", "admin"]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DispatcherNav />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
