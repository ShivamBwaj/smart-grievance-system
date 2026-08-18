"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HudFrame, LiveDot, SeverityBadge } from "@/components/hud";
import { TicketDrawer } from "@/components/ticket-drawer";
import { WARDS } from "@/lib/departments";
import type { AnalyticsPayload, Complaint } from "@/lib/types";
import { categoryLabel, cn } from "@/lib/utils";

const MapPanel = dynamic(() => import("@/components/map-panel").then((m) => m.MapPanel), {
  ssr: false,
  loading: () => <div className="h-[460px] rounded-lg border border-border bg-surface-sunken animate-pulse" />,
});

export default function HotspotsPage() {
  const [stats, setStats] = useState<AnalyticsPayload | null>(null);
  const [rows, setRows] = useState<Complaint[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([fetch("/api/analytics"), fetch("/api/complaints")]);
    setStats(await a.json());
    setRows(await b.json());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const open = useMemo(
    () => rows.filter((r) => !r.duplicateOf && r.status !== "resolved" && r.status !== "rejected"),
    [rows],
  );
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const max = Math.max(1, ...(stats?.hotspots.map((h) => h.count) ?? [1]));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mono-label">GEOSPATIAL</p>
          <h1 className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            Live incident map.
          </h1>
        </div>
        <LiveDot label="LIVE · 5s" />
      </div>

      <HudFrame className="p-3">
        <MapPanel complaints={open} selectedId={selectedId} onSelect={setSelectedId} />
        <div className="mt-3 flex flex-wrap items-center gap-4 px-1">
          <span className="mono-data">{open.length} open incidents · tap a dot to act</span>
          <span className="ml-auto flex items-center gap-3 mono-data">
            <Dot c="#fb7185" /> urgent
            <Dot c="#e08a52" /> high
            <Dot c="#fbbf24" /> medium
            <Dot c="#8a8a8a" /> low
          </span>
        </div>
      </HudFrame>

      <div>
        <p className="mono-label mb-3">WARD HEAT</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WARDS.map((ward) => {
            const hit = stats?.hotspots.find((h) => h.ward === ward);
            const n = hit?.count ?? 0;
            const ratio = n / max;
            return (
              <HudFrame key={ward} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium">{ward}</p>
                  {hit && hit.urgent > 0 && <SeverityBadge level="high" />}
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", ratio >= 0.6 ? "bg-critical" : ratio >= 0.3 ? "bg-medium" : "bg-positive")}
                    style={{ width: `${Math.max(6, ratio * 100)}%` }}
                  />
                </div>
                <p className="mono-data mt-2">{n} open · {hit ? categoryLabel(hit.topCategory) : "quiet"}</p>
              </HudFrame>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mono-label mb-3">CLUSTERS · ONE ISSUE, MANY CITIZENS</p>
        <div className="space-y-2">
          {stats?.clusters.map((cl) => (
            <button key={cl.id} onClick={() => setSelectedId(cl.id)} className="w-full text-left">
              <HudFrame className="p-4 flex items-center gap-4 hover:border-border-strong">
                <div className="text-2xl font-semibold tabular w-12 text-accent-bright">{cl.count}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] line-clamp-1">{cl.title}</p>
                  <p className="mono-data mt-0.5">{cl.ward} · {categoryLabel(cl.category)} · {cl.status}</p>
                </div>
              </HudFrame>
            </button>
          ))}
        </div>
      </div>

      <p className="mono-data">
        Prefer a table? <Link href="/ops/queue" className="text-accent-bright hover:underline">Open the queue →</Link>
      </p>

      <TicketDrawer complaint={selected} onClose={() => setSelectedId(null)} onChanged={(u) => setRows((rs) => rs.map((r) => (r.id === u.id ? u : r)))} />
    </div>
  );
}

function Dot({ c }: { c: string }) {
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: c }} />;
}
