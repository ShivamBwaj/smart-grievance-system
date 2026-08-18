"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { TicketRow } from "@/components/ticket-row";
import { HudFrame } from "@/components/hud";
import { useAuth } from "@/lib/auth";
import type { Complaint } from "@/lib/types";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/types";
import { categoryLabel, cn, statusLabel } from "@/lib/utils";

export default function QueuePage() {
  const { user } = useAuth();
  const isOfficer = user?.role === "officer";
  const [rows, setRows] = useState<Complaint[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [pri, setPri] = useState<string>("all");
  const [st, setSt] = useState<string>("open");
  // Officers land on their own assignments; admins see the whole city.
  const [mineOnly, setMineOnly] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    return fetch("/api/complaints")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  useEffect(() => {
    setMineOnly(isOfficer);
  }, [isOfficer]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  // Pull grievances people filed over WhatsApp (via Twilio) and file them.
  async function syncWhatsApp() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/whatsapp/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      await load();
      setSyncMsg(
        data.created > 0
          ? `Imported ${data.created} new WhatsApp grievance${data.created === 1 ? "" : "s"} (scanned ${data.scanned}).`
          : `No new WhatsApp messages to import (scanned ${data.scanned}).`,
      );
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : "WhatsApp sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      if (c.duplicateOf) return false;
      if (mineOnly && user?.officerName && c.officer !== user.officerName) return false;
      if (cat !== "all" && c.category !== cat) return false;
      if (pri !== "all" && c.priority !== pri) return false;
      if (st === "open" && (c.status === "resolved" || c.status === "rejected")) return false;
      if (st !== "all" && st !== "open" && c.status !== st) return false;
      if (q.trim()) {
        const hay = `${c.id} ${c.summary} ${c.originalText} ${c.ward} ${c.department}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, q, cat, pri, st, mineOnly, user?.officerName]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="mono-label">COMPLAINT QUEUE</p>
          <h1 className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            {isOfficer && mineOnly ? "Your assignments." : "Filter, sort, override."}
          </h1>
          {user?.officerName && (
            <p className="mt-1 text-[13px] text-muted-foreground">
              Signed in as {user.officerName} · {user.department}
            </p>
          )}
        </div>
        <button
          onClick={syncWhatsApp}
          disabled={syncing}
          title="Pull grievances filed over WhatsApp and add them to the queue"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface text-[13px] font-medium text-muted-foreground hover:border-border-strong hover:text-foreground disabled:opacity-60 transition-colors"
        >
          {syncing ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <MessageCircle size={15} className="text-positive" />
          )}
          {syncing ? "Fetching from WhatsApp…" : "Fetch WhatsApp grievances"}
        </button>
      </div>

      {syncMsg && (
        <div className="rounded-lg border border-border bg-surface-sunken px-4 py-2.5 text-[13px] text-muted-foreground">
          {syncMsg}
        </div>
      )}

      <HudFrame className="p-4 flex flex-wrap gap-2">
        {user?.officerName && (
          <div className="inline-flex p-0.5 rounded-lg border border-border bg-surface-sunken">
            {[
              { key: true, label: "My queue" },
              { key: false, label: "All city" },
            ].map((opt) => (
              <button
                key={String(opt.key)}
                onClick={() => setMineOnly(opt.key)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors",
                  mineOnly === opt.key ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        <input
          className="trench-input max-w-xs"
          placeholder="Search id, ward, text…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="trench-input w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All departments</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
        <select className="trench-input w-auto" value={pri} onChange={(e) => setPri(e.target.value)}>
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select className="trench-input w-auto" value={st} onChange={(e) => setSt(e.target.value)}>
          <option value="open">Open</option>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <span className="mono-data self-center ml-auto">{filtered.length} tickets</span>
      </HudFrame>

      <div className="space-y-2">
        {filtered.map((c) => (
          <TicketRow key={c.id} c={c} href={`/ops/queue/${c.id}`} />
        ))}
        {filtered.length === 0 && (
          <HudFrame className="p-8 text-center">
            <p className="text-[14px] text-muted-foreground">
              {mineOnly ? "Nothing assigned to you under these filters." : "No tickets match these filters."}
            </p>
            {mineOnly && (
              <button onClick={() => setMineOnly(false)} className="mt-2 mono-data text-accent-bright hover:underline">
                View all city tickets →
              </button>
            )}
          </HudFrame>
        )}
      </div>
    </div>
  );
}
