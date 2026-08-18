"use client";

import { motion } from "framer-motion";
import { Check, Minus, X } from "lucide-react";

type CellValue = true | false | "partial" | string;

const rows: { feature: string; us: CellValue; portal: CellValue; manual: CellValue }[] = [
  { feature: "Multilingual classify", us: true, portal: "partial", manual: false },
  { feature: "Voice + photo intake", us: true, portal: false, manual: false },
  { feature: "Duplicate / Me Too clusters", us: true, portal: false, manual: false },
  { feature: "Priority + SLA clock", us: true, portal: "partial", manual: false },
  { feature: "Human-in-the-loop override", us: true, portal: false, manual: true },
  { feature: "Setup time", us: "Minutes", portal: "Weeks", manual: "Already late" },
  { feature: "Cost to BMC", us: "Demo", portal: "Vendor lock", manual: "Staff hours" },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true) {
    return (
      <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span className="sr-only">Included</span>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto">
        <X className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="sr-only">Not included</span>
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
        <Minus className="w-3.5 h-3.5 text-amber-400/60" />
        <span className="sr-only">Partial</span>
      </div>
    );
  }
  return <span className="text-xs font-medium text-foreground/70">{value}</span>;
}

export function ComparisonSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-3">Compare</p>
          <h2 className="text-[clamp(26px,3.5vw,42px)] font-semibold leading-tight tracking-tight">
            Why not just use{" "}
            <span className="text-muted-foreground" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
              the existing portal?
            </span>
          </h2>
        </motion.div>

        <div className="overflow-x-auto -mx-6 px-6">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-[1fr_120px_120px_120px] md:grid-cols-[1fr_140px_140px_140px] gap-0 mb-1">
              <div />
              <div className="text-center px-3 py-3 rounded-t-xl ring-1 ring-accent/20 bg-accent/[0.03]">
                <span className="text-xs font-bold text-accent">CivicLens</span>
              </div>
              <div className="text-center px-3 py-3">
                <span className="text-xs font-semibold text-muted-foreground">CPGRAMS-style</span>
              </div>
              <div className="text-center px-3 py-3">
                <span className="text-xs font-semibold text-muted-foreground">Manual sort</span>
              </div>
            </div>

            {rows.map((row, i) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="grid grid-cols-[1fr_120px_120px_120px] md:grid-cols-[1fr_140px_140px_140px] gap-0 border-t border-white/[0.06]"
              >
                <div className="flex items-center px-4 py-3.5">
                  <span className="text-sm text-foreground/80">{row.feature}</span>
                </div>
                <div className="flex items-center justify-center px-3 py-3.5 ring-1 ring-accent/20 bg-accent/[0.03]">
                  <CellContent value={row.us} />
                </div>
                <div className="flex items-center justify-center px-3 py-3.5">
                  <CellContent value={row.portal} />
                </div>
                <div className="flex items-center justify-center px-3 py-3.5">
                  <CellContent value={row.manual} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
