export interface FounderProfile {
  name: string;
  founderType: string;
  businessType: string;
  stage: string;
  currentRevenue: string;
  targetRevenue: string;
  mainBottleneck: string;
  biggestStrength: string;
  biggestWeakness: string;
  primaryRevSource: string;
  salesChannels: string[];
  acquisitionChannel: string;
  avgOrderValue: string;
  teamSize: string;
  platforms: string[];
  currentFollowers: Record<string, string>;
  targetAudience: string;
  brandPositioning: string;
  competitors: string;
  tools: string[];
  productiveHours: string;
  sleepSchedule: string;
  workoutFreq: string;
  biggestDistraction: string;
  peakProductivityWindow: string;
  aiProfile?: string;
  aiDiagnosis?: string;
  aiPriorities?: string;
  createdAt: string;
}

export interface RevenueEntry {
  date: string;
  amount: number;
  source: string;
  note: string;
  externalId?: string;
}

export interface HabitEntry {
  date: string;
  deepWork: number;
  workout: boolean;
  sleep: number;
  reading: boolean;
  outreach: number;
  meditation: boolean;
  coldShower: boolean;
}

export interface Task {
  id: string;
  text: string;
  category: string;
  completed: boolean;
  date: string;
  priority: "high" | "medium" | "low";
  goalId?: string;
}

export interface Contact {
  id: string;
  name: string;
  platform: string;
  status: "interested" | "follow-up" | "negotiation" | "confirmed" | "completed";
  note: string;
  date: string;
  followUpDate?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  category: string;
  description: string;
  priority: "high" | "medium" | "low";
  date: string;
}

export type FounderMode = "growth" | "survival" | "brand" | "fundraising" | "operations" | "sprint";

export interface FounderMemory {
  goals: string;
  currentExperiments: string;
  biggestWin: string;
  currentChallenge: string;
  nextMilestone: string;
  preferredStrategy: string;
  energyLevel: "high" | "medium" | "low";
  updatedAt: string;
}

const KEYS = {
  profile: "founder_profile",
  revenue: "revenue_entries",
  habits: "habit_entries",
  tasks: "daily_tasks",
  contacts: "networking_contacts",
  opportunities: "opportunities",
  goals: "founder_goals",
  marketing: "marketing_data",
  mode: "founder_mode",
  memory: "founder_memory",
};

function get<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const getProfile = () => get<FounderProfile>(KEYS.profile);
export const setProfile = (p: FounderProfile) => set(KEYS.profile, p);
export const clearProfile = () => localStorage.removeItem(KEYS.profile);

export const getRevenue = () => get<RevenueEntry[]>(KEYS.revenue) ?? [];
export const addRevenue = (entry: RevenueEntry) => {
  const entries = getRevenue();
  set(KEYS.revenue, [entry, ...entries]);
};

export const getHabits = () => get<HabitEntry[]>(KEYS.habits) ?? [];
export const addHabit = (entry: HabitEntry) => {
  const entries = getHabits();
  const idx = entries.findIndex((e) => e.date === entry.date);
  if (idx >= 0) {
    entries[idx] = entry;
    set(KEYS.habits, entries);
  } else {
    set(KEYS.habits, [entry, ...entries]);
  }
};

export const getTasks = (date?: string) => {
  const all = get<Task[]>(KEYS.tasks) ?? [];
  return date ? all.filter((t) => t.date === date) : all;
};
export const setTasks = (tasks: Task[]) => set(KEYS.tasks, tasks);

export const getContacts = () => get<Contact[]>(KEYS.contacts) ?? [];
export const setContacts = (contacts: Contact[]) => set(KEYS.contacts, contacts);

export const getOpportunities = () => get<Opportunity[]>(KEYS.opportunities) ?? [];
export const setOpportunities = (ops: Opportunity[]) => set(KEYS.opportunities, ops);

export const getGoals = () =>
  get<{ title: string; target: string; deadline: string; progress: number; category: string }[]>(
    KEYS.goals
  ) ?? [];
export const setGoals = (goals: unknown[]) => set(KEYS.goals, goals);

export const getMarketingData = () =>
  get<Record<string, unknown>>(KEYS.marketing) ?? {};
export const setMarketingData = (data: Record<string, unknown>) =>
  set(KEYS.marketing, data);

export const getFounderMode = (): FounderMode =>
  get<FounderMode>(KEYS.mode) ?? "growth";
export const setFounderMode = (mode: FounderMode) => set(KEYS.mode, mode);

export const getFounderMemory = () => get<FounderMemory>(KEYS.memory);
export const setFounderMemory = (m: FounderMemory) => set(KEYS.memory, m);

// ── Brand notes & checklist ──────────────────────────────────────────────────
export interface BrandNotes {
  positioning: string;
  voice: string;
  differentiators: string;
  competitors: string;
}
export const getBrandNotes = () =>
  get<BrandNotes>("brand_notes") ?? { positioning: "", voice: "", differentiators: "", competitors: "" };
export const setBrandNotes = (n: BrandNotes) => set("brand_notes", n);

export const getBrandChecklist = () =>
  get<Record<string, boolean>>("brand_checklist") ?? {};
export const setBrandChecklist = (c: Record<string, boolean>) =>
  set("brand_checklist", c);

// ── Competitor log ────────────────────────────────────────────────────────────
export interface CompetitorEntry {
  id: string;
  name: string;
  pricing: string;
  latestMove: string;
  ourResponse: string;
  date: string;
}
export const getCompetitorLog = () =>
  get<CompetitorEntry[]>("competitor_log") ?? [];
export const setCompetitorLog = (c: CompetitorEntry[]) =>
  set("competitor_log", c);

// ── Marketing daily snapshots ─────────────────────────────────────────────────
export interface MarketingSnapshot {
  id: string;
  date: string;
  platform: string;
  followers: number;
  engagement: number;
}
export const getMarketingSnapshots = () =>
  get<MarketingSnapshot[]>("marketing_snapshots") ?? [];
export const addMarketingSnapshot = (s: MarketingSnapshot) => {
  const all = getMarketingSnapshots();
  set("marketing_snapshots", [s, ...all]);
};

// ── Advisor chat history ──────────────────────────────────────────────────────
export interface AdvisorMessage {
  role: "user" | "assistant";
  content: string;
  mode: string;
}
export const getAdvisorHistory = () =>
  get<AdvisorMessage[]>("advisor_history") ?? [];
export const setAdvisorHistory = (msgs: AdvisorMessage[]) =>
  set("advisor_history", msgs.slice(-50)); // cap at 50 messages
export const clearAdvisorHistory = () => {
  if (typeof window !== "undefined") localStorage.removeItem("advisor_history");
};

// ── Dismissed insights ────────────────────────────────────────────────────────
export const getDismissedInsights = (): string[] => {
  const raw = get<{ id: string; expiry: number }[]>("dismissed_insights") ?? [];
  const now = Date.now();
  return raw.filter((d) => d.expiry > now).map((d) => d.id);
};
export const dismissInsight = (id: string) => {
  const raw = get<{ id: string; expiry: number }[]>("dismissed_insights") ?? [];
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
  const updated = [...raw.filter((d) => d.id !== id), { id, expiry }];
  set("dismissed_insights", updated);
};
export const clearDismissedInsights = () => {
  if (typeof window !== "undefined") localStorage.removeItem("dismissed_insights");
};

// ── Weekly review ─────────────────────────────────────────────────────────────
export const getLastWeeklyReview = () =>
  get<string>("last_weekly_review");
export const setLastWeeklyReview = (date: string) =>
  set("last_weekly_review", date);

// ── Dismissed alerts ──────────────────────────────────────────────────────────
export const getDismissedAlerts = (): string[] => {
  const raw = get<{ id: string; date: string }[]>("dismissed_alerts") ?? [];
  const today = new Date().toISOString().slice(0, 10);
  return raw.filter((d) => d.date === today).map((d) => d.id);
};
export const dismissAlert = (id: string) => {
  const raw = get<{ id: string; date: string }[]>("dismissed_alerts") ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const updated = [...raw.filter((d) => d.id !== id && d.date === today), { id, date: today }];
  set("dismissed_alerts", updated);
};
