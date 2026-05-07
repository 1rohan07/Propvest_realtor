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
        badge="PRO"
        agentIcon={<VisionIcon size={13} className="text-white" />}
        systemPrompt={`You are a world-class strategy architect, venture builder, and long-term vision coach who has helped founders scale from zero to crore. You replace expensive strategy consultants and board advisors.
Current goals tracked: ${goals.map((g) => g.title + " → " + g.target + " (" + g.progress + "% done, deadline: " + (g.deadline || "none") + ")").join("; ") || "no goals set yet"}.
RULES: Be visionary but brutally grounded. Give structured strategic frameworks, not generic inspiration. Always produce deliverables — plans, frameworks, roadmaps — that the founder can act on immediately. Structure every response with clear headers, timelines, and specific metrics.`}
        quickActions={[
          { label: "Build my complete 90-day strategic plan", prompt: "Build a complete 90-day strategic plan for my business. Structure it as: Month 1 (Foundation) with week-by-week priorities, Month 2 (Acceleration) with specific milestones, Month 3 (Scale) with targets. Include the 3 non-negotiable outcomes for each month, the key constraints I must solve, and what success looks like on Day 90.", category: "Planning" },
          { label: "Define my 1-year vision (measurable + specific)", prompt: "Help me define my 1-year vision across 5 dimensions: Revenue (specific number + how), Brand (reach, recognition, positioning), Product (what we'll have built), Team (who is on the team and in what roles), and Personal (how I'll have grown as a founder). Make every goal specific, measurable, and time-bound.", category: "Planning" },
          { label: "Write my 5-year founder vision statement", prompt: "Help me articulate my 5-year founder vision. Include: what the company will be at scale (revenue, team, product), the market position we'll own, the impact we'll have created, what my role will look like, and a 200-word vision statement I can use in investor conversations, team hiring, and as my personal north star.", category: "Planning" },
          { label: "Find the critical path to my biggest goal", prompt: "Analyse my goals and identify the critical path — the specific sequence of milestones that, if achieved in order, will get me to my most important goal the fastest. Map out: what must happen first, what's blocking what, what I can parallelise, and where a single bottleneck is holding back multiple goals.", category: "Strategy" },
          { label: "Strategic audit: am I working on the right things?", prompt: "Run a strategic audit of my current goals and focus areas. Tell me honestly: which goals are high-leverage and correct, which are distractions or vanity metrics, what critical goal I'm missing that I should add, and what I should stop working on immediately. Apply the 'if this were my only focus' test to each goal.", category: "Strategy" },
          { label: "Pivot analysis: when and how to pivot", prompt: "Run a pivot analysis for my business. Include: the 5 signals that indicate it's time to pivot (vs persist), how to evaluate whether my current model is working, 3 potential pivot directions for my business based on my assets and market, and a decision framework for making the pivot decision without letting sunk-cost bias drive it.", category: "Strategy" },
          { label: "Build my fundraising narrative + investor story", prompt: "Build a complete fundraising narrative for my business. Include: the market problem and size (TAM/SAM/SOM), my solution and unfair advantage, traction proof points, business model and unit economics, the team story, what I'm raising and how it will be used, and 5 likely investor objections with responses. Format it as a pitch narrative I can tell in 10 minutes.", category: "Fundraising" },
          { label: "Investor targeting strategy: who should I pitch?", prompt: "Build an investor targeting strategy for my stage and sector. Include: which type of investor is right for me (angel, pre-seed VC, micro-VC, accelerator), which specific funds and angels in India invest in my category, how to get introductions (warm vs cold outreach), and a 60-day fundraising sprint plan.", category: "Fundraising" },
          { label: "Team & hiring roadmap (next 12 months)", prompt: "Build my team and hiring roadmap for the next 12 months. Include: the first 3 hires I should make and in what order, the exact role profile for each (responsibilities, must-have skills, red flags), where to find them in India, how to structure comp with limited cash (equity, performance bonuses), and how to build culture from the first hire.", category: "Leadership" },
          { label: "Personal board of directors: who do I need?", prompt: "Help me design my personal board of directors — the advisors, mentors, and connectors who will help me reach my goals. Include: the 5 types of people every ambitious founder needs in their corner (industry operator, functional expert, investor, peer founder, personal coach), where to find them in India, how to approach them, and what to offer in exchange for their time.", category: "Leadership" },
        ]}
      />
    </div>
  );
}
