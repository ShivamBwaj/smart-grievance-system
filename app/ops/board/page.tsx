"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HudFrame, LiveDot } from "@/components/hud";
import { TicketDrawer } from "@/components/ticket-drawer";
import { useAuth } from "@/lib/auth";
import type { Complaint, Status } from "@/lib/types";
import { cn, priorityTone, slaLabel } from "@/lib/utils";

const COLUMNS: { status: Status; label: string }[] = [
  { status: "received", label: "Received" },
  { status: "queued", label: "Queued" },
  { status: "assigned", label: "Assigned" },
  { status: "in_progress", label: "In progress" },
  { status: "resolved", label: "Resolved" },
];

const TONE_BAR: Record<string, string> = {
  high: "bg-critical",
  med: "bg-medium",
  low: "bg-muted",
  info: "bg-info",
};

export default function BoardPage() {
  const { user } = useAuth();
  const isOfficer = user?.role === "officer";
  const [rows, setRows] = useState<Complaint[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);
  const [mineOnly, setMineOnly] = useState(false);

  useEffect(() => setMineOnly(isOfficer), [isOfficer]);

  const load = useCallback(async () => {
    const res = await fetch("/api/complaints");
    setRows(await res.json());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const masters = useMemo(
    () =>
      rows.filter((r) => {
        if (r.duplicateOf) return false;
        if (mineOnly && user?.officerName && r.officer !== user.officerName) return false;
        return true;
      }),
    [rows, mineOnly, user?.officerName],
  );

  async function move(id: string, status: Status) {
    const cur = rows.find((r) => r.id === id);
    if (!cur || cur.status === status) return;
    // optimistic
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const res = await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, actor: user?.name ?? "Duty officer" }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((rs) => rs.map((r) => (r.id === id ? updated : r)));
    }
  }

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mono-label">TICKET BOARD</p>
          <h1 className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            Drag to move a ticket.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {user?.officerName && (
            <div className="inline-flex p-0.5 rounded-lg border border-border bg-surface-sunken">
              {[{ k: true, l: "Mine" }, { k: false, l: "All" }].map((o) => (
                <button
                  key={String(o.k)}
                  onClick={() => setMineOnly(o.k)}
                  className={cn("px-3 py-1.5 rounded-md text-[12px] font-medium", mineOnly === o.k ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground")}
                >
                  {o.l}
                </button>
              ))}
            </div>
          )}
          <LiveDot label="LIVE · 5s" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const items = masters.filter((r) => r.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.status); }}
              onDragLeave={() => setOverCol((c) => (c === col.status ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                if (id) move(id, col.status);
                setOverCol(null);
                setDragId(null);
              }}
              className={cn(
                "rounded-lg border p-2 min-h-[200px] transition-colors",
                overCol === col.status ? "border-accent bg-accent-soft/40" : "border-border bg-surface-sunken",
              )}
            >
              <div className="flex items-center justify-between px-1.5 py-1 mb-1.5">
                <span className="mono-label">{col.label}</span>
                <span className="mono-data">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((c) => {
                  const tone = priorityTone(c.priority);
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", c.id); setDragId(c.id); }}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        "group rounded-md border border-border bg-surface p-2.5 cursor-grab active:cursor-grabbing hover:border-border-strong",
                        dragId === c.id && "opacity-40",
                      )}
                    >
                      <div className="flex items-stretch gap-2">
                        <span className={cn("w-1 rounded-full shrink-0", TONE_BAR[tone])} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="mono-data">{c.id}</span>
                            {c.priority === "urgent" && <span className="severity-chip is-high">URGENT</span>}
                            {c.confidence < 0.7 && !c.verifiedByHuman && <span className="severity-chip is-med">HITL</span>}
                          </div>
                          <p className="text-[12.5px] leading-snug mt-1 line-clamp-2">{c.summary}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            {c.imageDataUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.imageDataUrl} alt="" className="w-7 h-7 rounded object-cover border border-border" />
                            )}
                            <div className="min-w-0">
                              <p className="mono-data truncate">{c.anonymous ? "Anon" : c.citizenName}</p>
                              <p className="mono-data truncate">{c.ward.replace(/^Ward \d+ - /, "")} · {slaLabel(c.slaDueAt, c.status)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <p className="mono-data px-1.5 py-3 text-center opacity-60">-</p>}
              </div>
            </div>
          );
        })}
      </div>

      <TicketDrawer complaint={selected} onClose={() => setSelectedId(null)} onChanged={(u) => setRows((rs) => rs.map((r) => (r.id === u.id ? u : r)))} />
    </div>
  );
}
