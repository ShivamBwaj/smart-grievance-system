"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Droplets,
  Filter,
  ImagePlus,
  Languages,
  Mic,
  Zap,
} from "lucide-react";

const channels = [
  { icon: Languages, title: "Multilingual NLP", detail: "Tamil, Hindi, English or code-mixed - auto-detected, translated, and classified in a single pass." },
  { icon: Mic, title: "Voice complaints", detail: "Speak it in the browser. Speech-to-text feeds the exact same NLP pipeline as typed text." },
  { icon: ImagePlus, title: "Computer vision intake", detail: "Pothole, garbage pile, sparking transformer - vision reads the scene when words fall short." },
  { icon: Droplets, title: "WhatsApp + geotag", detail: "File straight from chat; GPS tags the ward so geospatial routing hits the right desk." },
];

export function ChannelsSection() {
  return (
    <section id="channels" className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">
            Omnichannel intake
          </p>
          <h2 className="text-[clamp(26px,3.5vw,42px)] font-semibold leading-tight tracking-tight">
            How citizens actually
            <br />
            <span className="text-muted-foreground" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
              report a broken city
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((ch, i) => (
            <motion.div
              key={ch.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="liquid-glass rounded-2xl p-6 lg:p-7 group hover:border-accent/20 transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                  <ch.icon className="w-[18px] h-[18px] text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{ch.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ch.detail}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how" className="py-20 lg:py-28 border-y border-border relative">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/50 to-background pointer-events-none" />

      <div className="relative max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">
            How it works
          </p>
          <h2 className="text-[clamp(26px,3.5vw,42px)] font-semibold leading-tight tracking-tight">
            One message in.{" "}
            <span className="text-muted-foreground" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
              A routed, scored ticket out.
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative">
          {[
            { icon: Zap, num: "01", title: "Citizen files", body: "Text, voice, photo, or WhatsApp. GPS optional. Anonymous when it has to be." },
            { icon: Filter, num: "02", title: "AI understands it", body: "Language detection, translation, sentiment analysis, multi-class department routing, severity scoring, and semantic de-duplication - in one pass." },
            { icon: Bell, num: "03", title: "Ops routes and closes", body: "Human-in-the-loop override, officer assignment, live SLA clock. Citizens track status; clusters show how many people are on the same pothole." },
          ].map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <div className="w-14 h-14 rounded-full liquid-glass flex items-center justify-center mb-6 relative z-10">
                <step.icon className="w-5 h-5 text-accent" />
              </div>
              <span className="text-[11px] font-bold text-accent/60 uppercase tracking-widest mb-2 block">
                {step.num}
              </span>
              <h3 className="text-sm font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProblemSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="liquid-glass-strong rounded-3xl p-8 md:p-14 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 blur-[80px]" />

          <div className="relative grid md:grid-cols-[1fr,auto] gap-8 items-center">
            <div>
              <AlertTriangle className="w-5 h-5 text-amber-400 mb-5" />
              <h2 className="text-[clamp(22px,3vw,30px)] font-semibold leading-snug mb-4 tracking-tight">
                Municipal desks drown in unstructured complaints -{" "}
                <span className="text-muted-foreground" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                  and half of them land on the wrong department.
                </span>
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                Hindi voice notes, Tamil text, WhatsApp photos of the same pothole.
                CivicLens reads all of it, clusters duplicates, and puts the ticket on
                the desk that can actually close it.
              </p>
            </div>
            <div className="hidden md:flex flex-col gap-2.5">
              {[
                { label: "Daily complaints", count: "thousands" },
                { label: "Misroutes", count: "manual, slow" },
                { label: "Languages", count: "hi / ta / en" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-8 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-border min-w-[220px]"
                >
                  <span className="text-xs text-muted">{item.label}</span>
                  <span className="text-xs font-semibold text-foreground/70">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(194,112,62,0.1) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-[clamp(24px,4.5vw,48px)] font-semibold leading-[1.15] max-w-2xl mx-auto mb-5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          The complaint is already late.
          <br />
          The routing doesn&apos;t have to be.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-sm text-muted-foreground max-w-md mx-auto mb-8"
        >
          File one ticket. Watch it classify, cluster, and land on a GCC desk.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/citizen"
              className="inline-flex rounded-full px-6 py-3 text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-all duration-300"
            >
              File a complaint
            </Link>
            <Link
              href="/ops"
              className="inline-flex rounded-full px-6 py-3 text-sm font-medium border border-white/[0.08] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all"
            >
              Open ops console
            </Link>
          </div>
          <p className="text-xs text-muted">Greater Chennai Corporation · demo data included</p>
        </motion.div>
      </div>
    </section>
  );
}
