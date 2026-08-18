import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { classifyComplaint } from "./classify";
import { pickOfficer, SLA_HOURS } from "./departments";
import { seedComplaints } from "./seed";
import type { AnalyticsPayload, Complaint, NewComplaintInput, Status } from "./types";
import { clusterKey, newId } from "./utils";

// Serverless platforms (Vercel) have a read-only filesystem except the temp dir.
// The in-memory `cache` is the source of truth per instance; the file just gives
// warm-instance persistence. Data reseeds on a cold start - fine for this demo.
const DATA_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), "civiclens-complaints.json")
  : path.join(process.cwd(), "data", "complaints.json");

// Persistence backend. In production the data lives in SQLite on the Azure VM;
// the frontend (Vercel) keeps doing the OpenAI classification — which the VM's
// region can't reach — and reads/writes the list here over server-side HTTP.
// Local dev (no BACKEND_URL) falls back to the JSON file + in-repo seed.
const BACKEND_URL =
  process.env.BACKEND_URL || (process.env.NODE_ENV === "production" ? "http://52.184.22.2" : "");

let cache: Complaint[] | null = null;
let writeQueue = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readAll(): Promise<Complaint[]> {
  if (BACKEND_URL) {
    // Always fresh in serverless: another instance may have written since.
    const res = await fetch(`${BACKEND_URL}/api/_all`, { cache: "no-store" });
    if (!res.ok) throw new Error(`backend read failed (${res.status})`);
    return (await res.json()) as Complaint[];
  }
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    cache = JSON.parse(raw) as Complaint[];
    return cache;
  } catch {
    cache = seedComplaints();
    await persist(cache);
    return cache;
  }
}

async function persist(rows: Complaint[]) {
  if (BACKEND_URL) {
    const res = await fetch(`${BACKEND_URL}/api/_all`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`backend write failed (${res.status})`);
    return;
  }
  cache = rows; // in-memory is the source of truth; disk is best-effort
  try {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(rows, null, 2), "utf8");
  } catch {
    /* read-only FS (serverless) - keep serving from memory */
  }
}

export async function listComplaints() {
  const rows = await readAll();
  return [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getComplaint(id: string) {
  const rows = await readAll();
  return rows.find((r) => r.id === id) ?? null;
}

export async function createComplaint(input: NewComplaintInput): Promise<Complaint> {
  return withLock(async () => {
    const rows = await readAll();
    const open = rows.filter((r) => r.status !== "resolved" && r.status !== "rejected" && !r.duplicateOf);
    const ai = await classifyComplaint({
      text: input.originalText,
      imageDataUrl: input.imageDataUrl,
      locationLabel: input.locationLabel,
      lat: input.lat,
      lng: input.lng,
      candidates: open,
    });

    const now = new Date().toISOString();
    const master = ai.duplicateOfId ? rows.find((r) => r.id === ai.duplicateOfId) : null;
    const locationLabel = input.locationLabel || ai.locationExtracted || "Chennai";
    const ward = master?.ward || ai.ward;
    const category = master?.category || ai.category;
    const key = clusterKey(category, ward, locationLabel);
    const id = newId();
    const slaHours = ai.slaHours || SLA_HOURS[ai.priority];
    const slaDueAt = new Date(Date.now() + slaHours * 36e5).toISOString();
    const officer = master?.officer || pickOfficer(category, ward);

    const complaint: Complaint = {
      id,
      citizenId: input.anonymous ? `anon-${id.slice(-4)}` : input.citizenId,
      citizenName: input.anonymous ? "Anonymous" : input.citizenName,
      phone: input.anonymous ? null : input.phone ?? null,
      anonymous: Boolean(input.anonymous),
      channel: input.channel,
      waSid: input.waSid ?? null,
      originalText: input.originalText,
      language: ai.language,
      languageName: ai.languageName,
      translatedText: ai.translatedText,
      summary: ai.summary,
      imageDataUrl: input.imageDataUrl ?? null,
      resolutionImageDataUrl: null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      locationLabel,
      ward,
      category,
      department: master?.department || ai.department,
      departmentCode: master?.departmentCode || ai.departmentCode,
      officer,
      priority: ai.isEmergency ? "urgent" : ai.priority,
      severity: ai.severity,
      sentiment: ai.sentiment,
      confidence: ai.confidence,
      reasoning: ai.reasoning,
      isEmergency: ai.isEmergency,
      slaHours,
      slaDueAt: master?.slaDueAt || slaDueAt,
      status: master ? "queued" : ai.confidence < 0.7 ? "received" : "queued",
      clusterId: master?.clusterId || key,
      duplicateOf: master?.id ?? null,
      upvotes: 0,
      voters: [],
      impactCount: 1,
      verifiedByHuman: false,
      overrideNotes: null,
      feedbackRating: null,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          at: now,
          label: input.anonymous
            ? "Anonymous filing (tracking token only)"
            : `Filed via ${input.channel}`,
          actor: input.anonymous ? "Anonymous" : input.citizenName,
          kind: "citizen",
        },
        {
          at: now,
          label: master
            ? `Duplicate of ${master.id} · clustered as one issue`
            : `Classified → ${ai.departmentCode} / ${ai.category} · ${Math.round(ai.confidence * 100)}% · ${ai.language}`,
          actor: "CivicLens AI",
          kind: "ai",
        },
      ],
    };

    if (master) {
      master.upvotes += 1;
      master.impactCount += 1;
      master.updatedAt = now;
      master.timeline.push({
        at: now,
        label: `Citizen joined this issue (Me Too) · ${master.upvotes + 1} reports`,
        actor: complaint.citizenName,
        kind: "citizen",
      });
    }

    rows.unshift(complaint);
    refreshClusterCounts(rows, complaint.clusterId);
    await persist(rows);
    return complaint;
  });
}

export async function updateComplaint(
  id: string,
  patch: Partial<
    Pick<
      Complaint,
      | "status"
      | "officer"
      | "category"
      | "department"
      | "departmentCode"
      | "priority"
      | "overrideNotes"
      | "verifiedByHuman"
      | "feedbackRating"
      | "ward"
      | "resolutionImageDataUrl"
    >
  > & { note?: string; actor?: string },
) {
  return withLock(async () => {
    const rows = await readAll();
    const row = rows.find((r) => r.id === id);
    if (!row) return null;
    const now = new Date().toISOString();
    const actor = patch.actor || "Duty officer";

    if (patch.category && patch.category !== row.category) {
      row.category = patch.category;
      row.timeline.push({
        at: now,
        label: `HITL override: category → ${patch.category}`,
        actor,
        kind: "officer",
      });
    }
    if (patch.department) row.department = patch.department;
    if (patch.departmentCode) row.departmentCode = patch.departmentCode;
    if (patch.priority && patch.priority !== row.priority) {
      row.priority = patch.priority;
      row.timeline.push({ at: now, label: `Priority set to ${patch.priority}`, actor, kind: "officer" });
    }
    if (patch.officer) {
      row.officer = patch.officer;
      row.status = row.status === "received" || row.status === "queued" ? "assigned" : row.status;
      row.timeline.push({ at: now, label: `Assigned to ${patch.officer}`, actor, kind: "officer" });
    }
    if (patch.status && patch.status !== row.status) {
      row.status = patch.status;
      row.timeline.push({
        at: now,
        label: statusVerb(patch.status),
        actor,
        kind: "officer",
      });
    }
    if (patch.ward) row.ward = patch.ward;
    if (patch.resolutionImageDataUrl) {
      row.resolutionImageDataUrl = patch.resolutionImageDataUrl;
      row.timeline.push({ at: now, label: "Resolution photo uploaded", actor, kind: "officer" });
    }
    if (typeof patch.verifiedByHuman === "boolean") {
      row.verifiedByHuman = patch.verifiedByHuman;
      if (patch.verifiedByHuman) {
        row.timeline.push({ at: now, label: "Officer confirmed AI classification", actor, kind: "officer" });
      }
    }
    if (patch.overrideNotes) row.overrideNotes = patch.overrideNotes;
    if (typeof patch.feedbackRating === "number") {
      row.feedbackRating = patch.feedbackRating;
      row.timeline.push({
        at: now,
        label: `Citizen rated ${patch.feedbackRating}/5`,
        actor: row.citizenName,
        kind: "citizen",
      });
    }
    if (patch.note) {
      row.timeline.push({ at: now, label: patch.note, actor, kind: "officer" });
    }
    row.updatedAt = now;
    await persist(rows);
    return row;
  });
}

export async function upvoteComplaint(id: string, voterId: string) {
  return withLock(async () => {
    const rows = await readAll();
    const row = rows.find((r) => r.id === id);
    if (!row) return null;
    if (row.voters.includes(voterId)) return row;
    row.voters.push(voterId);
    row.upvotes += 1;
    row.impactCount += 1;
    row.updatedAt = new Date().toISOString();
    row.timeline.push({
      at: row.updatedAt,
      label: `Me Too · ${row.upvotes} neighbours now on this issue`,
      actor: "Citizen",
      kind: "citizen",
    });
    refreshClusterCounts(rows, row.clusterId);
    await persist(rows);
    return row;
  });
}

function refreshClusterCounts(rows: Complaint[], clusterId: string) {
  const members = rows.filter((r) => r.clusterId === clusterId);
  const masters = members.filter((r) => !r.duplicateOf);
  const impact = members.length + masters.reduce((s, m) => s + m.upvotes, 0);
  for (const m of members) m.impactCount = impact;
}

function statusVerb(s: Status) {
  return {
    received: "Moved back to intake",
    queued: "Queued for department",
    assigned: "Assigned",
    in_progress: "Work started",
    resolved: "Marked resolved",
    rejected: "Rejected / not a civic issue",
  }[s];
}

export async function getAnalytics(): Promise<AnalyticsPayload> {
  const rows = await listComplaints();
  const masters = rows.filter((r) => !r.duplicateOf);
  const open = masters.filter((r) => r.status !== "resolved" && r.status !== "rejected");
  const resolved = masters.filter((r) => r.status === "resolved");
  const overdue = open.filter((r) => new Date(r.slaDueAt).getTime() < Date.now());

  const deptMap = new Map<string, { name: string; count: number; open: number }>();
  for (const r of masters) {
    const cur = deptMap.get(r.departmentCode) ?? { name: r.department, count: 0, open: 0 };
    cur.count += 1;
    if (r.status !== "resolved" && r.status !== "rejected") cur.open += 1;
    deptMap.set(r.departmentCode, cur);
  }

  const priMap: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
  for (const r of masters) priMap[r.priority] = (priMap[r.priority] || 0) + 1;

  const chMap: Record<string, number> = { text: 0, voice: 0, image: 0, whatsapp: 0 };
  for (const r of rows) chMap[r.channel] = (chMap[r.channel] || 0) + 1;

  const days: AnalyticsPayload["byDay"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const filed = rows.filter((r) => {
      const t = +new Date(r.createdAt);
      return t >= +d && t < +next;
    }).length;
    const res = rows.filter((r) => {
      const t = +new Date(r.updatedAt);
      return r.status === "resolved" && t >= +d && t < +next;
    }).length;
    days.push({
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      filed,
      resolved: res,
    });
  }

  const wardMap = new Map<string, Complaint[]>();
  for (const r of open) {
    const list = wardMap.get(r.ward) ?? [];
    list.push(r);
    wardMap.set(r.ward, list);
  }
  const hotspots = [...wardMap.entries()]
    .map(([ward, list]) => {
      const cats = new Map<Complaint["category"], number>();
      for (const r of list) cats.set(r.category, (cats.get(r.category) || 0) + 1);
      const topCategory = [...cats.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return {
        ward,
        count: list.length,
        topCategory,
        urgent: list.filter((r) => r.priority === "urgent").length,
      };
    })
    .sort((a, b) => b.count - a.count);

  const clusterMap = new Map<string, Complaint[]>();
  for (const r of rows) {
    const list = clusterMap.get(r.clusterId) ?? [];
    list.push(r);
    clusterMap.set(r.clusterId, list);
  }
  const clusters = [...clusterMap.values()]
    .map((list) => {
      const master = list.find((r) => !r.duplicateOf) ?? list[0];
      return {
        id: master.id,
        title: master.summary,
        ward: master.ward,
        category: master.category,
        count: master.impactCount,
        status: master.status,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const avgConfidence =
    masters.reduce((s, r) => s + r.confidence, 0) / Math.max(1, masters.length);

  return {
    total: masters.length,
    open: open.length,
    resolved: resolved.length,
    urgent: open.filter((r) => r.priority === "urgent").length,
    overdue: overdue.length,
    avgConfidence,
    byDepartment: [...deptMap.values()].sort((a, b) => b.count - a.count),
    byPriority: Object.entries(priMap).map(([name, count]) => ({ name, count })),
    byChannel: Object.entries(chMap).map(([name, count]) => ({ name, count })),
    byDay: days,
    hotspots,
    clusters,
  };
}
