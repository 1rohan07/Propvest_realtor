"use client";

import { useEffect, useState } from "react";
import { getGoals, setGoals } from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { Target as VisionIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { Target, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface Goal {
  title: string;
  target: string;
  deadline: string;
  progress: number;
  category: string;
}

const CATEGORIES = ["Revenue", "Brand", "Product", "Personal", "Team", "Health", "Learning"];

export default function VisionPage() {
  const [goals, setLocalGoals] = useState<Goal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", target: "", deadline: "", progress: 0, category: "Revenue" });

  useEffect(() => { setLocalGoals(getGoals() as Goal[]); }, []);

  const add = () => {
    if (!form.title) return;
    const updated = [...goals, form];
    setLocalGoals(updated);
    setGoals(updated);
    setForm({ title: "", target: "", deadline: "", progress: 0, category: "Revenue" });
    setShowAdd(false);
  };

  const updateProgress = (i: number, progress: number) => {
    const updated = goals.map((g, idx) => idx === i ? { ...g, progress } : g);
    setLocalGoals(updated);
    setGoals(updated);
  };

  const remove = (i: number) => {
    const updated = goals.filter((_, idx) => idx !== i);
    setLocalGoals(updated);
    setGoals(updated);
  };

  const TIMELINE = [
    { label: "30-Day Sprint", goals: goals.filter((g) => g.category !== "Personal").slice(0, 2) },
    { label: "90-Day Plan", goals: goals.filter((g) => g.category === "Revenue") },
    { label: "1-Year Vision", goals: goals },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Vision & Goals" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-start justify-between">
          <SectionHeader title="Vision & Long-Term Goals" subtitle="Track your 30-day sprints, 90-day plans, and 1-year vision" />
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-accent-bright transition-colors">
            <Plus size={14} /> Add Goal
          </button>
        </div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-xs text-muted mb-1">Goal</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Reach ₹5L revenue" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Target / Metric</label>
                <input value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))} placeholder="e.g. ₹5,00,000" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Initial Progress (%)</label>
                <input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm((p) => ({ ...p, progress: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={add} className="bg-accent text-white text-sm px-5 py-2 rounded-lg hover:bg-accent-bright">Add Goal</button>
              <button onClick={() => setShowAdd(false)} className="text-muted text-sm px-4 py-2 rounded-lg border border-border">Cancel</button>
            </div>
          </motion.div>
        )}

        {goals.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <Target size={24} className="text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">No goals set yet. Add your first goal to start tracking your vision.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((g, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">{g.category}</span>
                      {g.deadline && <span className="text-[10px] text-muted">Due: {g.deadline}</span>}
                    </div>
                    <p className="text-sm font-semibold text-text-primary">{g.title}</p>
                    {g.target && <p className="text-xs text-muted mt-0.5">Target: {g.target}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-accent-bright">{g.progress}%</span>
                    <button onClick={() => remove(i)} className="text-muted hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${g.progress}%` }} />
                  </div>
                  <input
                    type="range" min={0} max={100} value={g.progress}
                    onChange={(e) => updateProgress(i, parseInt(e.target.value))}
                    className="w-20 accent-accent h-1 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EmbeddedAgent
        agentName="Vision & Strategy Agent"
        agentIcon={<VisionIcon size={13} className="text-accent-bright" />}
        systemPrompt={`You are a long-term strategy and vision architect for a high-ambition founder.
Current goals: ${goals.map((g) => g.title + " → " + g.target + " (" + g.progress + "% done)").join("; ") || "no goals set yet"}.
Your role: Help the founder build clarity on long-term vision, break it into 30/90/365-day strategies, and identify the critical path to their biggest goals.
Think like a founder coach who has scaled companies from zero to crore. Be visionary but grounded.`}
        quickActions={[
          { label: "Build my 90-day strategic plan", prompt: "Build a detailed 90-day strategic plan for my business. Break it into monthly milestones, weekly priorities, and the 3 non-negotiable outcomes I must achieve." },
          { label: "Define my 1-year vision clearly", prompt: "Help me get crystal clear on my 1-year vision. Where should my business, brand, and personal life be exactly 12 months from now? Make it specific and measurable." },
          { label: "Find the critical path to my biggest goal", prompt: "Look at my goals and identify the critical path — the exact sequence of actions that will get me to my most important goal the fastest." },
          { label: "Am I working on the right things?", prompt: "Audit my current goals and tell me honestly — are these the right things to focus on for maximum leverage? What am I missing? What should I drop?" },
          { label: "Write my 5-year founder vision", prompt: "Help me articulate a compelling 5-year founder vision — what I'm building, why it matters, and what success looks like at scale." },
        ]}
      />
    </div>
  );
}
