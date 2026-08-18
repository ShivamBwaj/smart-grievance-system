"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Lightbulb, MessageSquare, TriangleAlert } from "lucide-react";

const mockAlerts = [
  {
    icon: TriangleAlert,
    bg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    company: "Egmore",
    headline: "Open manhole - Tamil intake, 97%",
    time: "2 min ago",
    severity: "High" as const,
  },
  {
    icon: Droplets,
    bg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    company: "Adyar",
    headline: "No water for 3 days · SLA breached",
    time: "9 min ago",
    severity: "High" as const,
  },
  {
    icon: MessageSquare,
    bg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    company: "T. Nagar",
    headline: "Pothole cluster · 47 Me Toos",
    time: "18 min ago",
    severity: "Medium" as const,
  },
  {
    icon: Lightbulb,
    bg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    company: "Luz Corner",
    headline: "Sparking transformer routed to ELC",
    time: "22 min ago",
    severity: "High" as const,
  },
];

export function AlertFeed() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const interval = setInterval(() => setActiveIdx((i) => (i + 1) % mockAlerts.length), 3400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-sm">
      <div className="liquid-glass rounded-t-2xl px-4 py-2.5 flex items-center justify-between border-b-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
            Live Feed
          </span>
        </div>
        <span className="text-[10px] text-muted">{mockAlerts.length} signals</span>
      </div>

      <div className="flex flex-col gap-0">
        {mockAlerts.map((alert, i) => (
          <motion.div
            key={alert.headline}
            animate={{
              opacity: i === activeIdx ? 1 : 0.4,
              scale: i === activeIdx ? 1 : 0.98,
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`relative p-4 border-t border-white/[0.06] transition-colors duration-500 ${
              i === activeIdx ? "bg-white/[0.06] backdrop-blur-xl" : "bg-white/[0.02]"
            } ${i === mockAlerts.length - 1 ? "rounded-b-2xl" : ""}`}
          >
            {i === activeIdx && (
              <motion.div
                layoutId="active-glow"
                className="absolute inset-0 bg-accent/[0.04] rounded-[inherit] pointer-events-none"
                transition={{ duration: 0.4 }}
              />
            )}
            <div className="relative flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${alert.bg} flex items-center justify-center shrink-0`}>
                <alert.icon className={`w-3.5 h-3.5 ${alert.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold text-foreground">{alert.company}</span>
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      alert.severity === "High"
                        ? "bg-rose-500/15 text-rose-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 leading-snug">{alert.headline}</p>
                <p className="text-[10px] text-muted mt-1">{alert.time}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="absolute inset-0 rounded-2xl border border-white/[0.08] pointer-events-none shadow-[0_8px_40px_rgba(0,0,0,0.4)]" />
    </div>
  );
}
