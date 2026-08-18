import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Side-by-side original vs resolution photo. Renders nothing until the officer uploads a fix. */
export function BeforeAfter({
  before,
  after,
}: {
  before: string | null;
  after: string | null;
}) {
  if (!after) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      <figure>
        <figcaption className="mono-data mb-1.5">BEFORE</figcaption>
        {before ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={before} alt="Before" className="w-full h-40 object-cover rounded-lg border border-border" />
        ) : (
          <div className="w-full h-40 rounded-lg border border-dashed border-border grid place-items-center text-[12px] text-muted">
            No original photo
          </div>
        )}
      </figure>
      <figure>
        <figcaption className="mono-data mb-1.5 text-positive">AFTER · RESOLVED</figcaption>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt="After" className="w-full h-40 object-cover rounded-lg border border-positive/40" />
      </figure>
    </div>
  );
}

/** Interactive 1–5 star rating. Read-only when onRate is omitted. */
export function StarRating({
  value,
  onRate,
  size = 20,
}: {
  value: number | null;
  onRate?: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (value ?? 0) >= n;
        const Wrap = onRate ? "button" : "span";
        return (
          <Wrap
            key={n}
            {...(onRate ? { onClick: () => onRate(n), type: "button" as const } : {})}
            className={cn(onRate && "hover:scale-110 transition-transform", "leading-none")}
            aria-label={onRate ? `Rate ${n} of 5` : undefined}
          >
            <Star
              size={size}
              className={filled ? "text-medium" : "text-muted"}
              fill={filled ? "currentColor" : "none"}
            />
          </Wrap>
        );
      })}
    </div>
  );
}
