"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { LogoMark } from "@/components/hud";
import { DEMO_USERS, ROLE_HOME, useAuth, type Role } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ROLE_CARDS: { role: Role; label: string; blurb: string; icon: typeof UserIcon }[] = [
  { role: "citizen", label: "Citizen", blurb: "File & track grievances", icon: UserIcon },
  { role: "officer", label: "Officer", blurb: "Work an assigned queue", icon: ShieldCheck },
  { role: "admin", label: "Admin", blurb: "City-wide command & audit", icon: Building2 },
];

function LoginInner() {
  const { user, loading, login, signup } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next || ROLE_HOME[user.role]);
  }, [user, loading, next, router]);

  function go(res: { ok: boolean; error?: string; user?: { role: Role } }) {
    setBusy(false);
    if (!res.ok) {
      setError(res.error || "Something went wrong.");
      return;
    }
    router.replace(next || ROLE_HOME[res.user!.role]);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    // Let the spinner paint before the synchronous localStorage work.
    setTimeout(() => {
      if (mode === "signin") go(login(email, password));
      else go(signup({ name, email, phone, password, role }));
    }, 250);
  }

  function quick(demoRole: Role) {
    const acct = DEMO_USERS.find((u) => u.role === demoRole)!;
    setBusy(true);
    setError("");
    setTimeout(() => go(login(acct.email, acct.password)), 200);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* LEFT - brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-border">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(194,112,62,0.16) 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 90% 100%, rgba(194,112,62,0.10) 0%, transparent 50%)",
          }}
        />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent-soft flex items-center justify-center">
              <LogoMark size={16} />
            </div>
            <span className="text-xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              CivicLens
            </span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <p className="mono-label text-accent-bright">Greater Chennai Corporation</p>
          <h1 className="mt-4 text-[clamp(30px,4vw,46px)] leading-[1.1] tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            One console.
            <br />
            <span className="italic text-muted-foreground">Every complaint routed.</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Sign in to file grievances, work an officer queue, or run the city-wide dashboard. AI classifies, scores, and routes - you close the loop.
          </p>

          <div className="mt-8 space-y-2.5">
            {ROLE_CARDS.map((c) => (
              <div key={c.role} className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.02] px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-accent-soft text-accent-bright flex items-center justify-center shrink-0">
                  <c.icon size={16} />
                </div>
                <div>
                  <p className="text-[13px] font-medium">{c.label}</p>
                  <p className="text-[12px] text-muted">{c.blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative mono-data">Demo build · no data leaves this browser</p>
      </div>

      {/* RIGHT - form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent-soft flex items-center justify-center">
              <LogoMark size={16} />
            </div>
            <span className="text-xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              CivicLens
            </span>
          </div>

          <div className="inline-flex p-1 rounded-full border border-border bg-surface-sunken mb-6">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                  mode === m ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <h2 className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {mode === "signin" ? "Welcome back." : "Join CivicLens."}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {mode === "signin" ? "Sign in to continue to your console." : "Citizens file in seconds. Officers need a city email."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <>
                <Field icon={UserIcon} placeholder="Full name" value={name} onChange={setName} />
                <Field icon={Phone} placeholder="Phone (optional)" value={phone} onChange={setPhone} />
              </>
            )}
            <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} />
            <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} />

            {mode === "signup" && (
              <div className="pt-1">
                <p className="mono-data mb-2">REGISTER AS</p>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_CARDS.map((c) => (
                    <button
                      key={c.role}
                      type="button"
                      onClick={() => setRole(c.role)}
                      className={cn(
                        "rounded-lg border px-2 py-2.5 text-center transition-colors",
                        role === c.role
                          ? "border-accent bg-accent-soft text-accent-bright"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <c.icon size={15} className="mx-auto" />
                      <span className="mt-1 block text-[11px] font-medium">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-[13px] text-critical">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-60 transition-colors"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-7">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="mono-data">Or try a demo role</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {ROLE_CARDS.map((c) => (
                <button
                  key={c.role}
                  onClick={() => quick(c.role)}
                  disabled={busy}
                  className="rounded-lg border border-border px-2 py-2.5 text-center hover:border-accent/40 hover:bg-white/[0.03] transition-colors disabled:opacity-60"
                >
                  <c.icon size={15} className="mx-auto text-accent-bright" />
                  <span className="mt-1 block text-[11px] font-medium">{c.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 mono-data text-center">password for all demo accounts: demo123</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: typeof UserIcon;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="trench-input"
        style={{ paddingLeft: "2.25rem" }}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginInner />
    </Suspense>
  );
}
