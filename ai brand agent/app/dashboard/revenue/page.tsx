"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { addRevenue, getRevenue, RevenueEntry } from "@/lib/storage";
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
  const [form, setForm] = useState({ date: today(), amount: "", source: "Product Sales", note: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setEntries(getRevenue()); }, []);

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
        agentName="Revenue Agent"
        agentIcon={<TrendIcon size={13} className="text-accent-bright" />}
        systemPrompt={`You are an elite revenue strategist for a founder. Analyse their revenue data and give sharp, specific growth advice.
Revenue entries: ${entries.length} logged. Total: ₹${totalRevenue.toLocaleString("en-IN")}. This month: ₹${thisMonth.toLocaleString("en-IN")}.
Revenue sources: ${bySource.map((s) => s.source + ": ₹" + s.amount.toLocaleString("en-IN")).join(", ") || "Not logged yet"}.
Focus on: revenue growth levers, pricing, upsells, conversion, product mix, and reducing dependency on one source.
Be direct. Give revenue tactics, not motivation.`}
        quickActions={[
          { label: "Forecast my next month revenue", prompt: "Based on my current revenue trend, forecast what I should realistically hit next month and what I need to do to get there." },
          { label: "Find my highest ROI revenue activity", prompt: "Analyse my revenue sources and tell me which activity or product is generating the best return. What should I double down on?" },
          { label: "Give me 3 upsell ideas for my business", prompt: "Based on my business type and current revenue, give me 3 specific upsell or cross-sell ideas I can implement this week." },
          { label: "Build a pricing strategy for my products", prompt: "Help me build a stronger pricing strategy. How should I position my price points to maximise revenue without losing customers?" },
          { label: "How do I hit ₹1L/month faster?", prompt: "Give me a concrete 30-day plan to accelerate my revenue growth toward ₹1 lakh per month." },
        ]}
      />
    </div>
  );
}
