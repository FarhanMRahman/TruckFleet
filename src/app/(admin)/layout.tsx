import { requireRole } from "@/lib/session";
import { AdminNav } from "@/components/layouts/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminNav />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
