"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
}: {
  className?: string;
  children: ReactNode;
  showRadialGradient?: boolean;
}) {
  return (
    <div className={cn("relative flex flex-col min-h-[100dvh] items-center justify-center bg-background", className)}>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            `[--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
            [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            blur-[4px] md:blur-[10px] filter invert-0
            after:content-[""] after:absolute after:inset-0
            after:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%]
            md:after:animate-aurora md:after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute inset-0 md:-inset-[10px] opacity-50 md:will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`,
          )}
        />
      </div>
      {children}
    </div>
  );
}
