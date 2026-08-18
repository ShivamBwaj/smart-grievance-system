"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { HudFrame, LiveDot, LogoMark, SeverityBadge } from "@/components/hud";
import { BeforeAfter, StarRating } from "@/components/before-after";
import type { Complaint } from "@/lib/types";
import { categoryLabel, channelLabel, cn, priorityTone, slaLabel, statusLabel, timeAgo } from "@/lib/utils";

function statusStep(status: Complaint["status"]) {
  return { received: 0, queued: 1, assigned: 2, in_progress: 3, resolved: 4, rejected: 4 }[status];
}
const STEPS = ["Received", "Queued", "Assigned", "In progress", "Resolved"];

function TrackInner() {
  const params = useSearchParams();
  const [id, setId] = useState("");
  const [c, setC] = useState<Complaint | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "notfound">("idle");

  const lookup = useCallback(async (tid: string) => {
    const clean = tid.trim().toUpperCase();
    if (!clean) return;
    setState("loading");
    const res = await fetch(`/api/complaints/${clean}`);
    if (!res.ok) {
      setC(null);
      setState("notfound");
      return;
    }
    setC(await res.json());
    setState("idle");
  }, []);

  useEffect(() => {
    const q = params.get("id");
    if (q) {
      setId(q);
      lookup(q);
    }
  }, [params, lookup]);

  async function rate(v: number) {
    if (!c) return;
    const res = await fetch(`/api/complaints/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackRating: v, actor: c.citizenName }),
    });
    if (res.ok) setC(await res.json());
  }

  const tone = c ? priorityTone(c.priority) : "low";
  const step = c ? statusStep(c.status) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header
        className="h-16 flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30"
        style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-accent-soft flex items-center justify-center">
            <LogoMark />
          </div>
          <span className="text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>CivicLens</span>
        </Link>
        <div className="flex items-center gap-4">
          <LiveDot label="TRACK" />
          <Link href="/citizen" className="mono-data hover:text-foreground">File a complaint →</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-5 lg:p-8 space-y-5">
        <div>
          <p className="mono-label">TRACK A GRIEVANCE</p>
          <h1 className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            Where is my complaint?
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Enter the tracking ID from your confirmation, e.g. <span className="mono-data">CL-240817-1102</span>.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); lookup(id); }}
          className="flex gap-2"
        >
          <input
            className="trench-input"
            placeholder="CL-XXXXXX-XXXX"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <button type="submit" className="shrink-0 inline-flex items-center gap-2 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover">
            {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Track
          </button>
        </form>

        {state === "notfound" && (
          <HudFrame className="p-6 text-center">
            <p className="text-[14px] text-muted-foreground">No grievance with that ID. Check the code and try again.</p>
          </HudFrame>
        )}

        {c && (
          <>
            <HudFrame ticks className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono-data">{c.id}</span>
                <SeverityBadge level={tone} />
                <span className="ml-auto mono-data">{slaLabel(c.slaDueAt, c.status)}</span>
              </div>
              <h2 className="mt-2 text-xl leading-snug" style={{ fontFamily: "var(--font-display)" }}>{c.summary}</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {c.department} · {c.ward} · {channelLabel(c.channel)} · filed {timeAgo(c.createdAt)}
              </p>

              {/* progress stepper */}
              <div className="mt-5 flex items-center">
                {STEPS.map((label, i) => {
                  const done = i <= step && c.status !== "rejected";
                  const isResolvedRejected = i === 4 && c.status === "rejected";
                  return (
                    <div key={label} className="flex-1 flex flex-col items-center relative">
                      {i > 0 && (
                        <div className={cn("absolute right-1/2 top-2 h-0.5 w-full -z-0", i <= step ? "bg-accent" : "bg-border")} />
                      )}
                      <div className={cn(
                        "w-4 h-4 rounded-full z-10 border-2",
                        isResolvedRejected ? "bg-critical border-critical" : done ? "bg-accent border-accent" : "bg-surface border-border",
                      )} />
                      <span className={cn("mt-1.5 text-[10px] text-center", done ? "text-foreground" : "text-muted")}>
                        {isResolvedRejected ? "Rejected" : label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </HudFrame>

            {c.resolutionImageDataUrl && (
              <HudFrame className="p-5">
                <p className="mono-label mb-3">RESOLUTION EVIDENCE</p>
                <BeforeAfter before={c.imageDataUrl} after={c.resolutionImageDataUrl} />
              </HudFrame>
            )}

            <HudFrame className="p-5">
              <p className="mono-label">WHY IT WAS CLASSIFIED THIS WAY</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{c.reasoning}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-muted-foreground">
                <span>{categoryLabel(c.category)} · {c.departmentCode}</span>
                <span>{c.languageName}</span>
                <span>{Math.round(c.confidence * 100)}% confidence</span>
                <span>severity {c.severity}/10</span>
              </div>
              {c.impactCount > 1 && (
                <p className="mt-3 text-[13px] text-positive">~{c.impactCount} citizens are on this issue in {c.ward}.</p>
              )}
            </HudFrame>

            <HudFrame className="p-5">
              <p className="mono-label mb-3">TIMELINE</p>
              <ol className="space-y-3">
                {[...c.timeline].reverse().map((ev, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <div>
                      <p className="text-[13px]">{ev.label}</p>
                      <p className="mono-data">{ev.actor} · {timeAgo(ev.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </HudFrame>

            {c.status === "resolved" && (
              <HudFrame active className="p-5 text-center">
                <p className="mono-label">RATE THE RESOLUTION</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {c.feedbackRating ? "Thanks - your feedback trains routing." : "How well was this fixed?"}
                </p>
                <div className="mt-3 flex justify-center">
                  <StarRating value={c.feedbackRating} onRate={rate} size={26} />
                </div>
              </HudFrame>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TrackInner />
    </Suspense>
  );
}
