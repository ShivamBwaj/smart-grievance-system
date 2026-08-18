import type { Category, Priority, Status } from "./types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 20) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function hoursLeft(dueIso: string) {
  return (new Date(dueIso).getTime() - Date.now()) / 36e5;
}

export function slaLabel(dueIso: string, status: Status) {
  if (status === "resolved" || status === "rejected") return "Closed";
  const h = hoursLeft(dueIso);
  if (h < 0) return `Overdue ${Math.abs(h) < 1 ? "<1h" : `${Math.round(Math.abs(h))}h`}`;
  if (h < 1) return `${Math.round(h * 60)}m left`;
  if (h < 24) return `${Math.round(h)}h left`;
  return `${Math.round(h / 24)}d left`;
}

export function priorityTone(p: Priority): "high" | "med" | "low" | "info" {
  if (p === "urgent" || p === "high") return "high";
  if (p === "medium") return "med";
  return "low";
}

export function categoryLabel(c: Category) {
  return {
    electricity: "Electricity",
    water: "Water",
    sanitation: "Sanitation",
    roads: "Roads",
    public_services: "Public services",
    corruption: "Corruption",
    other: "Other",
  }[c];
}

export function statusLabel(s: Status) {
  return {
    received: "Received",
    queued: "Queued",
    assigned: "Assigned",
    in_progress: "In progress",
    resolved: "Resolved",
    rejected: "Rejected",
  }[s];
}

export function channelLabel(c: string) {
  return { text: "Web", voice: "Voice", image: "Photo", whatsapp: "WhatsApp" }[
    c
  ] ?? c;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function newId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  const d = new Date();
  const stamp = `${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `CL-${stamp}-${n}`;
}

export function clusterKey(category: Category, ward: string, location: string) {
  const loc = location
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 4)
    .join("-");
  return `${category}:${ward}:${loc || "unknown"}`;
}
