"use client";

import { useEffect, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell
} from "recharts";
import { addHabit, getHabits, getRevenue, HabitEntry } from "@/lib/storage";
import { calcDisciplineScore, calcExecutionScore, calcMomentumScore, calcHabitStreak } from "@/lib/scoring";
import { today, getLast7Days, dayLabel, dateNDaysAgo } from "@/lib/utils";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { Target as TargetIcon } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { Activity, Moon, Dumbbell, Book, Phone, CheckCircle, Flame, TrendingUp } from "lucide-react";

const DEFAULT_HABIT: HabitEntry = {
  date: today(),
  deepWork: 0,
  workout: false,
  sleep: 7,
  reading: false,
  outreach: 0,
  meditation: false,
  coldShower: false,
};

interface HabitCorrelation {
  habit: string;
  withHabitAvg: number;
  withoutHabitAvg: number;
  sampleWith: number;
  sampleWithout: number;
}

function calcHabitRevenueCorrelation(habits: HabitEntry[]): HabitCorrelation[] {
  const revenue = getRevenue();
  const last30Dates = Array.from({ length: 30 }, (_, i) => dateNDaysAgo(i));

  const revenueByDate: Record<string, number> = {};
  for (const e of revenue) {
    revenueByDate[e.date] = (revenueByDate[e.date] ?? 0) + e.amount;
  }

  const habitChecks: { key: string; label: string; check: (h: HabitEntry) => boolean }[] = [
    { key: "deepWork4h", label: "4h+ Deep Work", check: (h) => h.deepWork >= 4 },
    { key: "workout", label: "Workout", check: (h) => h.workout },
    { key: "meditation", label: "Meditation", check: (h) => h.meditation },
    { key: "reading", label: "Reading", check: (h) => h.reading },
  ];

  return habitChecks.map(({ label, check }) => {
    const withRevenues: number[] = [];
    const withoutRevenues: number[] = [];

    for (const date of last30Dates) {
      const h = habits.find((e) => e.date === date);
      if (!h) continue;
      const rev = revenueByDate[date] ?? 0;
      if (check(h)) withRevenues.push(rev);
      else withoutRevenues.push(rev);
    }

    const avg = (arr: number[]) =>
      arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

    return {
      habit: label,
      withHabitAvg: avg(withRevenues),
      withoutHabitAvg: avg(withoutRevenues),
      sampleWith: withRevenues.length,
      sampleWithout: withoutRevenues.length,
    };
  });
}

export default function PerformancePage() {
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [todayHabit, setTodayHabit] = useState<HabitEntry>(DEFAULT_HABIT);
  const [saved, setSaved] = useState(false);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [bestStreaks, setBestStreaks] = useState<Record<string, number>>({});
  const [correlations, setCorrelations] = useState<HabitCorrelation[]>([]);

  useEffect(() => {
    const all = getHabits();
    setHabits(all);
    const t = all.find((h) => h.date === today());
    if (t) setTodayHabit(t);

    // Calculate streaks per habit
    const habitChecks: { key: string; check: (h: HabitEntry) => boolean }[] = [
      { key: "workout", check: (h) => h.workout },
      { key: "reading", check: (h) => h.reading },
      { key: "meditation", check: (h) => h.meditation },
      { key: "coldShower", check: (h) => h.coldShower },
      { key: "deepWork4h", check: (h) => h.deepWork >= 4 },
    ];

    const currentStreaks: Record<string, number> = {};
    const best: Record<string, number> = {};

    for (const { key, check } of habitChecks) {
      currentStreaks[key] = calcHabitStreak(all, check);
      // Best streak: try from each start date (simplified: just use the current sorted list)
      // We do a sliding window to find max streak
      const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
      let max = 0;
      let cur = 0;
      for (const h of sorted) {
        if (check(h)) { cur++; max = Math.max(max, cur); }
        else cur = 0;
      }
      best[key] = max;
    }

    setStreaks(currentStreaks);
    setBestStreaks(best);
    setCorrelations(calcHabitRevenueCorrelation(all));
  }, []);

  const saveHabit = () => {
    addHabit(todayHabit);
    const all = getHabits();
    setHabits(all);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Refresh streaks after save
    const habitChecks: { key: string; check: (h: HabitEntry) => boolean }[] = [
      { key: "workout", check: (h) => h.workout },
      { key: "reading", check: (h) => h.reading },
      { key: "meditation", check: (h) => h.meditation },
      { key: "coldShower", check: (h) => h.coldShower },
      { key: "deepWork4h", check: (h) => h.deepWork >= 4 },
    ];
    const currentStreaks: Record<string, number> = {};
    for (const { key, check } of habitChecks) {
      currentStreaks[key] = calcHabitStreak(all, check);
    }
    setStreaks(currentStreaks);
    setCorrelations(calcHabitRevenueCorrelation(all));
  };

  const set = (k: keyof HabitEntry, v: number | boolean) =>
    setTodayHabit((p) => ({ ...p, [k]: v }));

  const last7 = getLast7Days().reverse();
  const trendData = last7.map((d) => ({
    day: dayLabel(d),
    discipline: calcDisciplineScore(d),
    execution: calcExecutionScore(d),
    momentum: calcMomentumScore(d),
  }));

  const avgMomentum = Math.round(trendData.reduce((s, d) => s + d.momentum, 0) / 7);
  const avgDiscipline = Math.round(trendData.reduce((s, d) => s + d.discipline, 0) / 7);
  const bestStreak = Math.max(...Object.values(streaks), 0);

  const radarData = [
    { subject: "Deep Work", A: (todayHabit.deepWork / 8) * 100 },
    { subject: "Workout", A: todayHabit.workout ? 100 : 0 },
    { subject: "Sleep", A: (todayHabit.sleep / 9) * 100 },
    { subject: "Reading", A: todayHabit.reading ? 100 : 0 },
    { subject: "Outreach", A: Math.min((todayHabit.outreach / 10) * 100, 100) },
    { subject: "Mindfulness", A: todayHabit.meditation ? 100 : 0 },
  ];

  const TOGGLE_HABITS = [
    { key: "workout",    label: "Workout / Swim",  icon: <Dumbbell size={12} />,  streakKey: "workout" },
    { key: "reading",   label: "Reading",          icon: <Book size={12} />,      streakKey: "reading" },
    { key: "meditation",label: "Meditation",       icon: <Moon size={12} />,      streakKey: "meditation" },
    { key: "coldShower",label: "Cold Shower",      icon: <Activity size={12} />,  streakKey: "coldShower" },
  ] as const;

  const hasCorrelationData = correlations.some((c) => c.sampleWith > 0 || c.sampleWithout > 0);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Founder Performance" />

      <div className="flex-1 p-6 space-y-6">
        <SectionHeader title="Performance Tracker" subtitle="Track your discipline, execution, and consistency daily" />

        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Avg Momentum" value={`${avgMomentum}/100`} accent icon={<Activity size={14} />} />
          <KPICard label="Avg Discipline" value={`${avgDiscipline}/100`} icon={<CheckCircle size={14} />} />
          <KPICard label="Deep Work Today" value={`${todayHabit.deepWork}h`} icon={<Activity size={14} />} />
          <KPICard label="Best Streak" value={`${bestStreak}d`} sub="consecutive days" icon={<Flame size={14} />} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Today's Habits</h3>
              {Object.values(streaks).some((s) => s > 0) && (
                <span className="text-[10px] text-muted">Streak shown per habit</span>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted flex items-center gap-1.5">
                    <Activity size={12} /> Deep Work Hours
                    {streaks["deepWork4h"] > 0 && (
                      <span className="flex items-center gap-0.5 text-orange-400">
                        <Flame size={10} /> {streaks["deepWork4h"]}d
                      </span>
                    )}
                  </span>
                  <span className="text-text-primary font-medium">{todayHabit.deepWork}h</span>
                </div>
                <input
                  type="range" min={0} max={12} step={0.5}
                  value={todayHabit.deepWork}
                  onChange={(e) => set("deepWork", parseFloat(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-surface-2 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted flex items-center gap-1.5"><Moon size={12} /> Sleep Hours</span>
                  <span className="text-text-primary font-medium">{todayHabit.sleep}h</span>
                </div>
                <input
                  type="range" min={3} max={10} step={0.5}
                  value={todayHabit.sleep}
                  onChange={(e) => set("sleep", parseFloat(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-surface-2 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted flex items-center gap-1.5"><Phone size={12} /> Outreach Count</span>
                  <span className="text-text-primary font-medium">{todayHabit.outreach}</span>
                </div>
                <input
                  type="range" min={0} max={20} step={1}
                  value={todayHabit.outreach}
                  onChange={(e) => set("outreach", parseInt(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-surface-2 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TOGGLE_HABITS.map(({ key, label, icon, streakKey }) => {
                  const active = todayHabit[key as keyof HabitEntry];
                  const streak = streaks[streakKey] ?? 0;
                  return (
                    <button
                      key={key}
                      onClick={() => set(key as keyof HabitEntry, !active)}
                      className={cn(
                        "flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg border transition-colors",
                        active
                          ? "border-accent bg-accent-dim text-accent-bright"
                          : "border-border text-muted hover:text-text-primary"
                      )}
                    >
                      {icon}
                      <span className="flex-1 text-left">{label}</span>
                      {streak > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-400 text-[10px] ml-auto">
                          <Flame size={9} /> {streak}d
                        </span>
                      )}
                      {active && streak === 0 && <span className="ml-auto text-accent-bright">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Best streaks strip */}
              {Object.values(bestStreaks).some((s) => s > 0) && (
                <div className="pt-1 border-t border-border">
                  <p className="text-[10px] text-muted mb-2">Best streaks ever</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TOGGLE_HABITS.map(({ label, streakKey }) => (
                      <div key={streakKey} className="text-center">
                        <p className="text-xs font-semibold text-text-primary">{bestStreaks[streakKey] ?? 0}d</p>
                        <p className="text-[9px] text-muted leading-tight">{label.split(" ")[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={saveHabit}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-medium transition-all",
                  saved
                    ? "bg-accent-dim text-accent-bright border border-accent"
                    : "bg-accent text-white hover:bg-accent-bright"
                )}
              >
                {saved ? "Saved ✓" : "Save Today's Habits"}
              </button>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Performance Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#222" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#666" }} />
                <Radar name="Today" dataKey="A" stroke="#4a7c59" fill="#4a7c59" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">7-Day Performance Trend</h3>
          {habits.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-xs text-muted">Log habits daily to see your performance trend.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #222", borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="momentum" stroke="#4a7c59" strokeWidth={2} dot={false} name="Momentum" />
                <Line type="monotone" dataKey="discipline" stroke="#6aaf7e" strokeWidth={1.5} dot={false} name="Discipline" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Habit-Revenue Correlation (A3) */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={13} className="text-accent-bright" />
            <h3 className="text-sm font-semibold text-text-primary">Habit × Revenue Correlation</h3>
          </div>
          <p className="text-xs text-muted mb-4">Average revenue on days you did vs didn't do each habit (last 30 days)</p>
          {!hasCorrelationData ? (
            <p className="text-xs text-muted text-center py-4">Log habits and revenue for 5+ days to see correlations.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {correlations.map((c) => {
                const max = Math.max(c.withHabitAvg, c.withoutHabitAvg, 1);
                const diff = c.withHabitAvg - c.withoutHabitAvg;
                const positive = diff >= 0;
                return (
                  <div key={c.habit} className="bg-surface-2 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-text-primary">{c.habit}</p>
                      {c.sampleWith > 0 && c.sampleWithout > 0 && (
                        <span className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                          positive ? "text-accent-bright bg-accent-dim" : "text-red-400 bg-red-400/10"
                        )}>
                          {positive ? "+" : ""}₹{Math.abs(diff).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-muted mb-1">
                          <span>With habit ({c.sampleWith}d)</span>
                          <span className="text-text-primary font-medium">₹{c.withHabitAvg.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all"
                            style={{ width: `${(c.withHabitAvg / max) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-muted mb-1">
                          <span>Without habit ({c.sampleWithout}d)</span>
                          <span className="text-text-primary font-medium">₹{c.withoutHabitAvg.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-muted/30 rounded-full transition-all"
                            style={{ width: `${(c.withoutHabitAvg / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <EmbeddedAgent
        agentName="Discipline Coach"
        badge="PRO"
        agentIcon={<TargetIcon size={13} className="text-white" />}
        systemPrompt={`You are a world-class high-performance coach, behavioural psychologist, and elite athlete mindset trainer rolled into one. You replace expensive executive coaches and performance consultants.
Today's habits logged: Deep work ${todayHabit.deepWork}h, Sleep ${todayHabit.sleep}h, Workout: ${todayHabit.workout ? "yes" : "no"}, Outreach: ${todayHabit.outreach} contacts, Reading: ${todayHabit.reading ? "yes" : "no"}, Meditation: ${todayHabit.meditation ? "yes" : "no"}, Cold shower: ${todayHabit.coldShower ? "yes" : "no"}.
7-day average momentum: ${avgMomentum}/100. Discipline score: ${avgDiscipline}/100.
Current streaks: Workout ${streaks.workout ?? 0}d, Meditation ${streaks.meditation ?? 0}d, Reading ${streaks.reading ?? 0}d, Cold shower ${streaks.coldShower ?? 0}d, 4h+ deep work ${streaks.deepWork4h ?? 0}d.
RULES: Be ruthlessly honest. Never be soft. Give specific protocols, time blocks, and frameworks. Always give a complete structured response with implementation steps. You are the founder's head performance coach — your job is to make them the sharpest, most disciplined operator in their space.`}
        quickActions={[
          { label: "Full performance diagnosis + fix plan", prompt: "Analyse my habit data and scores in detail. Identify the top 3 things pulling my performance down, explain exactly why they matter, and give me a specific fix plan for each — with exact changes to implement this week.", category: "Mindset" },
          { label: "Design my optimal daily schedule (time-blocked)", prompt: "Design a complete, time-blocked daily schedule for a high-performance founder. Include wake time, morning protocol, deep work blocks, meals, movement, admin, and wind-down. Make it realistic and specific — not generic.", category: "Systems" },
          { label: "Build an unstoppable morning routine", prompt: "Design a high-performance morning routine for me based on my habits. Include: wake time, first 60 minutes protocol, how to build mental clarity before the first task, physical activation, and how to stack the habits efficiently. Include both a 30-minute and 90-minute version.", category: "Systems" },
          { label: "Procrastination emergency protocol", prompt: "I'm stuck and avoiding my most important task right now. Give me an immediate 5-step protocol to break the procrastination in the next 10 minutes and get into deep work. Include the psychological reason I'm avoiding it and exactly how to override it.", category: "Focus" },
          { label: "Deep work system: eliminate all distraction", prompt: "Build a complete deep work system for me. Include: how to structure 90-120 minute focus blocks, environment design (phone, notifications, space), pre-work ritual to enter flow, how to handle interruptions, and a weekly deep work schedule. Give me something I can implement tomorrow.", category: "Focus" },
          { label: "Sleep optimisation for peak performance", prompt: "Build a complete sleep optimisation protocol for a high-performance founder. Include: ideal sleep and wake time, pre-sleep wind-down routine (last 90 minutes), what to avoid, how to improve sleep quality without supplements, and how to recover from a bad night. Give specific times and actions.", category: "Health" },
          { label: "Stress & cortisol management system", prompt: "Build a complete stress management system for a founder who is constantly under pressure. Include: how to detect early burnout signs, daily stress-relief protocols (under 10 minutes), breathing techniques with exact instructions, how to reset between high-intensity tasks, and weekly recovery practices.", category: "Health" },
          { label: "Habit stacking: build a compound routine", prompt: "Design a habit stacking system for me that compounds multiple high-value habits into a single seamless routine. Identify which of my habits can be stacked, how to anchor them to existing triggers, and give me a complete stack I can run in the morning and evening.", category: "Systems" },
          { label: "Burnout prevention & recovery protocol", prompt: "I'm showing signs of burnout or low energy. Run a burnout diagnostic and give me a complete 2-week recovery protocol. Include: what to stop doing immediately, daily recovery practices, how to maintain business momentum while recovering, and how to build in sustainable rest going forward.", category: "Recovery" },
          { label: "Weekly review & accountability system", prompt: "Build a complete weekly review system for me. Include: what to review each Sunday (habits, tasks, revenue, progress), 5 key questions to ask myself, how to plan the next week with intention, how to set my weekly non-negotiables, and how to hold myself accountable without external accountability partners.", category: "Mindset" },
        ]}
      />
    </div>
  );
}
