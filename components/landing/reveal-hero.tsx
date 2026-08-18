"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";

const BG_NIGHT = "/india-night.jpg";
const BG_DAY = "/india-day.jpg";
const SPOTLIGHT_R = 165;

function RevealLayer({ image, cursorX, cursorY }: { image: string; cursorX: number; cursorY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Apply the spotlight mask imperatively (via ref) so we don't setState every frame.
  useEffect(() => {
    const c = canvasRef.current;
    const div = divRef.current;
    if (!c || !div) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    const g = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, SPOTLIGHT_R);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,1)");
    g.addColorStop(0.6, "rgba(255,255,255,0.75)");
    g.addColorStop(0.75, "rgba(255,255,255,0.4)");
    g.addColorStop(0.88, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cursorX, cursorY, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fill();
    const url = `url(${c.toDataURL()})`;
    div.style.setProperty("mask-image", url);
    div.style.setProperty("-webkit-mask-image", url);
  }, [cursorX, cursorY]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ display: "none" }} />
      <div
        ref={divRef}
        className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none"
        style={{
          backgroundImage: `url('${image}')`,
          maskImage: "none",
          WebkitMaskImage: "none",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
    </>
  );
}

const NAV_LINKS = [
  { label: "Channels", href: "#channels" },
  { label: "How it works", href: "#how" },
  { label: "Live demo", href: "#demo" },
  { label: "Track", href: "/track" },
];

export function RevealHero() {
  const mouse = useRef({ x: -999, y: -999 });
  const smooth = useRef({ x: -999, y: -999 });
  const rafRef = useRef(0);
  const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    const loop = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.1;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.1;
      setCursorPos({ x: smooth.current.x, y: smooth.current.y });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="tracking-[-0.02em]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
        <Link href="/" className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 256 256" fill="#ffffff" aria-hidden>
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic">CivicLens</span>
        </Link>

        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
          <span className="px-4 py-1.5 rounded-full text-sm font-medium text-white bg-white/20">Home</span>
          {NAV_LINKS.map((l) =>
            l.href.startsWith("#") ? (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(l.href.slice(1))
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ),
          )}
        </div>

        <Link
          href="/login"
          className="hidden md:block bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors"
        >
          Sign In
        </Link>
        <Link href="/login" className="md:hidden text-white p-2" aria-label="Menu">
          <Menu size={22} />
        </Link>
      </nav>

      {/* HERO */}
      <section className="relative w-full overflow-hidden h-screen bg-black" style={{ height: "100dvh" }}>
        {/* base night map */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat z-10 hero-breathe"
          style={{ backgroundImage: `url('${BG_NIGHT}')` }}
        />
        {/* reveal day map - breathes in sync with the base so the spotlight stays aligned */}
        <div className="absolute inset-0 z-30 hero-breathe pointer-events-none">
          <RevealLayer image={BG_DAY} cursorX={cursorPos.x} cursorY={cursorPos.y} />
        </div>

        {/* bottom blend into the page background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 z-40 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(10,10,11,0.55) 55%, var(--color-background) 100%)" }}
        />

        {/* heading */}
        <div className="absolute top-[14%] left-0 right-0 flex flex-col items-center text-center px-5 pointer-events-none z-50">
          <h1 className="text-white leading-[0.95]">
            <span
              className="block font-playfair italic font-normal text-5xl sm:text-7xl md:text-8xl hero-anim hero-reveal"
              style={{ letterSpacing: "-0.05em", animationDelay: "0.25s" }}
            >
              See the city
            </span>
            <span
              className="block font-normal text-5xl sm:text-7xl md:text-8xl -mt-1 hero-anim hero-reveal"
              style={{ letterSpacing: "-0.08em", animationDelay: "0.42s" }}
            >
              in a new light
            </span>
          </h1>
        </div>

        {/* bottom-left paragraph */}
        <div className="hidden sm:block absolute bottom-14 left-10 md:left-14 max-w-[260px] z-50 hero-anim hero-fade" style={{ animationDelay: "0.7s" }}>
          <p className="text-sm text-white/80 leading-relaxed">
            Every complaint is a signal in the dark. CivicLens reads it in any language, gauges the distress, scores the urgency, and routes it to the desk that can fix it.
          </p>
        </div>

        {/* bottom-right block */}
        <div
          className="absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px] flex flex-col items-start gap-4 sm:gap-5 z-50 hero-anim hero-fade"
          style={{ animationDelay: "0.85s" }}
        >
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Move the light across the map - watch grievances surface ward by ward, from night into day.
          </p>
          <Link
            href="/login?next=/citizen"
            className="bg-[#e8702a] hover:bg-[#d2611f] text-white text-sm font-medium px-7 py-3 rounded-full transition-all hover:scale-[1.03] active:scale-95 hover:shadow-lg hover:shadow-[#e8702a]/30"
          >
            Report an issue
          </Link>
        </div>
      </section>
    </div>
  );
}
