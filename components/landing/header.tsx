"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [mobileOpen]);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none pt-4 px-4"
    >
      <div ref={menuRef} className="pointer-events-auto relative">
        <nav
          className={`flex items-center justify-between gap-6 px-5 h-12 rounded-full transition-all duration-500 ${
            scrolled
              ? "bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.25),0_0_15px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_0_12px_rgba(255,255,255,0.03),0_0_4px_rgba(255,255,255,0.02)]"
          }`}
          style={{ minWidth: "min(680px, calc(100vw - 2rem))" }}
        >
          <Link href="/" className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="24" height="5" rx="1.5" fill="currentColor" />
              <rect x="11" y="11" width="10" height="4" rx="1" fill="currentColor" opacity="0.75" />
              <rect x="12" y="17" width="8" height="4" rx="1" fill="#c2703e" opacity="0.6" />
              <rect x="13" y="23" width="6" height="4" rx="1" fill="#c2703e" />
            </svg>
            <span
              className="text-sm font-semibold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              CivicLens
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1 text-xs">
            <Link
              href="/citizen"
              className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-300"
            >
              File complaint
            </Link>
            <Link
              href="/ops"
              className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-300"
            >
              Ops console
            </Link>
            <a
              href="#how"
              className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-300"
            >
              How it works
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              Log in
            </Link>
            <Link
              href="/login?next=/citizen"
              className="hidden sm:inline-flex rounded-full px-4 py-1.5 text-xs font-medium bg-accent text-white hover:bg-accent-hover hover:scale-[1.03] transition-all duration-300"
            >
              Open intake
            </Link>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              id="mobile-menu"
              role="menu"
              className="sm:hidden absolute top-14 right-0 left-0 mx-2 rounded-2xl bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"
            >
              <div className="flex flex-col py-2">
                <Link href="/citizen" onClick={() => setMobileOpen(false)} className="px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04]">
                  File complaint
                </Link>
                <Link href="/ops" onClick={() => setMobileOpen(false)} className="px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04]">
                  Ops console
                </Link>
                <div className="px-4 py-2">
                  <Link
                    href="/citizen"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full rounded-full px-4 py-2.5 text-sm font-medium bg-accent text-white text-center"
                  >
                    Open intake
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
