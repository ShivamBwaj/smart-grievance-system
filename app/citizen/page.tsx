"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  LogOut,
  MapPin,
  Mic,
  Plus,
  Send,
  Shield,
  Square,
} from "lucide-react";
import { HudFrame, LiveDot, LogoMark } from "@/components/hud";
import { TicketRow } from "@/components/ticket-row";
import { StarRating } from "@/components/before-after";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";
import type { Channel, Complaint } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

type Rec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export default function CitizenPage() {
  return (
    <AuthGuard roles={["citizen", "admin"]}>
      <CitizenPortal />
    </AuthGuard>
  );
}

function CitizenPortal() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const session = { id: user!.id, name: user!.name, phone: user!.phone };
  const [tickets, setTickets] = useState<Complaint[]>([]);
  const [text, setText] = useState("");
  const [channel, setChannel] = useState<Channel>("text");
  const [anonymous, setAnonymous] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState<Complaint | null>(null);
  const recRef = useRef<Rec | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/complaints");
    const data = (await res.json()) as Complaint[];
    setTickets(data);
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 12000);
    return () => clearInterval(t);
  }, [refresh]);

  const mine = useMemo(
    () => tickets.filter((c) => c.citizenId === session.id || (session.id === "c-meena" && c.citizenName === "Meena Sharma")),
    [tickets, session.id],
  );
  const open = mine.filter((c) => c.status !== "resolved" && c.status !== "rejected");
  const done = mine.filter((c) => c.status === "resolved" || c.status === "rejected");
  const nearby = tickets.filter((c) => !c.duplicateOf && c.status !== "resolved").slice(0, 5);
  const meTooTotal = mine.reduce((s, c) => s + c.upvotes, 0);

  function onLogout() {
    logout();
    router.replace("/login");
  }

  function captureGps() {
    if (!navigator.geolocation) {
      setError("Geolocation not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationLabel((l) => l || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => setError("Could not read GPS. Type a landmark instead."),
    );
  }

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
      setChannel("image");
    };
    reader.readAsDataURL(file);
  }

  function toggleVoice() {
    const w = window as unknown as {
      SpeechRecognition?: new () => Rec;
      webkitSpeechRecognition?: new () => Rec;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError("Voice needs Chrome/Edge. Type instead — same pipeline.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const said = Array.from(e.results as ArrayLike<ArrayLike<{ transcript: string }>>)
        .map((r) => r[0].transcript)
        .join(" ");
      setText(said);
      setChannel("voice");
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function submit() {
    setError("");
    if (!text.trim() && !imageDataUrl) {
      setError("Write the issue, or attach a photo.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizenId: session.id,
          citizenName: session.name,
          phone: session.phone,
          anonymous,
          channel,
          originalText: text,
          imageDataUrl,
          lat,
          lng,
          locationLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setFlash(data as Complaint);
      setText("");
      setImageDataUrl(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to file");
    } finally {
      setBusy(false);
    }
  }

  async function meToo(id: string) {
    await fetch(`/api/complaints/${id}/upvote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: session.id }),
    });
    await refresh();
  }

  async function rate(id: string, v: number) {
    await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackRating: v, actor: session.name }),
    });
    await refresh();
  }

  // Notifications: officer/AI/system updates across the citizen's own tickets, newest first.
  const notifications = useMemo(() => {
    const items = mine.flatMap((c) =>
      c.timeline
        .filter((ev) => ev.kind !== "citizen")
        .map((ev) => ({ ...ev, ticket: c.id, summary: c.summary })),
    );
    return items.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 6);
  }, [mine]);

  return (
    <div className="min-h-screen bg-background">
      <header
        className="h-16 flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30"
        style={{
          background: "rgba(10,10,11,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-accent-soft flex items-center justify-center">
            <LogoMark />
          </div>
          <span className="text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            CivicLens
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <LiveDot label="INTAKE" />
          <Link href="/track" className="mono-data hover:text-foreground">
            Track by ID
          </Link>
          {user!.role === "admin" && (
            <Link href="/ops" className="mono-data hover:text-foreground">
              Ops console →
            </Link>
          )}
          <span className="hidden sm:inline mono-data text-muted-foreground">{user!.name}</span>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 mono-data hover:text-foreground"
            title="Sign out"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto p-5 lg:p-8 space-y-6">
        {/* KPI row — turns the page into a dashboard and uses the full width */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["Open", open.length, "In progress with the city"],
            ["Resolved", done.length, "Closed and rated"],
            ["Reports filed", mine.length, "Across all channels"],
            ["Neighbours backing you", meTooTotal, "Me Too on your issues"],
          ].map(([k, v, s]) => (
            <HudFrame key={String(k)} className="p-4">
              <p className="mono-label--muted">{String(k)}</p>
              <p className="mt-2 text-3xl font-semibold tabular">{v}</p>
              <p className="mt-1 text-[12.5px] text-muted">{s}</p>
            </HudFrame>
          ))}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] gap-6 items-start">
        {/* LEFT — compose */}
        <HudFrame ticks className="p-5 lg:p-6">
          <p className="mono-label">FILE A GRIEVANCE</p>
          <h2 className="mt-2 text-xl" style={{ fontFamily: "var(--font-display)" }}>
            Tell the city what broke.
          </h2>
          <p className="mt-1.5 text-[14px] text-muted-foreground leading-relaxed">
            Type it, speak it, or attach a photo in Hindi, Tamil, or English. One AI pass
            classifies, scores urgency, and routes it to the right department.
          </p>

          <p className="mono-label--muted mt-5 mb-2">TRY AN EXAMPLE</p>
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: "Hindi · water",
                ch: "text" as Channel,
                loc: "Arera Colony E-7",
                body: "तीन दिन से वार्ड 18 अरेरा कॉलोनी में पानी बिल्कुल नहीं आ रहा है। टैंकर भी नहीं भेजा।",
              },
              {
                label: "Pothole · MP Nagar",
                ch: "whatsapp" as Channel,
                loc: "MP Nagar Zone 2, near DB Mall",
                body: "Same pothole near DB Mall MP Nagar, even worse after rain. Cars swerving into the other lane.",
              },
              {
                label: "Tamil · manhole",
                ch: "text" as Channel,
                loc: "Habibganj station approach",
                body: "ஹபிப்கஞ்ச் ரயில் நிலையம் அருகில் திறந்த மான்கோல். குழந்தைகள் விளையாடும் இடம். உடனே மூடவும்.",
              },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  setText(s.body);
                  setChannel(s.ch);
                  setLocationLabel(s.loc);
                }}
                className="px-2.5 py-1 rounded-md border border-border text-[11px] text-muted hover:text-foreground"
              >
                {s.label}
              </button>
            ))}
          </div>

          <textarea
            className="trench-input mt-3 min-h-[160px] resize-y text-base"
            placeholder="e.g. तीन दिन से पानी नहीं आ रहा / pothole near DB Mall / open manhole..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={toggleVoice}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px]",
                listening
                  ? "border-critical text-critical bg-critical-soft"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {listening ? <Square size={14} /> : <Mic size={14} />}
              {listening ? "Stop" : "Voice"}
            </button>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-[13px] text-muted-foreground hover:text-foreground cursor-pointer">
              <ImagePlus size={14} />
              Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
            </label>
            <button
              onClick={captureGps}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-[13px] text-muted-foreground hover:text-foreground"
            >
              <MapPin size={14} />
              GPS
            </button>
            <button
              onClick={() => setAnonymous((v) => !v)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px]",
                anonymous
                  ? "border-medium text-medium bg-medium-soft"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <Shield size={14} />
              {anonymous ? "Anonymous on" : "Whistleblower"}
            </button>
          </div>

          {imageDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageDataUrl} alt="Attachment" className="mt-3 max-h-40 rounded-lg border border-border object-cover" />
          )}

          <input
            className="trench-input mt-3"
            placeholder="Landmark / ward (or use GPS)"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
          />
          {lat != null && (
            <p className="mono-data mt-1">
              {lat.toFixed(5)}, {lng?.toFixed(5)}
            </p>
          )}

          {error && <p className="mt-3 text-[13px] text-critical">{error}</p>}

          <button
            onClick={submit}
            disabled={busy}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-accent text-foreground text-sm font-medium hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {busy ? "Reading complaint…" : "Submit to CivicLens"}
          </button>
          <p className="mt-2 mono-data text-center">
            {session.name} · {session.phone}
          </p>
        </HudFrame>

        {/* RIGHT — identity + tickets */}
        <div className="space-y-4">
          <HudFrame className="p-5">
            <p className="mono-label--muted">SIGNED IN AS</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-accent-soft text-accent-bright flex items-center justify-center text-base font-semibold">
                {session.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium truncate">{session.name}</p>
                <p className="text-[12.5px] text-muted-foreground truncate">{session.phone}</p>
              </div>
              <Link
                href="/track"
                className="shrink-0 text-[12.5px] text-accent-bright hover:underline"
              >
                Track by ID →
              </Link>
            </div>
          </HudFrame>

          {flash && (
            <HudFrame active className="p-5">
              <p className="mono-label">TICKET FILED</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[15px] font-medium">{flash.id}</p>
                <Link href={`/track?id=${flash.id}`} className="mono-data text-accent-bright hover:underline">Track →</Link>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{flash.summary}</p>
              <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{flash.reasoning}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span>{flash.department}</span>
                <span>{flash.priority}</span>
                <span>{Math.round(flash.confidence * 100)}% confidence</span>
                {flash.duplicateOf && <span>clustered with {flash.duplicateOf}</span>}
              </div>
              {flash.status === "resolved" ? null : (
                <p className="mt-3 text-[12px] text-positive">
                  {flash.impactCount > 1
                    ? `Your report joined an issue already affecting ~${flash.impactCount} people in ${flash.ward}.`
                    : `Routed to ${flash.department}. SLA ${flash.slaHours}h.`}
                </p>
              )}
            </HudFrame>
          )}

          {notifications.length > 0 && (
            <div>
              <p className="mono-label mb-2 px-1">NOTIFICATIONS</p>
              <HudFrame className="p-4 space-y-2.5">
                {notifications.map((n, i) => (
                  <Link key={i} href={`/track?id=${n.ticket}`} className="flex gap-3 group">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", n.kind === "officer" ? "bg-positive" : n.kind === "ai" ? "bg-accent" : "bg-info")} />
                    <div className="min-w-0">
                      <p className="text-[13px] group-hover:text-foreground">{n.label}</p>
                      <p className="mono-data">{n.ticket} · {timeAgo(n.at)}</p>
                    </div>
                  </Link>
                ))}
              </HudFrame>
            </div>
          )}

          <div>
            <p className="mono-label mb-2 px-1">YOUR OPEN TICKETS</p>
            <div className="space-y-2">
              {open.length === 0 && (
                <p className="text-[13px] text-muted px-1">Nothing open. File on the left.</p>
              )}
              {open.map((c) => (
                <TicketRow key={c.id} c={c} href={`/track?id=${c.id}`} />
              ))}
            </div>
          </div>

          <div>
            <p className="mono-label mb-2 px-1">RESOLVED</p>
            <div className="space-y-2">
              {done.length === 0 && (
                <p className="text-[13px] text-muted px-1">No resolved tickets yet.</p>
              )}
              {done.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-surface p-3">
                  <TicketRow c={c} href={`/track?id=${c.id}`} />
                  <div className="mt-2 flex items-center justify-between gap-2 px-1">
                    <span className="mono-data">{c.feedbackRating ? "You rated this" : "Rate the fix"}</span>
                    <StarRating value={c.feedbackRating} onRate={(v) => rate(c.id, v)} size={16} />
                  </div>
                  {c.impactCount > 1 && (
                    <p className="mono-data px-1 pt-1">
                      Helped an issue affecting ~{c.impactCount} people in this ward.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mono-label mb-2 px-1">NEARBY — BACK AN ISSUE</p>
            <div className="space-y-2">
              {nearby.map((c) => (
                <TicketRow
                  key={c.id}
                  c={c}
                  action={
                    <button
                      onClick={() => meToo(c.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider px-2.5 py-1.5 rounded-md bg-accent-soft text-accent-bright border border-accent/30 hover:bg-accent/20 transition-colors"
                    >
                      <Plus size={12} />
                      Me Too · {c.upvotes}
                    </button>
                  }
                />
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
