"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  FilePlus2,
  ImagePlus,
  LayoutGrid,
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
    <AuthGuard roles={["citizen", "supervisor"]}>
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
  const [view, setView] = useState<"file" | "activity">("file");
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

  // The demo citizen also sees grievances that arrived over WhatsApp, so filing
  // from WhatsApp visibly lands in this portal.
  const isDemoCitizen = session.id === "c-meena";
  const mine = useMemo(
    () =>
      tickets.filter(
        (c) =>
          c.citizenId === session.id ||
          (isDemoCitizen && c.citizenName === "Meena Sharma") ||
          (isDemoCitizen && String(c.citizenId).startsWith("wa-")),
      ),
    [tickets, session.id, isDemoCitizen],
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
      setError("Voice needs Chrome/Edge. Type instead - same pipeline.");
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
          {user!.role === "supervisor" && (
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

      {/* Tab bar - File is the main event; everything else lives under My activity */}
      <div
        className="sticky top-16 z-20 px-5 lg:px-8"
        style={{ background: "rgba(10,10,11,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-[1200px] mx-auto flex items-center gap-1 h-12">
          {([
            ["file", "File a grievance", FilePlus2, 0],
            ["activity", "My activity", LayoutGrid, open.length],
          ] as const).map(([key, label, Icon, badge]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                "relative inline-flex items-center gap-2 px-4 h-full text-[13.5px] font-medium transition-colors",
                view === key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={15} />
              {label}
              {badge > 0 && (
                <span className="ml-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-soft text-accent-bright">
                  {badge}
                </span>
              )}
              {view === key && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-accent" />}
            </button>
          ))}
          <div className="ml-auto">
            <button
              onClick={() => setView("activity")}
              title="Notifications"
              className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
            >
              <Bell size={16} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent border border-background" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============================ FILE TAB ============================ */}
      {view === "file" && (
      <div className="max-w-[1180px] mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-8 lg:gap-14 items-start">
          {/* LEFT - the form owns the page */}
          <div>
            <p className="mono-label">FILE A GRIEVANCE</p>
            <h1
              className="mt-3 text-3xl lg:text-[44px] leading-[1.05] tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Tell the city what broke.
            </h1>
            <p className="mt-3 text-[15px] lg:text-base text-muted-foreground leading-relaxed max-w-xl">
              Type it, speak it, or snap a photo in Tamil, Hindi, or English. One AI pass classifies
              it, scores the urgency, and routes it to the GCC department that can actually fix it.
            </p>

            <textarea
              autoFocus
              className="trench-input mt-7 w-full min-h-[300px] lg:min-h-[360px] resize-y text-lg leading-relaxed"
              style={{ padding: "1.2rem 1.25rem" }}
              placeholder="Describe the issue in your own words…

e.g. Pothole outside Marina Mall, T. Nagar — two bikes skidded this morning, please fix before someone gets hurt."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={toggleVoice}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[14px]",
                  listening
                    ? "border-critical text-critical bg-critical-soft"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {listening ? <Square size={15} /> : <Mic size={15} />}
                {listening ? "Stop" : "Voice"}
              </button>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-[14px] text-muted-foreground hover:text-foreground cursor-pointer">
                <ImagePlus size={15} />
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-[14px] text-muted-foreground hover:text-foreground"
              >
                <MapPin size={15} />
                GPS
              </button>
              <button
                onClick={() => setAnonymous((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[14px]",
                  anonymous
                    ? "border-medium text-medium bg-medium-soft"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <Shield size={15} />
                {anonymous ? "Anonymous on" : "Whistleblower"}
              </button>
            </div>

            {imageDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageDataUrl}
                alt="Attachment"
                className="mt-4 max-h-56 rounded-xl border border-border object-cover"
              />
            )}

            <input
              className="trench-input mt-4 text-base"
              placeholder="Landmark / ward (or tap GPS)"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
            />
            {lat != null && (
              <p className="mono-data mt-1.5">
                {lat.toFixed(5)}, {lng?.toFixed(5)}
              </p>
            )}

            {error && <p className="mt-3 text-[14px] text-critical">{error}</p>}

            <button
              onClick={submit}
              disabled={busy}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-accent text-foreground text-[15px] font-medium hover:bg-accent-hover disabled:opacity-60"
            >
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              {busy ? "Reading your complaint…" : "Submit to CivicLens"}
            </button>
            <p className="mt-2.5 mono-data text-center">
              Filing as {session.name} · {session.phone}
            </p>
          </div>

          {/* RIGHT - examples, the pipeline explainer, and the filed confirmation */}
          <div className="space-y-4 lg:sticky lg:top-32">
            <HudFrame className="p-5">
              <p className="mono-label--muted mb-3">TRY AN EXAMPLE</p>
              <div className="space-y-2">
                {[
                  {
                    label: "English · live wire",
                    ch: "text" as Channel,
                    loc: "Besant Nagar bus depot",
                    body: "Electric pole near Besant Nagar bus depot is sparking and the wires are hanging low over the footpath. Someone is going to get electrocuted, please send a crew urgently.",
                  },
                  {
                    label: "Tamil · sewage overflow",
                    ch: "text" as Channel,
                    loc: "KK Nagar 5th Street",
                    body: "கே.கே. நகர் 5வது தெருவில் கழிவுநீர் சாலையில் வழிந்தோடுகிறது. கடும் நாற்றம், கொசுத்தொல்லை அதிகம். உடனே சரிசெய்யவும்.",
                  },
                  {
                    label: "Hindi · potholes",
                    ch: "whatsapp" as Channel,
                    loc: "Anna Nagar 2nd Avenue",
                    body: "अन्ना नगर सेकंड एवेन्यू में सड़क पर बड़े-बड़े गड्ढे हो गए हैं। रोज़ स्कूटर वाले गिर रहे हैं, कृपया जल्दी ठीक करवाएं।",
                  },
                  {
                    label: "English · no water",
                    ch: "text" as Channel,
                    loc: "Ashok Nagar 11th Avenue",
                    body: "No water supply in Ashok Nagar 11th Avenue for the last two days. The area borewell motor has also failed and elderly residents are struggling.",
                  },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => {
                      setText(s.body);
                      setChannel(s.ch);
                      setLocationLabel(s.loc);
                    }}
                    className="w-full text-left rounded-lg border border-border px-3 py-2.5 hover:border-border-strong hover:bg-white/[0.02] transition-colors"
                  >
                    <p className="text-[13px] font-medium text-foreground">{s.label}</p>
                    <p className="mt-0.5 text-[12px] text-muted line-clamp-1">{s.body}</p>
                  </button>
                ))}
              </div>
            </HudFrame>

            <HudFrame className="p-5">
              <p className="mono-label--muted mb-3">WHAT HAPPENS NEXT</p>
              <ol className="space-y-3">
                {[
                  ["Reads & translates", "Any language in, plain-English summary out."],
                  ["Scores & routes", "Urgency + severity, sent to the right GCC department with an SLA clock."],
                  ["Track & rally", "You get a tracking ID; neighbours pile on with Me Too."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-accent-soft text-accent-bright text-[12px] font-semibold grid place-items-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[13.5px] font-medium">{t}</p>
                      <p className="text-[12.5px] text-muted-foreground leading-relaxed">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </HudFrame>

            {flash && (
              <HudFrame active className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="mono-label">TICKET FILED</p>
                  <button onClick={() => setView("activity")} className="mono-data text-accent-bright hover:underline">
                    See in My activity →
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[15px] font-medium">{flash.id}</p>
                  <Link href={`/track?id=${flash.id}`} className="mono-data text-accent-bright hover:underline">Track →</Link>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">{flash.summary}</p>
                <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed">{flash.reasoning}</p>
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
          </div>
        </div>
      </div>
      )}

      {/* ============================ ACTIVITY TAB ============================ */}
      {view === "activity" && (
      <div className="max-w-[1200px] mx-auto p-5 lg:p-8 space-y-6">
        {/* KPI tiles */}
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

        {/* Two columns: your tickets on the left, updates + nearby on the right */}
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <section>
              <p className="mono-label mb-2 px-1">YOUR OPEN TICKETS</p>
              <div className="space-y-2">
                {open.length === 0 && (
                  <p className="text-[13px] text-muted px-1">Nothing open. File a grievance to get started.</p>
                )}
                {open.map((c) => (
                  <TicketRow key={c.id} c={c} href={`/track?id=${c.id}`} />
                ))}
              </div>
            </section>

            <section>
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
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <p className="mono-label mb-2 px-1">NOTIFICATIONS</p>
              {notifications.length === 0 ? (
                <p className="text-[13px] text-muted px-1">No updates yet.</p>
              ) : (
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
              )}
            </section>

            <section>
              <p className="mono-label mb-2 px-1">NEARBY - BACK AN ISSUE</p>
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
            </section>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
