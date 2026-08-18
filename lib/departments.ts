import type { Category, Priority } from "./types";

export const CITY = "Greater Chennai Corporation";

export const DEPARTMENTS: Record<
  Category,
  { name: string; code: string; officers: string[] }
> = {
  electricity: {
    name: "Electrical & Street Lighting",
    code: "ELC",
    officers: ["P. Verma", "N. Joshi"],
  },
  water: {
    name: "Public Health Engineering - Water",
    code: "WTR",
    officers: ["A. Khan", "M. Tiwari"],
  },
  sanitation: {
    name: "Health & Sanitation",
    code: "SAN",
    officers: ["S. Iyer", "K. Patel"],
  },
  roads: {
    name: "Public Works - Roads",
    code: "PWD",
    officers: ["R. Sharma", "D. Gupta"],
  },
  public_services: {
    name: "Public Services & General Admin",
    code: "PUB",
    officers: ["L. Rao", "H. Singh"],
  },
  corruption: {
    name: "Vigilance Cell",
    code: "VIG",
    officers: ["Duty Officer - Vigilance"],
  },
  other: {
    name: "Central Grievance Cell",
    code: "CGC",
    officers: ["Desk Officer"],
  },
};

export const SLA_HOURS: Record<Priority, number> = {
  urgent: 4,
  high: 24,
  medium: 72,
  low: 168,
};

export const WARDS = [
  "Ward 8 - Anna Nagar",
  "Ward 12 - T. Nagar",
  "Ward 18 - Adyar",
  "Ward 23 - Mylapore",
  "Ward 31 - Velachery",
  "Ward 42 - Guindy",
  "Ward 51 - Egmore",
];

export function departmentFor(category: Category) {
  return DEPARTMENTS[category] ?? DEPARTMENTS.other;
}

export function pickOfficer(category: Category, ward: string) {
  const dept = departmentFor(category);
  const idx = Math.abs(hash(ward + category)) % dept.officers.length;
  return dept.officers[idx];
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
