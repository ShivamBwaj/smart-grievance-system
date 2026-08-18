"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ROLE_HOME, useAuth, type Role } from "@/lib/auth";

/**
 * Client-side gate for a page. Redirects to /login when signed out, or to the
 * user's own home when their role isn't allowed here.
 */
export function AuthGuard({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = typeof window !== "undefined" ? window.location.pathname : "/";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } else if (!roles.includes(user.role)) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, loading, roles, router]);

  if (loading || !user || !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-accent" size={22} />
      </div>
    );
  }

  return <>{children}</>;
}
