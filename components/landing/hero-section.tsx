"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AuroraBackground } from "./aurora-background";
import { RotatingWords } from "./rotating-words";
import { AlertFeed } from "./alert-feed";

export function HeroSection() {
  return (
    <AuroraBackground className="!bg-background md:overflow-hidden" showRadialGradient={true}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent z-10" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 w-full pt-24 pb-20">
        <div className="grid lg:grid-cols-[1fr_340px] gap-10 lg:gap-14 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(36px,5.5vw,68px)] font-semibold leading-[1.06] tracking-[-0.02em] mb-6"
            >
              <span className="text-foreground/90">Every complaint about</span>
              <br />
              <RotatingWords />
              <br />
              <span
                className="text-foreground/50"
                style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
              >
                reaches the desk that can fix it
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-muted-foreground text-[15px] md:text-base leading-relaxed mb-10 max-w-lg"
            >
              CivicLens reads Hindi, Tamil, English, voice notes, and photos - then
              classifies, scores urgency, and routes the ticket to the department that
              can actually close it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <div id="waitlist" className="flex flex-wrap gap-3" style={{ scrollMarginTop: "120px" }}>
                <Link
                  href="/citizen"
                  className="inline-flex rounded-full px-6 py-3 text-sm font-medium bg-accent text-white hover:bg-accent-hover hover:scale-[1.03] transition-all duration-300"
                >
                  File a complaint
                </Link>
                <Link
                  href="/ops"
                  className="inline-flex rounded-full px-6 py-3 text-sm font-medium border border-white/[0.08] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-300"
                >
                  Open ops console
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted/50">
                Text · Voice · Photo · WhatsApp · GPS · Human override
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="hidden lg:block"
          >
            <AlertFeed />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </AuroraBackground>
  );
}
