"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  getProfile, getRevenue, getHabits, getTasks, getFounderMode, getLastWeeklyReview,
  FounderProfile, RevenueEntry, HabitEntry, Task, FounderMode,
} from "@/lib/storage";
import { formatCurrency, greet, today } from "@/lib/utils";
import { calcDisciplineScore, calcMomentumScore } from "@/lib/scoring";
import { generateInsights, generatePriorities } from "@/lib/insights";
import { MODES } from "@/components/dashboard/ModeSelector";
import InsightsFeed from "@/components/dashboard/InsightsFeed";
import TopBar from "@/components/dashboard/TopBar";
import WeeklyReview from "@/components/dashboard/WeeklyReview";
import { cn } from "@/lib/utils";
import {
  TrendingUp, Zap, Target, Activity, ChevronRight,
  GitBranch, Bot, Brain, Flame, ArrowRight, Link2, Calendar,
} from "lucide-react";

const URGENCY_CONFIG = {
  critical: { label: "CRITICAL", color: "text-red-400", border: "border-red-400/30", bg: "bg-red-400/5" },
  high:     { label: "HIGH",     color: "text-yellow-400", border: "border-yellow-400/30", bg: "bg-yellow-400/5" },
  medium:   { label: "FOCUS",    color: "text-accent-bright", border: "border-accent/30", bg: "bg-accent-dim/50" },
};

const MODE_CONTEXT: Record<FounderMode, string> = {
  growth:      "Revenue-first thinking · Double down on what's working",
  survival:    "Protect the runway · Every rupee counts right now",
  brand:       "Build the brand signal · Positioning before promotion",
  fundraising: "Build investor confidence · Metrics, narrative, proof",
  operations:  "Systemize for scale · Build systems, not just speed",
  sprint:      "Execute at maximum velocity · Ship, iterate, compound",
};

function PriorityCard({
  index,
  title,
  reason,
  href,
  urgency,
}: {
  index: number;
  title: string;
  reason: string;
  href: string;
  urgency: "critical" | "high" | "medium";
}) {
  const cfg = URGENCY_CONFIG[urgency];
  const isHero = index === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.35 }}
    >
      <Link href={href} className="block h-full">
        <div
          className={cn(
            "h-full rounded-xl p-5 border transition-all hover-lift group",
            isHero
              ? "priority-card-hero border-accent/25"
              : "glass border-border hover:border-border/60"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-muted/60">#{index + 1}</span>
            <span className={cn("text-[9px] font-semibold tracking-widest px-2 py-0.5 rounded-full border", cfg.color, cfg.border, cfg.bg)}>
              {cfg.label}
            </span>
          </div>
          <p className={cn(
            "font-semibold leading-snug mb-2",
            isHero ? "text-base text-text-primary" : "text-sm text-text-primary"
          )}>
            {title}
          </p>
          <p className="text-xs text-text-secondary leading-relaxed mb-4">{reason}</p>
          <span className={cn(
            "flex items-center gap-1 text-xs font-medium transition-colors",
            isHero ? "text-accent-bright" : "text-muted group-hover:text-text-primary"
          )}>
            Take action <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function PulseStat({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", accent ? "glass-accent" : "glass border-border")}>
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", accent ? "bg-accent/20" : "bg-surface-2")}>
        <Icon size={14} className={accent ? "text-accent-bright" : "text-muted"} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted truncate">{label}</p>
        <p className={cn("text-sm font-bold leading-tight", accent ? "text-accent-bright" : "text-text-primary")}>{value}</p>
        {sub && <p className="text-[10px] text-muted truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mode, setMode] = useState<FounderMode>("growth");
  const [loaded, setLoaded] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setRevenue(getRevenue());
    setHabits(getHabits());
    setTasks(getTasks());
    setMode(getFounderMode());
    setLoaded(true);

    // Auto-show weekly review on Mondays if not shown this week
    const dayOfWeek = new Date().getDay(); // 1 = Monday
    if (dayOfWeek === 1) {
      const lastReview = getLastWeeklyReview();
      const thisMonday = new Date();
      thisMonday.setDate(thisMonday.getDate() - (thisMonday.getDay() - 1));
      const thisMondayStr = thisMonday.toISOString().slice(0, 10);
      if (!lastReview || lastReview < thisMondayStr) {
        setTimeout(() => setShowWeeklyReview(true), 800);
      }
    }
  }, []);

  const todayStr = today();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const thisMonthRevenue = revenue
    .filter((r) => r.date.startsWith(currentMonth))
    .reduce((s, r) => s + r.amount, 0);

  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const disciplineScore = calcDisciplineScore(todayStr);
  const momentumScore = calcMomentumScore(todayStr);

  const todayHabit = habits.find((h) => h.date === todayStr);

  const streak = (() => {
    let count = 0;
    const sorted = [...habits].sort((a, b) => b.date.localeCompare(a.date));
    for (const h of sorted) {
      if (calcDisciplineScore(h.date) >= 30) count++;
      else break;
    }
    return count;
  })();

  const priorities = loaded
    ? generatePriorities(revenue, habits, tasks, profile)
    : [];

  const modeCfg = MODES[mode];

  return (
    <div className="flex flex-col min-h-screen hero-gradient">
      <TopBar />
      {showWeeklyReview && <WeeklyReview onDismiss={() => setShowWeeklyReview(false)} />}

      <div className="flex-1 p-6 lg:p-8 space-y-8 max-w-[1400px] w-full mx-auto">

        {/* ── BRIEFING HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between gap-6"
        >
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold text-text-primary">
                {greet()},{" "}
                <span className="gradient-text">{profile?.name?.split(" ")[0] ?? "Founder"}</span>
              </h1>
              <div className={cn("flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border", modeCfg.cls)}>
                <span>{modeCfg.icon}</span>
                <span>{modeCfg.label} Mode</span>
              </div>
            </div>
            <p className="text-sm text-muted max-w-lg leading-relaxed">
              {MODE_CONTEXT[mode]}
            </p>
            {profile && (
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted pt-1">
                <span>{profile.founderType}</span>
                <span className="text-border">·</span>
                <span>{profile.businessType}</span>
                <span className="text-border">·</span>
                <span>{profile.stage}</span>
                {profile.targetRevenue && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-accent-bright font-medium">Target: {profile.targetRevenue}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Focus Score */}
          <div className="glass rounded-2xl p-4 flex flex-col items-center gap-2 flex-shrink-0 glow-card">
            <p className="text-[9px] text-muted uppercase tracking-widest">Focus Score</p>
            <div className="relative w-16 h-16">
              <svg width="64" height="64" className="-rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#1a1a1a" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none"
                  stroke={momentumScore >= 60 ? "#4a7c59" : momentumScore >= 30 ? "#d4a017" : "#e05252"}
                  strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 26}
                  strokeDashoffset={2 * Math.PI * 26 * (1 - momentumScore / 100)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-text-primary leading-none">{momentumScore}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {streak > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-orange-400 font-medium">
                  <Flame size={9} />
                  {streak}d streak
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── PULSE STRIP ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="grid grid-cols-4 gap-3"
        >
          <PulseStat label="Revenue This Month" value={formatCurrency(thisMonthRevenue)} sub="Track →" icon={TrendingUp} accent />
          <PulseStat label="Tasks Today" value={`${completedToday}/${todayTasks.length}`} sub="completed" icon={Zap} />
          <PulseStat label="Discipline" value={`${disciplineScore}/100`} sub="today's score" icon={Activity} />
          <PulseStat label="Deep Work" value={`${todayHabit?.deepWork ?? 0}h`} sub="logged today" icon={Target} />
        </motion.div>

        {/* ── TODAY'S PRIORITIES ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Today's Priorities</h2>
              <p className="text-xs text-muted mt-0.5">AI-ranked by business impact</p>
            </div>
            <Link href="/dashboard/execution" className="text-[10px] text-muted hover:text-text-primary transition-colors flex items-center gap-1">
              All tasks <ChevronRight size={10} />
            </Link>
          </div>

          {priorities.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {priorities.map((p, i) => (
                <PriorityCard key={i} index={i} {...p} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {[
                { title: "Set your #1 priority", reason: "Add high-priority tasks to unlock AI-ranked priorities", href: "/dashboard/execution", urgency: "critical" as const },
                { title: "Log today's habits", reason: "Discipline tracking activates your momentum score", href: "/dashboard/performance", urgency: "high" as const },
                { title: "Configure your AI", reason: "Add API key in Settings to activate all AI agents", href: "/dashboard/settings", urgency: "medium" as const },
              ].map((p, i) => <PriorityCard key={i} index={i} {...p} />)}
            </div>
          )}
        </div>

        {/* ── MAIN GRID: INTELLIGENCE + SIDEBAR ── */}
        <div className="grid grid-cols-3 gap-6">
          {/* Intelligence Feed */}
          <div className="col-span-2">
            <InsightsFeed maxItems={6} />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="glass rounded-xl p-4">
              <p className="text-xs font-semibold text-text-primary mb-3">Quick Actions</p>
              <div className="space-y-2">
                {[
                  { label: "Decision Engine", desc: "Simulate business decisions", icon: GitBranch, href: "/dashboard/decision", accent: true },
                  { label: "AI Advisor", desc: "Strategic conversation", icon: Bot, href: "/dashboard/advisor" },
                  { label: "Log Revenue", desc: "Track a new entry", icon: TrendingUp, href: "/dashboard/revenue" },
                  { label: "Founder Memory", desc: "Update AI context", icon: Brain, href: "/dashboard/memory" },
                  { label: "Integrations", desc: "Connect Shopify, Meta & more", icon: Link2, href: "/dashboard/integrations" },
                ].map((a) => (
                  <Link key={a.href} href={a.href} className="block">
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all hover-lift group",
                      a.accent
                        ? "glass-accent border-accent/30 hover:border-accent/50"
                        : "border-border hover:border-border/60 hover:bg-surface-2"
                    )}>
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
                        a.accent ? "bg-accent/20" : "bg-surface-2"
                      )}>
                        <a.icon size={12} className={a.accent ? "text-accent-bright" : "text-muted"} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-medium", a.accent ? "text-accent-bright" : "text-text-secondary group-hover:text-text-primary")}>{a.label}</p>
                        <p className="text-[10px] text-muted truncate">{a.desc}</p>
                      </div>
                      <ChevronRight size={11} className="text-muted flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
                <button
                  onClick={() => setShowWeeklyReview(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-border/60 hover:bg-surface-2 transition-all hover-lift group"
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 bg-surface-2">
                    <Calendar size={12} className="text-muted" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-medium text-text-secondary group-hover:text-text-primary">Weekly Review</p>
                    <p className="text-[10px] text-muted">This week's performance recap</p>
                  </div>
                  <ChevronRight size={11} className="text-muted flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Profile context */}
            {profile && (
              <div className="glass rounded-xl p-4">
                <p className="text-xs font-semibold text-text-primary mb-3">Company Context</p>
                <div className="space-y-2 text-xs">
                  {profile.mainBottleneck && (
                    <div className="flex gap-2">
                      <span className="text-muted flex-shrink-0">Bottleneck</span>
                      <span className="text-red-400 font-medium truncate">{profile.mainBottleneck}</span>
                    </div>
                  )}
                  {profile.biggestStrength && (
                    <div className="flex gap-2">
                      <span className="text-muted flex-shrink-0">Strength</span>
                      <span className="text-accent-bright font-medium truncate">{profile.biggestStrength}</span>
                    </div>
                  )}
                  {profile.targetAudience && (
                    <div className="flex gap-2">
                      <span className="text-muted flex-shrink-0">Audience</span>
                      <span className="text-text-secondary truncate">{profile.targetAudience}</span>
                    </div>
                  )}
                  {profile.peakProductivityWindow && (
                    <div className="flex gap-2">
                      <span className="text-muted flex-shrink-0">Peak hrs</span>
                      <span className="text-text-secondary">{profile.peakProductivityWindow}</span>
                    </div>
                  )}
                </div>
                <Link href="/dashboard/memory" className="flex items-center gap-1 mt-3 text-[10px] text-muted hover:text-accent-bright transition-colors">
                  Edit AI context <ChevronRight size={9} />
                </Link>
              </div>
            )}

            {/* Keyboard shortcut hint */}
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-[10px] text-muted mb-1">Pro tip</p>
              <p className="text-xs text-text-secondary">
                Press{" "}
                <kbd className="text-[9px] bg-surface-2 border border-border rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
                {" "}to navigate anywhere instantly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
