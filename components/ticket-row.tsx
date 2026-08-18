import type { ReactNode } from "react";
import Link from "next/link";
import { Clock3, ImageOff, MapPin, Radio, Tag, User, Users } from "lucide-react";
import { HudFrame, SeverityBadge } from "@/components/hud";
import type { Complaint } from "@/lib/types";
import {
  categoryLabel,
  channelLabel,
  cn,
  priorityTone,
  slaLabel,
  statusLabel,
  timeAgo,
} from "@/lib/utils";

export function TicketRow({
  c,
  href,
  action,
}: {
  c: Complaint;
  href?: string;
  /** Optional control rendered top-right of the card (e.g. a "Me Too" button). */
  action?: ReactNode;
}) {
  const tone = priorityTone(c.priority);
  const sla = slaLabel(c.slaDueAt, c.status);
  const overdue = sla.startsWith("Overdue") && c.status !== "resolved";

  const inner = (
    <HudFrame className="p-4 flex gap-4 hover:border-border-strong transition-colors">
      <div className={cn("severity-bar", `is-${tone}`)} />

      {/* Evidence thumbnail — large enough to actually read the photo. */}
      {c.imageDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={c.imageDataUrl}
          alt="Evidence"
          className="w-16 h-16 rounded-lg object-cover border border-border shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg border border-dashed border-border grid place-items-center shrink-0 text-muted">
          <ImageOff size={18} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Row 1 — identity + severity + flags, action/time on the right */}
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="mono-data text-foreground/90 font-medium">{c.id}</span>
            <SeverityBadge level={c.priority === "low" ? "low" : tone} />
            {c.isEmergency && <span className="severity-chip is-high">URGENT</span>}
            {c.duplicateOf && <span className="severity-chip is-info">DUPLICATE</span>}
            {c.anonymous && <span className="severity-chip is-med">ANON</span>}
          </div>
          <div className="ml-auto shrink-0" onClick={action ? (e) => e.preventDefault() : undefined}>
            {action ?? <span className="mono-data">{timeAgo(c.createdAt)}</span>}
          </div>
        </div>

        {/* Row 2 — the complaint itself, the loudest thing in the card */}
        <p className="mt-2 text-[15px] text-foreground leading-relaxed line-clamp-2">
          {c.summary}
        </p>

        {/* Row 3 — spaced, iconed meta with dividers instead of a cramped run-on line */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="meta-chip">
            <User size={13} />
            {c.anonymous ? "Anonymous" : c.citizenName}
          </span>
          <span className="meta-divider" />
          <span className="meta-chip">
            <Tag size={13} />
            {categoryLabel(c.category)}
          </span>
          <span className="meta-chip">
            <MapPin size={13} />
            {c.ward.replace(/^Ward \d+ — /, "")}
          </span>
          <span className="meta-chip">
            <Radio size={13} />
            {channelLabel(c.channel)}
          </span>
          <span className="meta-divider" />
          <span className="meta-chip">{statusLabel(c.status)}</span>
          <span className={cn("meta-chip", overdue && "text-critical")}>
            <Clock3 size={13} className={overdue ? "text-critical" : undefined} />
            {sla}
          </span>
          {action && (
            <>
              <span className="meta-divider" />
              <span className="meta-chip">{timeAgo(c.createdAt)}</span>
            </>
          )}
          {c.impactCount > 1 && (
            <span className="meta-chip text-accent-bright ml-auto">
              <Users size={13} className="text-accent" />
              {c.impactCount} citizens
            </span>
          )}
        </div>
      </div>
    </HudFrame>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="block">
      {inner}
    </Link>
  );
}
