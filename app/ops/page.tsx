"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HudFrame, LiveDot, SeverityBadge } from "@/components/hud";
import { TicketRow } from "@/components/ticket-row";
import { useAuth } from "@/lib/auth";
import type { AnalyticsPayload, Complaint } from "@/lib/types";
import { greeting, slaLabel } from "@/lib/utils";

export default function OpsOverviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<AnalyticsPayload | null>(null);

  // City overview is the admin command view; officers work their queue.
  useEffect(() => {
    if (user && user.role === "officer") router.replace("/ops/queue");
  }, [user, router]);

  async function load() {
    const [a, b] = await Promise.all([fetch("/api/complaints"), fetch("/api/analytics")]);
    setRows(await a.json());
    setStats(await b.json());
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const masters = rows.filter((r) => !r.duplicateOf);
  const alerts = masters
    .filter((r) => r.status !== "resolved" && r.status !== "rejected")
    .filter((r) => r.priority === "urgent" || slaLabel(r.slaDueAt, r.status).startsWith("Overdue") || r.confidence < 0.7)
    .slice(0, 6);
  const feed = masters.slice(0, 7);

  const cards = stats
    ? [
        ["Open", stats.open, "Across all depts"],
        ["Urgent", stats.urgent, "Needs a crew now"],
        ["SLA breach", stats.overdue, "Clock already red"],
        ["AI confidence", `${Math.round(stats.avgConfidence * 100)}%`, "HITL if < 70%"],
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mono-label">BMC OPERATIONS</p>
          <h1 className="mt-1 text-2xl lg:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            {greeting()}, {user?.name?.split(" ")[0] ?? "officer"}.
          </h1>
        </div>
        <LiveDot label="CITY FEED" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(([k, v, s]) => (
          <HudFrame key={String(k)} className="p-4">
            <p className="mono-data">{k}</p>
            <p className="mt-1 text-2xl font-semibold tabular">{v}</p>
            <p className="mt-1 text-[12px] text-muted">{s}</p>
          </HudFrame>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <HudFrame className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="mono-label">7-DAY INTAKE</p>
            <span className="mono-data">filed vs resolved</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.byDay ?? []}>
                <XAxis dataKey="day" stroke="#8a8a8a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8a8a8a" fontSize={11} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    background: "#141415",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="filed" stroke="#c2703e" fill="rgba(194,112,62,0.18)" />
                <Area type="monotone" dataKey="resolved" stroke="#34d399" fill="rgba(52,211,153,0.12)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </HudFrame>

        <HudFrame active className="p-4">
          <p className="mono-label mb-3">ALERTS · HITL + SLA</p>
          <div className="space-y-2">
            {alerts.map((c) => (
              <Link key={c.id} href={`/ops/queue/${c.id}`} className="block rounded-md bg-surface-sunken border border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="mono-data">{c.id}</span>
                  {c.confidence < 0.7 && <SeverityBadge level="med" />}
                  {c.priority === "urgent" && <SeverityBadge level="high" />}
                  <span className="mono-data ml-auto">{slaLabel(c.slaDueAt, c.status)}</span>
                </div>
                <p className="text-[13px] mt-0.5 line-clamp-1">{c.summary}</p>
              </Link>
            ))}
            {alerts.length === 0 && <p className="text-[13px] text-muted">Queue is quiet.</p>}
          </div>
        </HudFrame>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="mono-label">LATEST MASTER ISSUES</p>
          <Link href="/ops/queue" className="mono-data hover:text-foreground">
            Full queue →
          </Link>
        </div>
        <div className="space-y-2">
          {feed.map((c) => (
            <TicketRow key={c.id} c={c} href={`/ops/queue/${c.id}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
