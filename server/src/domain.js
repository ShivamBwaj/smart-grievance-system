// Departments, SLA, wards, clustering + id helpers.
// Ported from the Next app's lib/departments.ts + lib/utils.ts so the backend
// classifies and routes identically to the front-end demo.

export const CITY = "Greater Chennai Corporation";

export const DEPARTMENTS = {
  electricity: { name: "Electrical & Street Lighting", code: "ELC", officers: ["P. Verma", "N. Joshi"] },
  water: { name: "Public Health Engineering - Water", code: "WTR", officers: ["A. Khan", "M. Tiwari"] },
  sanitation: { name: "Health & Sanitation", code: "SAN", officers: ["S. Iyer", "K. Patel"] },
  roads: { name: "Public Works - Roads", code: "PWD", officers: ["R. Sharma", "D. Gupta"] },
  public_services: { name: "Public Services & General Admin", code: "PUB", officers: ["L. Rao", "H. Singh"] },
  corruption: { name: "Vigilance Cell", code: "VIG", officers: ["Duty Officer - Vigilance"] },
  other: { name: "Central Grievance Cell", code: "CGC", officers: ["Desk Officer"] },
};

export const SLA_HOURS = { urgent: 4, high: 24, medium: 72, low: 168 };

export const WARDS = [
  "Ward 8 - Anna Nagar",
  "Ward 12 - T. Nagar",
  "Ward 18 - Adyar",
  "Ward 23 - Mylapore",
  "Ward 31 - Velachery",
  "Ward 42 - Guindy",
  "Ward 51 - Egmore",
];

export const CATEGORIES = [
  "electricity", "water", "sanitation", "roads", "public_services", "corruption", "other",
];
export const PRIORITIES = ["low", "medium", "high", "urgent"];
export const SENTIMENTS = ["distress", "anger", "neutral", "hopeful"];

export function departmentFor(category) {
  return DEPARTMENTS[category] ?? DEPARTMENTS.other;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function pickOfficer(category, ward) {
  const dept = departmentFor(category);
  const idx = Math.abs(hash(ward + category)) % dept.officers.length;
  return dept.officers[idx];
}

export function clusterKey(category, ward, location) {
  const loc = (location || "")
    .toLowerCase()
    .replace(/[^a-z0-9ऀ-ॿ]+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 4)
    .join("-");
  return `${category}:${ward}:${loc || "unknown"}`;
}

export function newId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  const d = new Date();
  const stamp = `${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `CL-${stamp}-${n}`;
}
