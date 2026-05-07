"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { addRevenue, getRevenue, RevenueEntry, getProfile, FounderProfile } from "@/lib/storage";
import { formatCurrency, today, getLast30Days, dayLabel } from "@/lib/utils";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { TrendingUp as TrendIcon } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import SectionHeader from "@/components/ui/SectionHeader";
import { TrendingUp, Plus, IndianRupee } from "lucide-react";

const SOURCES = ["Product Sales", "Services", "Consulting", "Subscriptions", "Affiliate", "Other"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs">
        <p className="text-muted">{label}</p>
        <p className="text-accent-bright font-semibold">{formatCurrency(payload[0].value)}</p>
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

  const last30 = getLast30Days().reverse();
  const chartData = last30.map((d) => ({
    date: dayLabel(d),
    revenue: entries.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0),
    fullDate: d,
  }));

  const totalRevenue = entries.reduce((s, e) => s + e.amount, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonth = entries.filter((e) => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0);
  const lastMonthStr = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
  const lastMonth = entries.filter((e) => e.date.startsWith(lastMonthStr)).reduce((s, e) => s + e.amount, 0);
  const mom = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  const bySource = SOURCES.map((s) => ({
    source: s,
    amount: entries.filter((e) => e.source === s).reduce((sum, e) => sum + e.amount, 0),
  })).filter((s) => s.amount > 0);

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

        <div className="grid grid-cols-4 gap-4">
          <KPICard label="Total Revenue" value={formatCurrency(totalRevenue)} accent icon={<IndianRupee size={14} />} />
          <KPICard label="This Month" value={formatCurrency(thisMonth)} trend={mom} icon={<TrendingUp size={14} />} />
          <KPICard label="Last Month" value={formatCurrency(lastMonth)} />
          <KPICard label="Entries Logged" value={entries.length} sub="Revenue records" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">30-Day Revenue Trend</h3>
            {entries.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-xs text-muted">Log your first revenue entry to see the chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#4a7c59" radius={[3, 3, 0, 0]} />
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
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${(s.amount / totalRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
Revenue logged: ${entries.length} entries | Total: ₹${totalRevenue.toLocaleString("en-IN")} | This month: ₹${thisMonth.toLocaleString("en-IN")} | MoM growth: ${mom > 0 ? "+" : ""}${mom}% | Sources: ${bySource.map((s) => s.source + " ₹" + s.amount.toLocaleString("en-IN")).join(", ") || "none logged"}.
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
