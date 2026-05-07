import { getHabits, getTasks, getRevenue, HabitEntry } from "./storage";

export function calcDisciplineScore(date: string): number {
  const habits = getHabits();
  const today = habits.find((h) => h.date === date);
  if (!today) return 0;

  let score = 0;
  if (today.deepWork >= 4) score += 25;
  else if (today.deepWork >= 2) score += 15;
  if (today.workout) score += 20;
  if (today.sleep >= 7) score += 15;
  if (today.reading) score += 10;
  if (today.outreach >= 5) score += 20;
  if (today.meditation) score += 10;
  return Math.min(score, 100);
}

export function calcExecutionScore(date: string): number {
  const tasks = getTasks(date);
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

function calcRevenueBonusScore(): number {
  const revenue = getRevenue();
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = prevDate.toISOString().slice(0, 7);
  const thisTotal = revenue
    .filter((e) => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0);
  const lastTotal = revenue
    .filter((e) => e.date.startsWith(lastMonth))
    .reduce((s, e) => s + e.amount, 0);
  if (lastTotal === 0 || thisTotal === 0) return 0;
  const growth = (thisTotal - lastTotal) / lastTotal;
  if (growth <= 0) return 0;
  return Math.min(Math.round(growth * 50), 10);
}

export function calcMomentumScore(date: string): number {
  const d = calcDisciplineScore(date);
  const e = calcExecutionScore(date);
  const base = Math.round(d * 0.5 + e * 0.5);
  return Math.min(base + calcRevenueBonusScore(), 100);
}

export function calcWeeklyConsistency(): number {
  const habits = getHabits();
  const last7 = habits.slice(0, 7);
  if (last7.length === 0) return 0;
  const scores = last7.map((h) => calcDisciplineScore(h.date));
  return Math.round(scores.reduce((a, b) => a + b, 0) / last7.length);
}

export function getStreakCount(): number {
  const habits = getHabits();
  let streak = 0;
  for (const h of habits) {
    if (calcDisciplineScore(h.date) >= 40) streak++;
    else break;
  }
  return streak;
}

export function calcHabitStreak(
  habits: HabitEntry[],
  check: (h: HabitEntry) => boolean
): number {
  const sorted = [...habits].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  for (const h of sorted) {
    if (check(h)) streak++;
    else break;
  }
  return streak;
}
