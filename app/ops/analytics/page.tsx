"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { HudFrame } from "@/components/hud";
import { StarRating } from "@/components/before-after";
import { useAuth } from "@/lib/auth";
import type { AnalyticsPayload, Complaint } from "@/lib/types";
import { slaLabel } from "@/lib/utils";

const COPPER = ["#c2703e", "#e08a52", "#34d399", "#60a5fa", "#fbbf24", "#fb7185", "#a3a3a3"];

type OfficerRow = {
  officer: string;
  open: number;
  resolved: number;
  avgHours: number | null;
  rating: number | null;
};

function buildScorecard(rows: Complaint[]): OfficerRow[] {
  const map = new Map<string, { open: number; resolved: number; hours: number[]; ratings: number[] }>();
  for (const c of rows) {
    if (!c.officer) continue;
    const cur = map.get(c.officer) ?? { open: 0, resolved: 0, hours: [], ratings: [] };
    if (c.status === "resolved") {
      cur.resolved += 1;
      cur.hours.push((+new Date(c.updatedAt) - +new Date(c.createdAt)) / 36e5);
      if (c.feedbackRating) cur.ratings.push(c.feedbackRating);
    } else if (c.status !== "rejected") {
      cur.open += 1;
    }
    map.set(c.officer, cur);
  }
  return [...map.entries()]
    .map(([officer, v]) => ({
      officer,
      open: v.open,
      resolved: v.resolved,
      avgHours: v.hours.length ? v.hours.reduce((a, b) => a + b, 0) / v.hours.length : null,
      rating: v.ratings.length ? v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length : null,
    }))
    .sort((a, b) => b.resolved - a.resolved || b.open - a.open);
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AnalyticsPayload | null>(null);
  const [rows, setRows] = useState<Complaint[]>([]);

  useEffect(() => {
    if (user && user.role === "officer") router.replace("/ops/queue");
  }, [user, router]);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setStats);
    fetch("/api/complaints").then((r) => r.json()).then(setRows);
  }, []);

  if (!stats) return <p className="text-muted">Loading analytics…</p>;

  const masters = rows.filter((r) => !r.duplicateOf);
  const scorecard = buildScorecard(masters);
  const escalations = masters
    .filter((r) => r.status !== "resolved" && r.status !== "rejected")
    .filter((r) => slaLabel(r.slaDueAt, r.status).startsWith("Overdue") || r.priority === "urgent")
    .sort((a, b) => +new Date(a.slaDueAt) - +new Date(b.slaDueAt))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <p className="mono-label">CIVIC INTELLIGENCE</p>
        <h1 className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          Workload, channels, trends.
        </h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <HudFrame className="p-4">
          <p className="mono-label mb-3">BY DEPARTMENT</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byDepartment} layout="vertical" margin={{ left: 8, right: 8 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#141415",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.byDepartment.map((_, i) => (
                    <Cell key={i} fill={COPPER[i % COPPER.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </HudFrame>

        <HudFrame className="p-4">
          <p className="mono-label mb-3">PRIORITY MIX</p>
          <div className="space-y-3 mt-4">
            {stats.byPriority.map((p) => {
              const max = Math.max(1, ...stats.byPriority.map((x) => x.count));
              return (
                <div key={p.name}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="capitalize text-muted-foreground">{p.name}</span>
                    <span className="tabular">{p.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(p.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mono-label mt-8 mb-3">CHANNELS</p>
          <div className="flex flex-wrap gap-2">
            {stats.byChannel.map((ch) => (
              <span key={ch.name} className="px-3 py-1.5 rounded-md bg-surface-sunken border border-border text-[12px]">
                {ch.name} · {ch.count}
              </span>
            ))}
          </div>
        </HudFrame>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <HudFrame active className="p-5">
          <p className="mono-label mb-3">ESCALATIONS · SLA + URGENT</p>
          <div className="space-y-2">
            {escalations.map((c) => (
              <Link key={c.id} href={`/ops/queue/${c.id}`} className="block rounded-md bg-surface-sunken border border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="mono-data">{c.id}</span>
                  {c.priority === "urgent" && <span className="severity-chip is-high">URGENT</span>}
                  <span className="mono-data ml-auto text-critical">{slaLabel(c.slaDueAt, c.status)}</span>
                </div>
                <p className="text-[13px] mt-0.5 line-clamp-1">{c.summary}</p>
                <p className="mono-data mt-0.5">{c.officer ?? "Unassigned"} · {c.ward}</p>
              </Link>
            ))}
            {escalations.length === 0 && <p className="text-[13px] text-muted">No breaches. SLAs are green.</p>}
          </div>
        </HudFrame>

        <HudFrame className="p-5">
          <p className="mono-label mb-3">OFFICER SCORECARD</p>
          <div className="space-y-1.5">
            <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.8fr_1fr] gap-2 mono-data pb-1 border-b border-border">
              <span>Officer</span><span className="text-right">Open</span><span className="text-right">Done</span><span className="text-right">Avg</span><span className="text-right">Rating</span>
            </div>
            {scorecard.map((o) => (
              <div key={o.officer} className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.8fr_1fr] gap-2 items-center text-[13px] py-1">
                <span className="truncate">{o.officer}</span>
                <span className="text-right tabular">{o.open}</span>
                <span className="text-right tabular text-positive">{o.resolved}</span>
                <span className="text-right tabular text-muted-foreground">{o.avgHours != null ? `${Math.round(o.avgHours)}h` : "-"}</span>
                <span className="flex justify-end">
                  {o.rating != null ? <StarRating value={Math.round(o.rating)} size={12} /> : <span className="mono-data">-</span>}
                </span>
              </div>
            ))}
          </div>
        </HudFrame>
      </div>

      <HudFrame className="p-5">
        <p className="mono-label">READING THE BOARD</p>
        <ul className="mt-3 space-y-2 text-[14px] text-muted-foreground leading-relaxed">
          <li>
            {stats.overdue} tickets are past SLA. Urgent load is {stats.urgent} - those should jump the queue.
          </li>
          <li>
            Average model confidence {Math.round(stats.avgConfidence * 100)}%. Anything under 70% sits in HITL until an
            officer confirms.
          </li>
          <li>
            {stats.clusters[0]
              ? `Largest cluster: “${stats.clusters[0].title}” (${stats.clusters[0].count} citizens, ${stats.clusters[0].ward}).`
              : "No clusters yet."}
          </li>
        </ul>
      </HudFrame>
    </div>
  );
}
