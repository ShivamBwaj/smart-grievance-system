"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  KanbanSquare,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MapPinned,
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { LiveDot, LogoMark } from "@/components/hud";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav: { href: string; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { href: "/ops", label: "Overview", icon: LayoutDashboard, roles: ["supervisor"] },
  { href: "/ops/queue", label: "Queue", icon: ListTodo, roles: ["officer", "supervisor"] },
  { href: "/ops/board", label: "Board", icon: KanbanSquare, roles: ["officer", "supervisor"] },
  { href: "/ops/hotspots", label: "Live map", icon: MapPinned, roles: ["officer", "supervisor"] },
  { href: "/ops/analytics", label: "Analytics", icon: Activity, roles: ["supervisor"] },
];

export function OpsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={["officer", "supervisor"]}>
      <OpsShell>{children}</OpsShell>
    </AuthGuard>
  );
}

function OpsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const role = user?.role ?? "supervisor";
  const items = nav.filter((n) => n.roles.includes(role));

  function onLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-[232px] z-50 flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={{ background: "#141415", borderRight: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="h-16 flex items-center justify-between px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/ops" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-[#c2703e]/10 flex items-center justify-center group-hover:bg-[#c2703e]/20 transition-colors">
              <LogoMark />
            </div>
            <span className="text-[#fafaf9] text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              CivicLens
            </span>
          </Link>
          <button className="lg:hidden p-1.5 text-[#737373]" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-5 px-3 space-y-0.5">
          <div className="flex items-center justify-between px-3 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737373]/70">
              Municipal ops
            </p>
            <LiveDot label="LIVE" />
          </div>
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                  active ? "text-[#c2703e]" : "text-[#737373] hover:text-[#fafaf9]",
                )}
                style={
                  active
                    ? {
                        background: "rgba(194,112,62,0.08)",
                        boxShadow: "inset 0 0 0 1px rgba(194,112,62,0.1), 0 0 20px -8px rgba(194,112,62,0.15)",
                      }
                    : undefined
                }
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[#c2703e]" />
                )}
                <item.icon size={17} strokeWidth={active ? 2 : 1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-3 py-2.5 rounded-lg flex items-center gap-3 bg-white/[0.02]">
            <div className="w-8 h-8 rounded-full bg-[#c2703e]/10 flex items-center justify-center text-[#c2703e] text-xs font-semibold">
              {(user?.name ?? "GCC").slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-[#a3a3a3] truncate">{user?.name ?? "Duty officer"}</p>
              <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-px rounded text-[#c2703e] bg-[#c2703e]/10">
                {role}
              </span>
            </div>
            <button onClick={onLogout} className="p-1.5 rounded-md text-[#737373] hover:text-red-400" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="lg:hidden h-14 flex items-center px-4 gap-3 sticky top-0 z-30"
          style={{
            background: "rgba(20,20,21,0.85)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button onClick={() => setOpen(true)} className="p-2.5 -ml-1 text-[#a3a3a3]">
            <Menu size={20} />
          </button>
          <span className="text-[#fafaf9] text-base" style={{ fontFamily: "var(--font-display)" }}>
            CivicLens
          </span>
        </div>
        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
