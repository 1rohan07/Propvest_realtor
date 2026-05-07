"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTasks, getRevenue, getHabits, getLastWeeklyReview, setLastWeeklyReview } from "@/lib/storage";
import { calcDisciplineScore } from "@/lib/scoring";
import { formatCurrency } from "@/lib/utils";
import { X, BarChart2, TrendingUp, Flame, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeekSummary {
  tasksCompleted: number;
  tasksCreated: number;
  completionPct: number;
  thisWeekRevenue: number;
  lastWeekRevenue: number;
  revenueChange: number;
  bestDay: string;
  bestScore: number;
  worstDay: string;
  worstScore: number;
  topTasks: string[];
  oneLiner: string;
}

function getWeekDates(weekOffset = 0): string[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1) - weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function buildSummary(): WeekSummary {
  const thisWeekDates = getWeekDates(0);
  const lastWeekDates = getWeekDates(1);

  const allTasks = getTasks();
  const thisWeekTasks = allTasks.filter((t) => thisWeekDates.includes(t.date));
  const tasksCompleted = thisWeekTasks.filter((t) => t.completed).length;
  const tasksCreated = thisWeekTasks.length;
  const completionPct = tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0;

  const revenue = getRevenue();
  const thisWeekRevenue = revenue.filter((e) => thisWeekDates.includes(e.date)).reduce((s, e) => s + e.amount, 0);
  const lastWeekRevenue = revenue.filter((e) => lastWeekDates.includes(e.date)).reduce((s, e) => s + e.amount, 0);
  const revenueChange = lastWeekRevenue > 0
    ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100)
    : 0;

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let bestDay = "—";
  let bestScore = -1;
  let worstDay = "—";
  let worstScore = 101;

  thisWeekDates.forEach((d, i) => {
    const score = calcDisciplineScore(d);
    if (score > bestScore) { bestScore = score; bestDay = DAYS[i]; }
    if (score < worstScore) { worstScore = score; worstDay = DAYS[i]; }
  });

  const topTasks = thisWeekTasks
    .filter((t) => t.completed && t.priority === "high")
    .slice(0, 3)
    .map((t) => t.text);

  const oneLiner = (() => {
    if (tasksCreated === 0 && thisWeekRevenue === 0) return "Quiet week — use the weekly review to plan a stronger one.";
    if (completionPct >= 80 && revenueChange >= 0) return `Solid week: ${completionPct}% task completion${thisWeekRevenue > 0 ? ` and ${formatCurrency(thisWeekRevenue)} in revenue` : ""}. Keep the momentum.`;
    if (completionPct >= 60) return `Decent week: ${completionPct}% done. ${tasksCreated - tasksCompleted} task${tasksCreated - tasksCompleted !== 1 ? "s" : ""} left unfinished — carry the highest-impact ones forward.`;
    return `Tough week: only ${completionPct}% completion. Identify what blocked execution and fix the system, not the effort.`;
  })();

  return {
    tasksCompleted, tasksCreated, completionPct,
    thisWeekRevenue, lastWeekRevenue, revenueChange,
    bestDay, bestScore: Math.max(bestScore, 0),
    worstDay, worstScore: Math.min(worstScore, 100),
    topTasks, oneLiner,
  };
}

export default function WeeklyReview({ onDismiss }: { onDismiss: () => void }) {
  const [summary, setSummary] = useState<WeekSummary | null>(null);

  useEffect(() => {
    setSummary(buildSummary());
  }, []);

  const handleDismiss = () => {
    setLastWeeklyReview(new Date().toISOString().slice(0, 10));
    onDismiss();
  };

  if (!summary) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass rounded-2xl p-6 w-full max-w-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Weekly Review</h2>
              <p className="text-[10px] text-muted mt-0.5">This week's performance snapshot</p>
            </div>
            <button onClick={handleDismiss} className="text-muted hover:text-text-primary p-1">
              <X size={15} />
            </button>
          </div>

          {/* One-liner */}
          <div className="bg-accent-dim border border-accent/30 rounded-xl px-4 py-3 mb-5">
            <p className="text-sm text-accent-bright leading-relaxed">{summary.oneLiner}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Tasks */}
            <div className="bg-surface-2 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={13} className="text-accent-bright" />
                <p className="text-xs font-semibold text-text-primary">Execution</p>
              </div>
              <p className="text-2xl font-bold text-text-primary">{summary.completionPct}%</p>
              <p className="text-[10px] text-muted mt-0.5">
                {summary.tasksCompleted} / {summary.tasksCreated} tasks done
              </p>
            </div>

            {/* Revenue */}
            <div className="bg-surface-2 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={13} className="text-accent-bright" />
                <p className="text-xs font-semibold text-text-primary">Revenue</p>
              </div>
              <p className="text-2xl font-bold text-text-primary">{formatCurrency(summary.thisWeekRevenue)}</p>
              {summary.lastWeekRevenue > 0 && (
                <p className={cn("text-[10px] mt-0.5", summary.revenueChange >= 0 ? "text-accent-bright" : "text-red-400")}>
                  {summary.revenueChange >= 0 ? "+" : ""}{summary.revenueChange}% vs last week
                </p>
              )}
            </div>

            {/* Best day */}
            <div className="bg-surface-2 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={13} className="text-orange-400" />
                <p className="text-xs font-semibold text-text-primary">Best Day</p>
              </div>
              <p className="text-xl font-bold text-text-primary">{summary.bestDay}</p>
              <p className="text-[10px] text-muted mt-0.5">Discipline: {summary.bestScore}/100</p>
            </div>

            {/* Consistency */}
            <div className="bg-surface-2 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 size={13} className="text-blue-400" />
                <p className="text-xs font-semibold text-text-primary">Needs Work</p>
              </div>
              <p className="text-xl font-bold text-text-primary">{summary.worstDay}</p>
              <p className="text-[10px] text-muted mt-0.5">Score: {summary.worstScore}/100</p>
            </div>
          </div>

          {/* Top tasks */}
          {summary.topTasks.length > 0 && (
            <div className="bg-surface-2 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-text-primary mb-2">Top Completed Tasks</p>
              <ul className="space-y-1.5">
                {summary.topTasks.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                    <CheckCircle2 size={11} className="text-accent-bright mt-0.5 flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleDismiss}
            className="w-full bg-accent text-white text-sm py-2.5 rounded-xl hover:bg-accent-bright transition-colors font-medium"
          >
            Close Review
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
