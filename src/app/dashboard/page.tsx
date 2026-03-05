import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";

// Role router — reads the user's role from session and redirects accordingly.
export default async function DashboardPage() {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;

  if (role === "admin") redirect("/admin");
  if (role === "dispatcher") redirect("/dispatch");
  if (role === "driver") redirect("/driver");

  // No role assigned yet (edge case: user exists in DB without a role)
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <h1 className="text-2xl font-bold">Account Pending</h1>
      <p className="text-muted-foreground max-w-md">
        Your account has been created but no role has been assigned yet.
        Please contact your fleet administrator to get access.
      </p>
      <p className="text-sm text-muted-foreground">
        Signed in as <strong>{session.user.email}</strong>
      </p>
    </div>
  );
}
