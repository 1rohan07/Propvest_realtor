import { RevenueEntry, HabitEntry, Task, FounderProfile } from "./storage";

export type InsightType = "opportunity" | "warning" | "trend" | "prediction";
export type Impact = "high" | "medium" | "low";
export type Urgency = "urgent" | "normal" | "low";

export interface Insight {
  id: string;
  title: string;
  body: string;
  type: InsightType;
  impact: Impact;
  urgency: Urgency;
  action?: { label: string; href: string };
  confidence: number;
}

export function generateInsights(
  revenue: RevenueEntry[],
  habits: HabitEntry[],
  tasks: Task[],
  profile: FounderProfile | null
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const todayStr = now.toISOString().split("T")[0];
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();

  const thisMonthRevenue = revenue
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((s, e) => s + e.amount, 0);
  const lastMonthRevenue = revenue
    .filter((e) => e.date.startsWith(lastMonth))
    .reduce((s, e) => s + e.amount, 0);
  const totalRevenue = revenue.reduce((s, e) => s + e.amount, 0);

  // Revenue: no data at all
  if (revenue.length === 0) {
    insights.push({
      id: "no-revenue",
      title: "Start tracking revenue to unlock predictions",
      body: "You haven't logged any revenue yet. Even ₹1 today begins your data pipeline. The system needs 7 days of entries to generate accurate forecasts and growth signals.",
      type: "warning",
      impact: "high",
      urgency: "urgent",
      confidence: 100,
      action: { label: "Log first entry", href: "/dashboard/revenue" },
    });
  }

  // Revenue: MoM growth
  if (thisMonthRevenue > 0 && lastMonthRevenue > 0) {
    const growth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    if (growth > 20) {
      insights.push({
        id: "rev-growth",
        title: `Revenue up ${growth.toFixed(0)}% month-over-month`,
        body: `You've grown from ₹${lastMonthRevenue.toLocaleString("en-IN")} to ₹${thisMonthRevenue.toLocaleString("en-IN")} this month. Double down on the channel driving this now — early-stage momentum compounds fast.`,
        type: "opportunity",
        impact: "high",
        urgency: "normal",
        confidence: 92,
        action: { label: "Analyse sources", href: "/dashboard/revenue" },
      });
    } else if (growth < -10) {
      insights.push({
        id: "rev-decline",
        title: `Revenue down ${Math.abs(growth).toFixed(0)}% — action needed`,
        body: `Revenue fell from ₹${lastMonthRevenue.toLocaleString("en-IN")} to ₹${thisMonthRevenue.toLocaleString("en-IN")}. Run a conversion audit this week — the issue is either acquisition, conversion, or retention. Identify the leak before scaling spend.`,
        type: "warning",
        impact: "high",
        urgency: "urgent",
        confidence: 88,
        action: { label: "Decision Engine", href: "/dashboard/decision" },
      });
    }
  }

  // Revenue: run-rate projection
  if (thisMonthRevenue > 0 && dayOfMonth >= 5) {
    const projected = Math.round((thisMonthRevenue / dayOfMonth) * daysInMonth);
    const diff = lastMonthRevenue > 0
      ? ` ${projected > lastMonthRevenue ? "A new monthly high." : "Below last month — consider a revenue push this week."}`
      : "";
    insights.push({
      id: "rev-projection",
      title: `Month-end revenue projected: ₹${projected.toLocaleString("en-IN")}`,
      body: `Based on your current run rate (${dayOfMonth} days in), you're on track to close at ₹${projected.toLocaleString("en-IN")} this month.${diff}`,
      type: "prediction",
      impact: "high",
      urgency: "normal",
      confidence: Math.min(60 + dayOfMonth * 1.2, 88),
      action: { label: "See revenue", href: "/dashboard/revenue" },
    });
  }

  // Revenue: source concentration risk
  if (revenue.length > 5 && totalRevenue > 0) {
    const bySrc = revenue.reduce((acc, e) => {
      acc[e.source] = (acc[e.source] ?? 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);
    const top = Object.entries(bySrc).sort((a, b) => b[1] - a[1])[0];
    const topPct = (top[1] / totalRevenue) * 100;
    if (topPct > 70) {
      insights.push({
        id: "rev-concentration",
        title: `${topPct.toFixed(0)}% of revenue from one source — fragility risk`,
        body: `${top[0]} drives ${topPct.toFixed(0)}% of your total revenue. Over-concentration creates fragility — one channel change can halve your income. Build a second stream to cover 30% before scaling.`,
        type: "warning",
        impact: "high",
        urgency: "normal",
        confidence: 85,
        action: { label: "Diversification plan", href: "/dashboard/revenue" },
      });
    }
  }

  // Habits: deep work
  const weekHabits = habits.filter((h) => {
    const d = new Date(h.date);
    return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  });

  if (weekHabits.length >= 3) {
    const avgDW = weekHabits.reduce((s, h) => s + h.deepWork, 0) / weekHabits.length;
    const avgSleep = weekHabits.reduce((s, h) => s + h.sleep, 0) / weekHabits.length;

    if (avgDW >= 4) {
      insights.push({
        id: "deep-work-high",
        title: `Averaging ${avgDW.toFixed(1)}h deep work — top 5% of founders`,
        body: `Research shows 4+ hours of focused work correlates with 2.8x higher output quality. You're building a compounding execution edge. Protect these blocks — they're your biggest competitive advantage.`,
        type: "trend",
        impact: "high",
        urgency: "low",
        confidence: 91,
      });
    } else if (avgDW < 2) {
      insights.push({
        id: "deep-work-low",
        title: `Deep work averaging ${avgDW.toFixed(1)}h — execution quality at risk`,
        body: `Less than 2h of daily focused work limits output velocity significantly. Block two 90-minute deep work sessions before any meetings. A phone-free morning protocol recovers 1–2h daily.`,
        type: "warning",
        impact: "high",
        urgency: "urgent",
        confidence: 87,
        action: { label: "Performance coach", href: "/dashboard/performance" },
      });
    }

    if (avgSleep < 6.5) {
      insights.push({
        id: "sleep-low",
        title: `Sleep at ${avgSleep.toFixed(1)}h avg — decision quality declining`,
        body: `Sleep deprivation below 6.5h reduces decision quality by up to 40%. Founders making key business calls while sleep-deprived are 2.4x more likely to choose suboptimal strategies. Fix sleep before scaling anything.`,
        type: "warning",
        impact: "high",
        urgency: "urgent",
        confidence: 94,
        action: { label: "Build sleep protocol", href: "/dashboard/performance" },
      });
    }
  }

  // Tasks: completion rate
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  if (todayTasks.length >= 3) {
    const completionRate = todayTasks.filter((t) => t.completed).length / todayTasks.length;
    if (completionRate < 0.3) {
      insights.push({
        id: "tasks-low",
        title: "Task completion below 30% today",
        body: "Low completion often signals over-planning or avoidance. Apply the single most important task rule: finish the one task that will matter most tomorrow first — regardless of the rest of the list.",
        type: "warning",
        impact: "medium",
        urgency: "normal",
        confidence: 80,
        action: { label: "Execution system", href: "/dashboard/execution" },
      });
    } else if (completionRate >= 0.8) {
      insights.push({
        id: "tasks-high",
        title: "High execution day — momentum building",
        body: `You've completed ${todayTasks.filter((t) => t.completed).length}/${todayTasks.length} tasks today. Consistent high completion days compound into founder momentum. Use the remaining time to advance a strategic goal.`,
        type: "trend",
        impact: "medium",
        urgency: "low",
        confidence: 85,
      });
    }
  }

  // Profile bottleneck
  if (profile?.mainBottleneck) {
    insights.push({
      id: "bottleneck",
      title: `Primary constraint: ${profile.mainBottleneck}`,
      body: `Theory of Constraints: improving anything except your bottleneck is an illusion of progress. Every week this constraint isn't resolved, you're losing compounding growth. Make it your only focus until fixed.`,
      type: "prediction",
      impact: "high",
      urgency: "urgent",
      confidence: 78,
      action: { label: "Decision Engine", href: "/dashboard/decision" },
    });
  }

  // Market opportunity (static, always relevant)
  insights.push({
    id: "market-tier2",
    title: "India D2C: Tier-2 cities growing 3x faster than metros",
    body: "Consumer brands in Tier-2/3 cities are growing 3x faster in 2024-25. If your product has offline or vernacular potential, this is your expansion window before the market saturates.",
    type: "opportunity",
    impact: "medium",
    urgency: "normal",
    confidence: 76,
    action: { label: "Intelligence feed", href: "/dashboard/intelligence" },
  });

  // AI tools opportunity
  if (profile?.businessType?.toLowerCase().includes("saas") || profile?.businessType?.toLowerCase().includes("ai")) {
    insights.push({
      id: "ai-adoption",
      title: "AI tool SMB adoption surging — first-mover window open",
      body: "SMBs are rapidly adopting AI tools for ops, content, and CS. First-movers in niche AI verticals capture 60-80% of category search traffic before competitors arrive.",
      type: "opportunity",
      impact: "high",
      urgency: "normal",
      confidence: 81,
      action: { label: "Explore intelligence", href: "/dashboard/intelligence" },
    });
  }

  return insights.slice(0, 7);
}

export function generatePriorities(
  revenue: RevenueEntry[],
  habits: HabitEntry[],
  tasks: Task[],
  profile: FounderProfile | null
): Array<{ title: string; reason: string; href: string; urgency: "critical" | "high" | "medium" }> {
  const priorities = [];
  const todayStr = new Date().toISOString().split("T")[0];
  const todayHabit = habits.find((h) => h.date === todayStr);
  const todayTasks = tasks.filter((t) => t.date === todayStr && !t.completed);
  const highPriorityTasks = todayTasks.filter((t) => t.priority === "high");
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthRev = revenue.filter((e) => e.date.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0);

  if (highPriorityTasks.length > 0) {
    priorities.push({
      title: highPriorityTasks[0].text,
      reason: `Highest priority task — completing this unlocks downstream execution`,
      href: "/dashboard/execution",
      urgency: "critical" as const,
    });
  }

  if (!todayHabit || todayHabit.deepWork < 2) {
    priorities.push({
      title: "Lock in your deep work block",
      reason: `No focused work logged today — your execution quality depends on this`,
      href: "/dashboard/performance",
      urgency: (todayHabit ? "high" : "critical") as "critical" | "high",
    });
  }

  if (thisMonthRev === 0) {
    priorities.push({
      title: "Drive revenue: no entries this month yet",
      reason: "First revenue entry of the month unlocks momentum tracking",
      href: "/dashboard/revenue",
      urgency: "high" as const,
    });
  }

  if (profile?.mainBottleneck) {
    priorities.push({
      title: `Unblock: ${profile.mainBottleneck}`,
      reason: "Your declared #1 constraint — resolving this compounds all other growth",
      href: "/dashboard/decision",
      urgency: "high" as const,
    });
  }

  priorities.push({
    title: "Review your intelligence feed",
    reason: "New signals detected in your business data",
    href: "/dashboard/intelligence",
    urgency: "medium" as const,
  });

  return priorities.slice(0, 3);
}
