"use client";

import { useEffect, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { addHabit, getHabits, HabitEntry } from "@/lib/storage";
import { calcDisciplineScore, calcExecutionScore, calcMomentumScore } from "@/lib/scoring";
import { today, getLast7Days, dayLabel } from "@/lib/utils";
import TopBar from "@/components/dashboard/TopBar";
import KPICard from "@/components/ui/KPICard";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { Activity, Moon, Dumbbell, Book, Phone, CheckCircle } from "lucide-react";

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

export default function PerformancePage() {
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [todayHabit, setTodayHabit] = useState<HabitEntry>(DEFAULT_HABIT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const all = getHabits();
    setHabits(all);
    const t = all.find((h) => h.date === today());
    if (t) setTodayHabit(t);
  }, []);

  const saveHabit = () => {
    addHabit(todayHabit);
    setHabits(getHabits());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

  const radarData = [
    { subject: "Deep Work", A: (todayHabit.deepWork / 8) * 100 },
    { subject: "Workout", A: todayHabit.workout ? 100 : 0 },
    { subject: "Sleep", A: (todayHabit.sleep / 9) * 100 },
    { subject: "Reading", A: todayHabit.reading ? 100 : 0 },
    { subject: "Outreach", A: Math.min((todayHabit.outreach / 10) * 100, 100) },
    { subject: "Mindfulness", A: todayHabit.meditation ? 100 : 0 },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Founder Performance" />

      <div className="flex-1 p-6 space-y-6">
        <SectionHeader title="Performance Tracker" subtitle="Track your discipline, execution, and consistency daily" />

        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Avg Momentum" value={`${avgMomentum}/100`} accent icon={<Activity size={14} />} />
          <KPICard label="Avg Discipline" value={`${avgDiscipline}/100`} icon={<CheckCircle size={14} />} />
          <KPICard label="Deep Work Today" value={`${todayHabit.deepWork}h`} icon={<Activity size={14} />} />
          <KPICard label="Outreach Today" value={todayHabit.outreach} sub="Contacts made" icon={<Phone size={14} />} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Today's Habits</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted flex items-center gap-1.5"><Activity size={12} /> Deep Work Hours</span>
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
                {[
                  { key: "workout", label: "Workout / Swim", icon: <Dumbbell size={12} /> },
                  { key: "reading", label: "Reading", icon: <Book size={12} /> },
                  { key: "meditation", label: "Meditation", icon: <Moon size={12} /> },
                  { key: "coldShower", label: "Cold Shower", icon: <Activity size={12} /> },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => set(key as keyof HabitEntry, !todayHabit[key as keyof HabitEntry])}
                    className={cn(
                      "flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg border transition-colors",
                      todayHabit[key as keyof HabitEntry]
                        ? "border-accent bg-accent-dim text-accent-bright"
                        : "border-border text-muted hover:text-text-primary"
                    )}
                  >
                    {icon} {label}
                    {todayHabit[key as keyof HabitEntry] && <span className="ml-auto text-accent-bright">✓</span>}
                  </button>
                ))}
              </div>

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
      </div>
    </div>
  );
}
