import Link from "next/link";
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
}: {
  c: Complaint;
  href?: string;
}) {
  const tone = priorityTone(c.priority);
  const sla = slaLabel(c.slaDueAt, c.status);
  const overdue = sla.startsWith("Overdue") && c.status !== "resolved";
  const inner = (
    <HudFrame className="p-4 flex gap-3 hover:border-border-strong transition-colors">
      <div className={cn("severity-bar", `is-${tone}`)} />
      {c.imageDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.imageDataUrl} alt="" className="w-11 h-11 rounded-md object-cover border border-border shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="mono-data">{c.id}</span>
          <SeverityBadge level={c.priority === "low" ? "low" : tone} />
          {c.isEmergency && <span className="severity-chip is-high">URGENT</span>}
          {c.duplicateOf && <span className="severity-chip is-info">DUP</span>}
          {c.anonymous && <span className="severity-chip is-med">ANON</span>}
          <span className="mono-data ml-auto">{timeAgo(c.createdAt)}</span>
        </div>
        <p className="mt-1.5 text-[13.5px] text-foreground leading-snug line-clamp-2">{c.summary}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>{c.anonymous ? "Anonymous" : c.citizenName}</span>
          <span>{categoryLabel(c.category)}</span>
          <span>{c.ward}</span>
          <span>{channelLabel(c.channel)}</span>
          <span>{statusLabel(c.status)}</span>
          <span className={overdue ? "text-critical" : ""}>{sla}</span>
          {c.impactCount > 1 && <span>{c.impactCount} citizens</span>}
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
