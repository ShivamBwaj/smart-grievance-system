export const CHANNELS = ["text", "voice", "image", "whatsapp"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CATEGORIES = [
  "electricity",
  "water",
  "sanitation",
  "roads",
  "public_services",
  "corruption",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const SENTIMENTS = ["distress", "anger", "neutral", "hopeful"] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const STATUSES = [
  "received",
  "queued",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
] as const;
export type Status = (typeof STATUSES)[number];

export type TimelineEvent = {
  at: string;
  label: string;
  actor: string;
  kind: "system" | "citizen" | "officer" | "ai";
};

export type Complaint = {
  id: string;
  citizenId: string;
  citizenName: string;
  phone: string | null;
  anonymous: boolean;
  channel: Channel;
  waSid?: string | null;
  originalText: string;
  language: string;
  languageName: string;
  translatedText: string;
  summary: string;
  imageDataUrl: string | null;
  resolutionImageDataUrl: string | null;
  lat: number | null;
  lng: number | null;
  locationLabel: string;
  ward: string;
  category: Category;
  department: string;
  departmentCode: string;
  officer: string | null;
  priority: Priority;
  severity: number;
  sentiment: Sentiment;
  confidence: number;
  reasoning: string;
  isEmergency: boolean;
  slaHours: number;
  slaDueAt: string;
  status: Status;
  clusterId: string;
  duplicateOf: string | null;
  upvotes: number;
  voters: string[];
  impactCount: number;
  verifiedByHuman: boolean;
  overrideNotes: string | null;
  feedbackRating: number | null;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
};

export type ClassifyResult = {
  language: string;
  languageName: string;
  translatedText: string;
  summary: string;
  category: Category;
  department: string;
  departmentCode: string;
  ward: string;
  locationExtracted: string;
  priority: Priority;
  severity: number;
  sentiment: Sentiment;
  confidence: number;
  reasoning: string;
  isEmergency: boolean;
  slaHours: number;
  duplicateOfId: string | null;
};

export type NewComplaintInput = {
  citizenId: string;
  citizenName: string;
  phone?: string | null;
  anonymous?: boolean;
  channel: Channel;
  waSid?: string | null;
  originalText: string;
  imageDataUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  locationLabel?: string;
};

export type AnalyticsPayload = {
  total: number;
  open: number;
  resolved: number;
  urgent: number;
  overdue: number;
  avgConfidence: number;
  byDepartment: { name: string; count: number; open: number }[];
  byPriority: { name: string; count: number }[];
  byChannel: { name: string; count: number }[];
  byDay: { day: string; filed: number; resolved: number }[];
  hotspots: {
    ward: string;
    count: number;
    topCategory: Category;
    urgent: number;
  }[];
  clusters: {
    id: string;
    title: string;
    ward: string;
    category: Category;
    count: number;
    status: Status;
  }[];
};
