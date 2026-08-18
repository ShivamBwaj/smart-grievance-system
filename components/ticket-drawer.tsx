"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpCircle, ExternalLink, User, X } from "lucide-react";
import { SeverityBadge } from "@/components/hud";
import { BeforeAfter } from "@/components/before-after";
import { DEPARTMENTS } from "@/lib/departments";
import type { Complaint, Status } from "@/lib/types";
import { PRIORITIES, STATUSES } from "@/lib/types";
import { categoryLabel, cn, priorityTone, slaLabel, statusLabel, timeAgo } from "@/lib/utils";

const OFFICERS = Object.values(DEPARTMENTS)
  .flatMap((d) => d.officers)
  .filter((v, i, a) => a.indexOf(v) === i);

export function TicketDrawer({
  complaint,
  onClose,
  onChanged,
}: {
  complaint: Complaint | null;
  onClose: () => void;
  onChanged: (updated: Complaint) => void;
}) {
  const [saving, setSaving] = useState(false);
  if (!complaint) return null;
  const c = complaint;
  const tone = priorityTone(c.priority);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/complaints/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, actor: "Duty officer" }),
    });
    if (res.ok) onChanged(await res.json());
    setSaving(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-screen w-full sm:w-[380px] z-50 bg-surface border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-surface/95 backdrop-blur border-b border-border px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="mono-data">{c.id}</span>
            <SeverityBadge level={tone} />
          </div>
          <button onClick={onClose} className="p-1.5 text-muted hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-lg leading-snug" style={{ fontFamily: "var(--font-display)" }}>{c.summary}</h3>
            <p className="mt-1 mono-data">
              {c.department} · {c.ward} · {slaLabel(c.slaDueAt, c.status)}
            </p>
          </div>

          {/* reporter */}
          <div className="rounded-lg border border-border bg-surface-sunken p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent-soft text-accent-bright grid place-items-center shrink-0">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium">{c.anonymous ? "Anonymous whistleblower" : c.citizenName}</p>
              <p className="mono-data">{c.anonymous ? "identity protected" : c.phone ?? "no phone"} · via {c.channel}</p>
            </div>
            <span className="ml-auto text-[24px] font-semibold tabular text-accent-bright">{c.impactCount}</span>
          </div>

          {/* evidence */}
          {c.resolutionImageDataUrl ? (
            <BeforeAfter before={c.imageDataUrl} after={c.resolutionImageDataUrl} />
          ) : c.imageDataUrl ? (
            <div>
              <p className="mono-data mb-1.5">EVIDENCE</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.imageDataUrl} alt="Evidence" className="w-full max-h-52 object-cover rounded-lg border border-border" />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-center mono-data">No photo attached</div>
          )}

          <div>
            <p className="mono-data mb-1.5">ORIGINAL</p>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{c.originalText}</p>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="mono-data mb-1">WHY THIS CLASSIFICATION</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{c.reasoning}</p>
            <p className="mono-data mt-2">{categoryLabel(c.category)} · {Math.round(c.confidence * 100)}% · sev {c.severity}/10</p>
          </div>

          {/* escalate */}
          <button
            disabled={saving || c.priority === "urgent"}
            onClick={() => patch({ priority: "urgent", note: "Escalated to urgent by duty officer" })}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-critical-soft text-critical border border-critical/30 text-[13px] font-medium disabled:opacity-50"
          >
            <ArrowUpCircle size={15} />
            {c.priority === "urgent" ? "Already urgent" : "Escalate to urgent"}
          </button>

          {/* move status */}
          <div>
            <p className="mono-data mb-1.5">MOVE TO</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={saving || s === c.status}
                  onClick={() => patch({ status: s as Status })}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-[12px] border transition-colors",
                    s === c.status
                      ? "border-accent bg-accent-soft text-accent-bright"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {/* priority + officer */}
          <div className="grid grid-cols-2 gap-2">
            <label className="block mono-data">
              PRIORITY
              <select className="trench-input mt-1" value={c.priority} disabled={saving} onChange={(e) => patch({ priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block mono-data">
              OFFICER
              <select className="trench-input mt-1" value={c.officer ?? ""} disabled={saving} onChange={(e) => patch({ officer: e.target.value })}>
                <option value="">Unassigned</option>
                {OFFICERS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          </div>

          <div>
            <p className="mono-data mb-1.5">RECENT ACTIVITY</p>
            <ol className="space-y-2">
              {[...c.timeline].reverse().slice(0, 4).map((ev, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[12px]">{ev.label}</p>
                    <p className="mono-data">{ev.actor} · {timeAgo(ev.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Link
            href={`/ops/queue/${c.id}`}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-[13px] hover:bg-white/[0.04]"
          >
            <ExternalLink size={14} /> Open full ticket
          </Link>
        </div>
      </aside>
    </>
  );
}
