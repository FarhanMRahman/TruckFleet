import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/schema";

/**
 * Protected routes that require authentication.
 */
export const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/dispatch",
  "/driver",
  "/profile",
];

/**
 * Checks if the current request is authenticated.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  return session;
}

/**
 * Checks authentication and enforces role access.
 * Redirects to /dashboard (role router) if the user's role is not allowed.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role as UserRole | undefined;

  if (!role || !allowedRoles.includes(role)) {
    redirect("/dashboard");
  }

  return { session, role };
}

/**
 * Gets the current session without requiring authentication.
 * Returns null if not authenticated.
 */
export async function getOptionalSession() {
  return await auth.api.getSession({ headers: await headers() });
}

/**
 * Checks if a given path is a protected route.
 */
export function isProtectedRoute(path: string): boolean {
  return protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}
