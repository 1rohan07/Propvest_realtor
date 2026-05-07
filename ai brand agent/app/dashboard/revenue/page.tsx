"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  AreaChart, Area, Legend
} from "recharts";
import { addRevenue, getRevenue, RevenueEntry, getProfile, FounderProfile } from "@/lib/storage";
import { formatCurrency, today, getLast30Days, getLast90Days, dayLabel, shortDate } from "@/lib/utils";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { TrendingUp as TrendIcon } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { TrendingUp, Plus, IndianRupee, Target } from "lucide-react";

const SOURCES = ["Product Sales", "Services", "Consulting", "Subscriptions", "Affiliate", "Other"];

const SOURCE_COLORS: Record<string, string> = {
  "Product Sales": "#4a7c59",
  "Services":      "#6aaf7e",
  "Consulting":    "#3b82f6",
  "Subscriptions": "#8b5cf6",
  "Affiliate":     "#f59e0b",
  "Other":         "#6b7280",
};

type Period = "30d" | "90d" | "all";

function parseTargetRevenue(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[₹,\s]/g, "").replace(/[Ll]$/i, "000000").replace(/[Kk]$/i, "000");
  return parseFloat(cleaned) || 0;
}

function daysInMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function daysElapsedThisMonth(): number {
  return new Date().getDate();
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs space-y-1">
        <p className="text-muted">{label}</p>
        {payload.map((p: any) => p.value > 0 && (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
        {payload.length > 1 && <p className="text-accent-bright font-semibold border-t border-border pt-1">Total: {formatCurrency(total)}</p>}
      </div>
    );
  }
  return null;
};

export default function RevenuePage() {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [form, setForm] = useState({ date: today(), amount: "", source: "Product Sales", note: "" });
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<Period>("30d");
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set());

  useEffect(() => {
    setEntries(getRevenue());
    setProfile(getProfile());
  }, []);

  const handleAdd = () => {
    if (!form.amount) return;
    const entry: RevenueEntry = {
      date: form.date,
      amount: parseFloat(form.amount),
      source: form.source,
      note: form.note,
    };
    addRevenue(entry);
    setEntries(getRevenue());
    setForm({ date: today(), amount: "", source: "Product Sales", note: "" });
    setShowForm(false);
  };

  // Period-based date range
  const periodDates = period === "30d"
    ? getLast30Days().reverse()
    : period === "90d"
    ? getLast90Days().reverse()
    : (() => {
        if (entries.length === 0) return getLast30Days().reverse();
        const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
        const start = new Date(sorted[0].date);
        const end = new Date();
        const dates: string[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().slice(0, 10));
        }
        return dates;
      })();

  // Bar chart data (daily revenue for selected period)
  const chartData = periodDates.map((d) => ({
    date: period === "all" ? shortDate(d) : dayLabel(d),
    revenue: entries.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0),
    fullDate: d,
  }));

  // For "all" period, group by week to avoid too many bars
  const barData = period === "all" && chartData.length > 60
    ? (() => {
        const weeks: { date: string; revenue: number }[] = [];
        for (let i = 0; i < chartData.length; i += 7) {
          const chunk = chartData.slice(i, i + 7);
          weeks.push({
            date: chunk[0].date,
            revenue: chunk.reduce((s, c) => s + c.revenue, 0),
          });
        }
        return weeks;
      })()
    : chartData;

  // Stacked area chart data by source
  const activeSources = SOURCES.filter((s) =>
    entries.some((e) => e.source === s && periodDates.includes(e.date))
  );

  const stackedData = periodDates
    .filter((_, i) => period === "all" ? i % 3 === 0 : true) // thin out for all-time
    .map((d) => {
      const row: Record<string, any> = { date: period === "all" ? shortDate(d) : dayLabel(d) };
      for (const src of activeSources) {
        row[src] = entries.filter((e) => e.date === d && e.source === src).reduce((s, e) => s + e.amount, 0);
      }
      return row;
    });

  // KPIs
  const totalRevenue = entries.reduce((s, e) => s + e.amount, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonth = entries.filter((e) => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0);
  const lastMonthStr = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  const lastMonth = entries.filter((e) => e.date.startsWith(lastMonthStr)).reduce((s, e) => s + e.amount, 0);
  const mom = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  // Target + forecast (A1)
  const targetRevenue = parseTargetRevenue(profile?.targetRevenue);
  const monthlyTarget = targetRevenue > 12000 ? Math.round(targetRevenue / 12) : targetRevenue;
  const elapsed = daysElapsedThisMonth();
  const total = daysInMonth();
  const projectedMonthly = elapsed > 0 ? Math.round((thisMonth / elapsed) * total) : 0;
  const targetProgress = monthlyTarget > 0 ? Math.min(Math.round((thisMonth / monthlyTarget) * 100), 100) : 0;
  const onTrack = projectedMonthly >= monthlyTarget * 0.8;
  const forecastColor = projectedMonthly >= monthlyTarget ? "text-accent-bright" : projectedMonthly >= monthlyTarget * 0.8 ? "text-yellow-400" : "text-red-400";
  const forecastBarColor = projectedMonthly >= monthlyTarget ? "bg-accent" : projectedMonthly >= monthlyTarget * 0.8 ? "bg-yellow-400" : "bg-red-400";

  const bySource = SOURCES.map((s) => ({
    source: s,
    amount: entries.filter((e) => e.source === s).reduce((sum, e) => sum + e.amount, 0),
  })).filter((s) => s.amount > 0);

  const toggleSource = (src: string) => {
    setHiddenSources((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  };

  const PERIOD_TABS: { key: Period; label: string }[] = [
    { key: "30d", label: "30 Days" },
    { key: "90d", label: "90 Days" },
    { key: "all", label: "All Time" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Revenue Command Center" />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <SectionHeader title="Revenue Intelligence" subtitle="Track every rupee, find your growth pattern" />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-accent-bright transition-colors"
          >
            <Plus size={14} /> Log Revenue
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-5 grid grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-xs text-muted mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Amount (₹)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="5000" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Source</label>
              <select value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Note</label>
              <input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Optional note" />
            </div>
            <div className="col-span-4 flex gap-3">
              <button onClick={handleAdd} className="bg-accent text-white text-sm px-6 py-2 rounded-lg hover:bg-accent-bright transition-colors">
                Save Entry
              </button>
              <button onClick={() => setShowForm(false)} className="text-muted text-sm px-4 py-2 rounded-lg border border-border hover:text-text-primary transition-colors">
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Total Revenue" value={formatCurrency(totalRevenue)} accent icon={<IndianRupee size={14} />} />
          <KPICard
            label="This Month"
            value={formatCurrency(thisMonth)}
            trend={mom}
            sub={mom !== 0 ? `${mom > 0 ? "+" : ""}${mom}% vs last month` : undefined}
            icon={<TrendingUp size={14} />}
          />
          <KPICard label="Last Month" value={formatCurrency(lastMonth)} />
          <KPICard label="Entries Logged" value={entries.length} sub="Revenue records" />
        </div>

        {/* Forecast + Target bar (A1 + C1) */}
        {monthlyTarget > 0 && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={13} className="text-accent-bright" />
              <h3 className="text-sm font-semibold text-text-primary">Monthly Revenue Forecast</h3>
              <span className={cn("ml-auto text-xs font-semibold", forecastColor)}>
                On pace for {formatCurrency(projectedMonthly)} this month
              </span>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-4">
              <div>
                <p className="text-[10px] text-muted mb-1">This Month So Far</p>
                <p className="text-base font-bold text-text-primary">{formatCurrency(thisMonth)}</p>
                <p className="text-[10px] text-muted mt-0.5">Day {elapsed} of {total}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted mb-1">Monthly Target</p>
                <p className="text-base font-bold text-text-primary">{formatCurrency(monthlyTarget)}</p>
                <p className="text-[10px] text-muted mt-0.5">{targetProgress}% achieved</p>
              </div>
              <div>
                <p className="text-[10px] text-muted mb-1">Projected End-of-Month</p>
                <p className={cn("text-base font-bold", forecastColor)}>{formatCurrency(projectedMonthly)}</p>
                <p className={cn("text-[10px] mt-0.5", onTrack ? "text-accent-bright" : "text-red-400")}>
                  {onTrack ? "On track" : `₹${(monthlyTarget - projectedMonthly).toLocaleString("en-IN")} gap`}
                </p>
              </div>
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", forecastBarColor)}
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Period toggle + bar chart */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Revenue Trend</h3>
              <div className="flex gap-1">
                {PERIOD_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setPeriod(t.key)}
                    className={cn(
                      "text-xs px-3 py-1 rounded-lg border transition-colors",
                      period === t.key
                        ? "border-accent bg-accent-dim text-accent-bright"
                        : "border-border text-muted hover:text-text-primary"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {entries.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-xs text-muted">Log your first revenue entry to see the chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} interval={period === "30d" ? 4 : period === "90d" ? 13 : "preserveStartEnd"} />
                  <YAxis tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + "k" : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#4a7c59" radius={[3, 3, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue by Source</h3>
            {bySource.length === 0 ? (
              <p className="text-xs text-muted">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {bySource.map((s) => (
                  <div key={s.source}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary">{s.source}</span>
                      <span className="text-text-primary font-medium">{formatCurrency(s.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.amount / totalRevenue) * 100}%`,
                          backgroundColor: SOURCE_COLORS[s.source] ?? "#4a7c59",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stacked area chart by source (A5) */}
        {activeSources.length > 1 && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-text-primary">Revenue Breakdown by Source</h3>
              <p className="text-[10px] text-muted">Click legend to toggle sources</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {activeSources.map((src) => (
                <button
                  key={src}
                  onClick={() => toggleSource(src)}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                    hiddenSources.has(src)
                      ? "border-border text-muted"
                      : "border-transparent text-white"
                  )}
                  style={hiddenSources.has(src) ? {} : { backgroundColor: SOURCE_COLORS[src] ?? "#4a7c59" }}
                >
                  {src}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stackedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + "k" : v}`} />
                <Tooltip content={<CustomTooltip />} />
                {activeSources.filter((s) => !hiddenSources.has(s)).map((src) => (
                  <Area
                    key={src}
                    type="monotone"
                    dataKey={src}
                    stackId="1"
                    stroke={SOURCE_COLORS[src] ?? "#4a7c59"}
                    fill={SOURCE_COLORS[src] ?? "#4a7c59"}
                    fillOpacity={0.6}
                    strokeWidth={1.5}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Entries</h3>
          {entries.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">No revenue logged yet. Click "Log Revenue" to start.</p>
          ) : (
            <div className="space-y-2">
              {entries.slice(0, 10).map((e, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-text-primary">{e.source}</p>
                    {e.note && <p className="text-xs text-muted">{e.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-accent-bright">{formatCurrency(e.amount)}</p>
                    <p className="text-xs text-muted">{e.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EmbeddedAgent
        agentName="Revenue Growth Agent"
        badge="PRO"
        agentIcon={<TrendIcon size={13} className="text-white" />}
        systemPrompt={`You are a world-class revenue strategist, pricing architect, and growth consultant. You replace expensive financial advisors and business consultants.
Founder's data: Business type: ${profile?.businessType ?? "D2C"} | Stage: ${profile?.stage ?? "early"} | Revenue target: ${profile?.targetRevenue ?? "not set"} | Team: ${profile?.teamSize ?? "solo"} | AOV: ${profile?.avgOrderValue ?? "unknown"}.
Revenue logged: ${entries.length} entries | Total: ₹${totalRevenue.toLocaleString("en-IN")} | This month: ₹${thisMonth.toLocaleString("en-IN")} | MoM growth: ${mom > 0 ? "+" : ""}${mom}% | Projected month-end: ₹${projectedMonthly.toLocaleString("en-IN")} | Sources: ${bySource.map((s) => s.source + " ₹" + s.amount.toLocaleString("en-IN")).join(", ") || "none logged"}.
RULES: Give specific numbers, frameworks, and action plans. Never give generic advice. Always give a complete, structured response with clear action steps. You are the founder's CFO + revenue consultant in one.`}
        quickActions={[
          { label: "Full revenue growth plan (30-60-90 days)", prompt: "Build a complete 30-60-90 day revenue growth plan for my business. For each phase: specific revenue target, top 3 activities, key metrics to track, and what success looks like. Make it specific to my current stage and revenue.", category: "Strategy" },
          { label: "Pricing architecture: full rebuild", prompt: "Redesign my entire pricing architecture. Analyse my current AOV, suggest optimal price points, create a good-better-best tier structure, identify where I'm leaving money on the table, and give me a pricing rollout plan.", category: "Finance" },
          { label: "Build a complete upsell & cross-sell funnel", prompt: "Design a complete upsell and cross-sell system for my business. Include: when to offer upsells (pre-purchase, post-purchase, at checkout), what to offer, how to present it, and realistic revenue uplift I can expect.", category: "Growth" },
          { label: "Revenue diversification strategy", prompt: "My revenue is too concentrated. Build a revenue diversification strategy with 3-5 new income streams I can add in the next 90 days. For each: how to launch it, expected revenue, effort required, and timeline.", category: "Strategy" },
          { label: "Customer LTV maximisation playbook", prompt: "Build a complete customer lifetime value maximisation playbook. Include: how to calculate my current LTV, strategies to increase repeat purchase rate, loyalty programme design, reactivation campaigns for churned customers, and 90-day implementation plan.", category: "Growth" },
          { label: "Sales conversion rate audit + fixes", prompt: "Run a conversion rate audit for my business. Identify the top 5 places where I'm losing customers (awareness → consideration → purchase → retention). For each leakage point, give me specific fixes I can implement this week.", category: "Finance" },
          { label: "Build a cash flow management system", prompt: "Build a simple but effective cash flow management system for my stage. Include: what to track weekly, how to forecast 60 days ahead, when to reinvest vs save, and how to avoid cash crunches. Give me a framework I can run in a spreadsheet.", category: "Finance" },
          { label: "Unit economics deep-dive", prompt: "Run a complete unit economics analysis for my business. Calculate or estimate: CAC, LTV, LTV:CAC ratio, payback period, gross margin, and contribution margin. Tell me if my unit economics are healthy and exactly what to fix if not.", category: "Finance" },
          { label: "How to close ₹1 lakh in the next 30 days", prompt: "Give me a specific, day-by-day action plan to close ₹1 lakh in revenue in the next 30 days. Include: who to contact, what to offer, how to pitch, and what activities to prioritise each week.", category: "Growth" },
          { label: "Build a recurring revenue stream", prompt: "Help me design a subscription or retainer model for my business to create predictable recurring revenue. Include: what to offer, pricing, how to sell it, how to retain subscribers, and realistic MRR targets for month 1, 3, and 6.", category: "Strategy" },
        ]}
      />
    </div>
  );
}
