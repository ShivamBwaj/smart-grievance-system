"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import { HudFrame, SeverityBadge } from "@/components/hud";
import { BeforeAfter } from "@/components/before-after";
import { DEPARTMENTS, departmentFor } from "@/lib/departments";
import type { Category, Complaint, Priority, Status } from "@/lib/types";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/types";
import {
  categoryLabel,
  channelLabel,
  cn,
  priorityTone,
  slaLabel,
  statusLabel,
  timeAgo,
} from "@/lib/utils";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [c, setC] = useState<Complaint | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/complaints/${id}`);
    if (res.ok) setC(await res.json());
  }

  useEffect(() => {
    load();
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, actor: "Duty officer" }),
    });
    if (res.ok) setC(await res.json());
    setSaving(false);
  }

  function onResolutionPhoto(file: File) {
    const reader = new FileReader();
    reader.onload = () =>
      patch({ resolutionImageDataUrl: String(reader.result), status: "resolved" });
    reader.readAsDataURL(file);
  }

  if (!c) {
    return <p className="text-muted">Loading ticket…</p>;
  }

  const tone = priorityTone(c.priority);
  const relatedHint = c.duplicateOf ? `Master issue ${c.duplicateOf}` : null;

  return (
    <div className="space-y-5 max-w-5xl">
      <Link href="/ops/queue" className="mono-data hover:text-foreground">
        ← Queue
      </Link>

      <div className="flex flex-wrap items-start gap-3">
        <div className={cn("severity-bar h-12", `is-${tone}`)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-data">{c.id}</span>
            <SeverityBadge level={tone} />
            {c.isEmergency && <span className="severity-chip is-high">EMERGENCY</span>}
            {c.anonymous && <span className="severity-chip is-med">ANON</span>}
            {c.verifiedByHuman ? (
              <span className="severity-chip is-confirmed">VERIFIED</span>
            ) : (
              <span className="severity-chip is-info">AI DRAFT</span>
            )}
          </div>
          <h1 className="mt-2 text-2xl leading-snug" style={{ fontFamily: "var(--font-display)" }}>
            {c.summary}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {c.ward} · {c.locationLabel} · {channelLabel(c.channel)} · {timeAgo(c.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="space-y-4">
          <HudFrame ticks className="p-5">
            <p className="mono-label">ORIGINAL</p>
            <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">{c.originalText}</p>
            {c.language !== "en" && (
              <>
                <p className="mono-label mt-4">ENGLISH</p>
                <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{c.translatedText}</p>
              </>
            )}
            {c.imageDataUrl && !c.resolutionImageDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageDataUrl} alt="" className="mt-4 max-h-64 rounded-lg border border-border" />
            )}
            {c.resolutionImageDataUrl && (
              <div className="mt-4">
                <BeforeAfter before={c.imageDataUrl} after={c.resolutionImageDataUrl} />
              </div>
            )}
          </HudFrame>

          <HudFrame className="p-5">
            <p className="mono-label">WHY THE MODEL SAID THIS</p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{c.reasoning}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
              <span>{c.languageName}</span>
              <span>{Math.round(c.confidence * 100)}% confidence</span>
              <span>sentiment {c.sentiment}</span>
              <span>severity {c.severity}/10</span>
            </div>
            {c.confidence < 0.7 && (
              <p className="mt-3 text-[13px] text-medium">
                Confidence under 70%. Confirm or override before a crew rolls.
              </p>
            )}
          </HudFrame>

          <HudFrame className="p-5">
            <p className="mono-label mb-3">TIMELINE</p>
            <ol className="space-y-3">
              {[...c.timeline].reverse().map((ev, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[13px] text-foreground">{ev.label}</p>
                    <p className="mono-data">
                      {ev.actor} · {timeAgo(ev.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </HudFrame>
        </div>

        <div className="space-y-4">
          <HudFrame active className="p-5 space-y-3">
            <p className="mono-label">HUMAN IN THE LOOP</p>
            <label className="block text-[12px] text-muted-foreground">
              Department
              <select
                className="trench-input mt-1"
                value={c.category}
                onChange={(e) => patch({ category: e.target.value as Category })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {departmentFor(cat).name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] text-muted-foreground">
              Priority
              <select
                className="trench-input mt-1"
                value={c.priority}
                onChange={(e) => patch({ priority: e.target.value as Priority })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] text-muted-foreground">
              Status
              <select
                className="trench-input mt-1"
                value={c.status}
                onChange={(e) => patch({ status: e.target.value as Status })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] text-muted-foreground">
              Officer
              <select
                className="trench-input mt-1"
                value={c.officer || ""}
                onChange={(e) => patch({ officer: e.target.value })}
              >
                <option value="">Unassigned</option>
                {Object.values(DEPARTMENTS)
                  .flatMap((d) => d.officers)
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
              </select>
            </label>
            <button
              disabled={saving || c.verifiedByHuman}
              onClick={() => patch({ verifiedByHuman: true })}
              className="w-full py-2.5 rounded-lg bg-accent-soft text-accent-bright text-[13px] font-medium border border-accent/30 disabled:opacity-50"
            >
              {c.verifiedByHuman ? "Classification confirmed" : "Confirm AI classification"}
            </button>
            <label className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-positive-soft text-positive text-[13px] font-medium border border-positive/30 cursor-pointer">
              <Camera size={15} />
              {c.resolutionImageDataUrl ? "Replace resolution photo" : "Upload resolution photo → resolve"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onResolutionPhoto(f);
                }}
              />
            </label>
            <p className="mono-data">
              SLA {slaLabel(c.slaDueAt, c.status)} · {c.impactCount} citizens on this cluster
            </p>
            {relatedHint && <p className="text-[12px] text-info">{relatedHint}</p>}
          </HudFrame>

          <HudFrame className="p-5">
            <p className="mono-label">NOTE TO FILE</p>
            <textarea
              className="trench-input mt-2 min-h-[80px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Crew update, tanker ETA…"
            />
            <button
              disabled={!note.trim() || saving}
              onClick={() => {
                patch({ note });
                setNote("");
              }}
              className="mt-2 px-4 py-2 rounded-lg border border-border text-[13px] hover:bg-white/[0.04]"
            >
              Add note
            </button>
          </HudFrame>

          <HudFrame className="p-5">
            <p className="mono-label">CITIZEN</p>
            <p className="mt-2 text-[14px]">{c.anonymous ? "Anonymous · tracking token only" : c.citizenName}</p>
            {!c.anonymous && c.phone && <p className="mono-data mt-1">{c.phone}</p>}
            <p className="mt-2 text-[12px] text-muted-foreground">{categoryLabel(c.category)} · {c.departmentCode}</p>
          </HudFrame>
        </div>
      </div>
    </div>
  );
}
