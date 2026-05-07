import { getRevenue, getHabits, getGoals, getDismissedAlerts, dismissAlert } from "./storage";
import { hasAIConfigured } from "./ai";
import { getIntegrationStatus, ALL_PLATFORMS } from "./integrations";
import { calcDisciplineScore } from "./scoring";
import { yesterday } from "./utils";

export { dismissAlert };

export interface Alert {
  id: string;
  title: string;
  body: string;
  severity: "critical" | "warning" | "info";
  href: string;
}

export function generateAlerts(): Alert[] {
  if (typeof window === "undefined") return [];

  const dismissed = getDismissedAlerts();
  const alerts: Alert[] = [];

  const push = (a: Alert) => {
    if (!dismissed.includes(a.id)) alerts.push(a);
  };

  // No AI configured
  if (!hasAIConfigured()) {
    push({
      id: "no-ai-key",
      title: "AI not configured",
      body: "Add an API key in Settings to unlock all AI agents",
      severity: "warning",
      href: "/dashboard/settings",
    });
  }

  // No revenue in last 3 days
  const revenue = getRevenue();
  if (revenue.length > 0) {
    const recent = new Date();
    recent.setDate(recent.getDate() - 3);
    const recentStr = recent.toISOString().slice(0, 10);
    const hasRecent = revenue.some((e) => e.date >= recentStr);
    if (!hasRecent) {
      push({
        id: "no-recent-revenue",
        title: "No revenue logged in 3+ days",
        body: "Keep your revenue tracker up to date for accurate insights",
        severity: "warning",
        href: "/dashboard/revenue",
      });
    }
  }

  // Habit streak about to break
  const habits = getHabits();
  const yesterdayStr = yesterday();
  const ystScore = calcDisciplineScore(yesterdayStr);
  if (habits.length > 3 && ystScore < 40) {
    push({
      id: "streak-risk",
      title: "Discipline score dropped yesterday",
      body: `Yesterday's score: ${ystScore}/100 — your streak may be at risk`,
      severity: "warning",
      href: "/dashboard/performance",
    });
  }

  // Goal deadline within 7 days
  const goals = getGoals();
  const now = new Date();
  for (const g of goals) {
    if (!g.deadline || g.progress >= 100) continue;
    const deadline = new Date(g.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
    if (daysLeft >= 0 && daysLeft <= 7) {
      push({
        id: `goal-deadline-${g.title}`,
        title: `Goal deadline in ${daysLeft}d`,
        body: `"${g.title}" is due ${daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`} at ${g.progress}% progress`,
        severity: daysLeft <= 2 ? "critical" : "warning",
        href: "/dashboard/vision",
      });
    }
    if (daysLeft < 0 && g.progress < 100) {
      push({
        id: `goal-overdue-${g.title}`,
        title: "Goal overdue",
        body: `"${g.title}" passed its deadline at ${g.progress}% — update or reschedule`,
        severity: "critical",
        href: "/dashboard/vision",
      });
    }
  }

  // Stale integration sync (7+ days)
  for (const platform of ALL_PLATFORMS) {
    const status = getIntegrationStatus(platform);
    if (!status.isConnected || !status.lastSyncedAt) continue;
    const lastSync = new Date(status.lastSyncedAt);
    const daysSince = Math.floor((Date.now() - lastSync.getTime()) / 86400000);
    if (daysSince >= 7) {
      push({
        id: `stale-sync-${platform}`,
        title: `${platform.replace("_", " ")} sync overdue`,
        body: `Last synced ${daysSince} days ago — data may be outdated`,
        severity: "info",
        href: "/dashboard/integrations",
      });
    }
  }

  return alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}
