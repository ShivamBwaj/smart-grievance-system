import { AlertTriangle, CheckCircle2, ChevronDown, Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HudFrame({
  children,
  className,
  active,
  ticks,
}: {
  children: ReactNode;
  className?: string;
  active?: boolean;
  ticks?: boolean;
}) {
  return (
    <div className={cn("hud-frame", active && "hud-frame--active", className)}>
      {ticks ? (
        <span className="corner-ticks" aria-hidden>
          <span />
        </span>
      ) : null}
      {children}
    </div>
  );
}

export function LiveDot({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="live-dot" aria-hidden />
      <span className="mono-label">{label}</span>
    </span>
  );
}

export function SeverityBadge({
  level,
}: {
  level: "high" | "med" | "low" | "confirmed" | "info";
}) {
  const Icon =
    level === "high"
      ? ShieldAlert
      : level === "med"
        ? AlertTriangle
        : level === "confirmed"
          ? CheckCircle2
          : level === "low"
            ? ChevronDown
            : Info;
  const text =
    level === "high"
      ? "HIGH"
      : level === "med"
        ? "MED"
        : level === "confirmed"
          ? "OK"
          : level === "low"
            ? "LOW"
            : "INFO";
  return (
    <span className={cn("severity-chip", `is-${level}`)}>
      <Icon size={11} />
      {text}
    </span>
  );
}

export function LogoMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4" y="4" width="24" height="5" rx="1.5" fill="#c2703e" />
      <rect x="11" y="11" width="10" height="4" rx="1" fill="#c2703e" opacity="0.75" />
      <rect x="12" y="17" width="8" height="4" rx="1" fill="#c2703e" opacity="0.5" />
      <rect x="13" y="23" width="6" height="4" rx="1" fill="#c2703e" opacity="0.3" />
    </svg>
  );
}
