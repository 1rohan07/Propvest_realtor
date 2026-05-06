import { getHabits, getTasks } from "./storage";

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

export function calcMomentumScore(date: string): number {
  const d = calcDisciplineScore(date);
  const e = calcExecutionScore(date);
  return Math.round(d * 0.5 + e * 0.5);
}

export function calcWeeklyConsistency(): number {
  const habits = getHabits();
  const last7 = habits.slice(0, 7);
  if (last7.length === 0) return 0;
  const scores = last7.map((h) =>
    calcDisciplineScore(h.date)
  );
  return Math.round(scores.reduce((a, b) => a + b, 0) / last7.length);
}

export function getStreakCount(): number {
  const habits = getHabits();
  let streak = 0;
  for (const h of habits) {
    const score = calcDisciplineScore(h.date);
    if (score >= 40) streak++;
    else break;
  }
  return streak;
}
