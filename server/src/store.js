// Complaint store: create / read / update / upvote / analytics.
// Ported from the Next app's lib/store.ts, backed by SQLite instead of a JSON file.

import { classifyComplaint } from "./classify.js";
import { pickOfficer, SLA_HOURS, clusterKey, newId } from "./domain.js";
import { loadAll, persistAll, seedIfEmpty } from "./db.js";

let writeQueue = Promise.resolve();

function withLock(fn) {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.then(() => undefined, () => undefined);
  return run;
}

// Always read fresh from SQLite. At demo scale this is trivially cheap and it
// keeps the raw /api/_all endpoints (used by the Vercel frontend) perfectly
// consistent with the VM's own create/update paths.
function readAll() {
  seedIfEmpty();
  return loadAll();
}

function persist(rows) {
  persistAll(rows);
}

// Raw storage access for the frontend-as-brains model: Vercel classifies with
// OpenAI, then reads/writes the whole list here.
export function readAllRaw() {
  seedIfEmpty();
  return loadAll();
}
export function replaceAllRaw(rows) {
  if (!Array.isArray(rows)) throw new Error("expected an array of complaints");
  persistAll(rows);
  return rows.length;
}

export function listComplaints() {
  return [...readAll()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getComplaint(id) {
  return readAll().find((r) => r.id === id) ?? null;
}

export function createComplaint(input) {
  return withLock(async () => {
    const rows = readAll();
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

    const complaint = {
      id,
      citizenId: input.anonymous ? `anon-${id.slice(-4)}` : input.citizenId,
      citizenName: input.anonymous ? "Anonymous" : input.citizenName,
      phone: input.anonymous ? null : input.phone ?? null,
      anonymous: Boolean(input.anonymous),
      channel: input.channel,
      waSid: input.waSid ?? null, // Twilio message id, for WhatsApp-sync dedupe
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
          label: input.anonymous ? "Anonymous filing (tracking token only)" : `Filed via ${input.channel}`,
          actor: input.anonymous ? "Anonymous" : input.citizenName,
          kind: "citizen",
        },
        {
          at: now,
          label: master
            ? `Duplicate of ${master.id} · clustered as one issue`
            : `Classified -> ${ai.departmentCode} / ${ai.category} · ${Math.round(ai.confidence * 100)}% · ${ai.language}`,
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
    persist(rows);
    return complaint;
  });
}

export function updateComplaint(id, patch) {
  return withLock(async () => {
    const rows = readAll();
    const row = rows.find((r) => r.id === id);
    if (!row) return null;
    const now = new Date().toISOString();
    const actor = patch.actor || "Duty officer";

    if (patch.category && patch.category !== row.category) {
      row.category = patch.category;
      row.timeline.push({ at: now, label: `HITL override: category -> ${patch.category}`, actor, kind: "officer" });
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
      row.timeline.push({ at: now, label: statusVerb(patch.status), actor, kind: "officer" });
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
      row.timeline.push({ at: now, label: `Citizen rated ${patch.feedbackRating}/5`, actor: row.citizenName, kind: "citizen" });
    }
    if (patch.note) row.timeline.push({ at: now, label: patch.note, actor, kind: "officer" });
    row.updatedAt = now;
    persist(rows);
    return row;
  });
}

export function upvoteComplaint(id, voterId) {
  return withLock(async () => {
    const rows = readAll();
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
    persist(rows);
    return row;
  });
}

function refreshClusterCounts(rows, clusterId) {
  const members = rows.filter((r) => r.clusterId === clusterId);
  const masters = members.filter((r) => !r.duplicateOf);
  const impact = members.length + masters.reduce((s, m) => s + m.upvotes, 0);
  for (const m of members) m.impactCount = impact;
}

function statusVerb(s) {
  return {
    received: "Moved back to intake",
    queued: "Queued for department",
    assigned: "Assigned",
    in_progress: "Work started",
    resolved: "Marked resolved",
    rejected: "Rejected / not a civic issue",
  }[s];
}

export function getAnalytics() {
  const rows = listComplaints();
  const masters = rows.filter((r) => !r.duplicateOf);
  const open = masters.filter((r) => r.status !== "resolved" && r.status !== "rejected");
  const resolved = masters.filter((r) => r.status === "resolved");
  const overdue = open.filter((r) => new Date(r.slaDueAt).getTime() < Date.now());

  const deptMap = new Map();
  for (const r of masters) {
    const cur = deptMap.get(r.departmentCode) ?? { name: r.department, count: 0, open: 0 };
    cur.count += 1;
    if (r.status !== "resolved" && r.status !== "rejected") cur.open += 1;
    deptMap.set(r.departmentCode, cur);
  }

  const priMap = { urgent: 0, high: 0, medium: 0, low: 0 };
  for (const r of masters) priMap[r.priority] = (priMap[r.priority] || 0) + 1;

  const chMap = { text: 0, voice: 0, image: 0, whatsapp: 0 };
  for (const r of rows) chMap[r.channel] = (chMap[r.channel] || 0) + 1;

  const days = [];
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
    days.push({ day: d.toLocaleDateString("en-IN", { weekday: "short" }), filed, resolved: res });
  }

  const wardMap = new Map();
  for (const r of open) {
    const list = wardMap.get(r.ward) ?? [];
    list.push(r);
    wardMap.set(r.ward, list);
  }
  const hotspots = [...wardMap.entries()]
    .map(([ward, list]) => {
      const cats = new Map();
      for (const r of list) cats.set(r.category, (cats.get(r.category) || 0) + 1);
      const topCategory = [...cats.entries()].sort((a, b) => b[1] - a[1])[0][0];
      return { ward, count: list.length, topCategory, urgent: list.filter((r) => r.priority === "urgent").length };
    })
    .sort((a, b) => b.count - a.count);

  const clusterMap = new Map();
  for (const r of rows) {
    const list = clusterMap.get(r.clusterId) ?? [];
    list.push(r);
    clusterMap.set(r.clusterId, list);
  }
  const clusters = [...clusterMap.values()]
    .map((list) => {
      const master = list.find((r) => !r.duplicateOf) ?? list[0];
      return { id: master.id, title: master.summary, ward: master.ward, category: master.category, count: master.impactCount, status: master.status };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const avgConfidence = masters.reduce((s, r) => s + r.confidence, 0) / Math.max(1, masters.length);

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
