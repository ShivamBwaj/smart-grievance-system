"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, Languages, Route, ShieldAlert } from "lucide-react";

const SAMPLE = "तीन दिन से पानी नहीं आ रहा है अड्यार";

const results = [
  { icon: Languages, color: "text-blue-400", bg: "bg-blue-400/10", text: "Language: Hindi detected → auto-translated to English" },
  { icon: Route, color: "text-amber-400", bg: "bg-amber-400/10", text: "NLP classify: Water · Metro Water / WTR · Ward 18 Adyar" },
  { icon: ShieldAlert, color: "text-rose-400", bg: "bg-rose-400/10", text: "Sentiment: distress · Priority URGENT · SLA 4h · 96% confidence" },
  { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", text: "Routed to A. Khan · tanker desk auto-notified" },
];

export function DashboardPreview() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setTyped(SAMPLE);
      setShown(results.length);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(SAMPLE.slice(0, i));
      if (i >= SAMPLE.length) {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [inView]);

  useEffect(() => {
    if (typed !== SAMPLE) return;
    let n = 0;
    const t = setInterval(() => {
      n++;
      setShown(n);
      if (n >= results.length) clearInterval(t);
    }, 420);
    return () => clearInterval(t);
  }, [typed]);

  return (
    <section id="demo" ref={sectionRef} className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">See it work</p>
          <h2 className="text-[clamp(26px,3.5vw,42px)] font-semibold leading-tight tracking-tight">
            Drop a complaint.
            <br />
            <span className="text-muted-foreground" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
              Watch the desk assignment land.
            </span>
          </h2>
        </motion.div>

        <div className="liquid-glass rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-accent/70" />
            <span className="ml-3 text-[11px] uppercase tracking-wider text-muted">CivicLens classify · demo</span>
          </div>
          <div className="p-5 md:p-7 grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted mb-2">Citizen input</p>
              <div className="rounded-xl bg-white/[0.03] border border-border px-4 py-3 min-h-[88px] font-mono text-sm">
                {typed}
                {typed !== SAMPLE && <span className="text-accent">|</span>}
              </div>
            </div>
            <div className="space-y-2">
              {results.slice(0, shown).map((r) => (
                <motion.div
                  key={r.text}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-border"
                >
                  <div className={`w-8 h-8 rounded-lg ${r.bg} flex items-center justify-center`}>
                    <r.icon className={`w-3.5 h-3.5 ${r.color}`} />
                  </div>
                  <p className="text-xs text-foreground/80">{r.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
