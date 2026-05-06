"use client";

import { useEffect, useState } from "react";
import { getOpportunities, setOpportunities, Opportunity } from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { Lightbulb as LightIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { Lightbulb, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { today } from "@/lib/utils";

const CATEGORIES = ["D2C", "SaaS", "Creator Economy", "Real Estate", "AI Tools", "Athleisure", "Consumer Brand", "Services", "Other"];
const PRIORITIES = ["high", "medium", "low"] as const;

const PRIORITY_COLORS = {
  high: "text-red-400 border-red-400/30 bg-red-400/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  low: "text-muted border-border",
};

const TREND_INSIGHTS = [
  { title: "D2C India Boom", body: "India's D2C market is projected to reach $100B by 2025. Tier-2/3 cities are the next growth frontier.", tag: "D2C" },
  { title: "Creator Economy Maturing", body: "Creators with 10K–100K followers (micro-influencers) outperform celebrities in conversion. Niche is king.", tag: "Creator Economy" },
  { title: "AI Tool Adoption Surge", body: "SMBs are rapidly adopting AI tools for ops, content, and customer service. First-mover advantage is real.", tag: "AI Tools" },
  { title: "Premium Athleisure Gap", body: "The mid-premium segment (₹2K–5K range) is underserved by both mass-market and luxury brands in India.", tag: "Athleisure" },
];

export default function IntelligencePage() {
  const [opportunities, setLocalOpps] = useState<Opportunity[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", category: "D2C", description: "", priority: "medium" as Opportunity["priority"] });

  useEffect(() => { setLocalOpps(getOpportunities()); }, []);

  const add = () => {
    if (!form.title) return;
    const opp: Opportunity = { id: Date.now().toString(), ...form, date: today() };
    const updated = [opp, ...opportunities];
    setLocalOpps(updated);
    setOpportunities(updated);
    setForm({ title: "", category: "D2C", description: "", priority: "medium" });
    setShowAdd(false);
  };

  const remove = (id: string) => {
    const updated = opportunities.filter((o) => o.id !== id);
    setLocalOpps(updated);
    setOpportunities(updated);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Opportunity Intelligence" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-start justify-between">
          <SectionHeader title="Opportunity Intelligence" subtitle="Track market trends, white spaces, and competitive signals" />
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-accent-bright transition-colors">
            <Plus size={14} /> Add Opportunity
          </button>
        </div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1">Title</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Opportunity title" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as Opportunity["priority"] }))}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Description / Observation</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What did you observe? What's the opportunity?" className="resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={add} className="bg-accent text-white text-sm px-5 py-2 rounded-lg hover:bg-accent-bright transition-colors">Add</button>
              <button onClick={() => setShowAdd(false)} className="text-muted text-sm px-4 py-2 rounded-lg border border-border">Cancel</button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Your Opportunities</h3>
            {opportunities.length === 0 ? (
              <div className="glass rounded-xl p-6 text-center">
                <p className="text-xs text-muted">No opportunities logged. Start capturing market observations.</p>
              </div>
            ) : (
              opportunities.map((o) => (
                <div key={o.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border capitalize", PRIORITY_COLORS[o.priority])}>{o.priority}</span>
                        <span className="text-[10px] text-muted">{o.category}</span>
                      </div>
                      <p className="text-sm font-medium text-text-primary">{o.title}</p>
                      {o.description && <p className="text-xs text-text-secondary mt-1">{o.description}</p>}
                    </div>
                    <button onClick={() => remove(o.id)} className="text-muted hover:text-red-400 transition-colors ml-3">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Market Intelligence Feed</h3>
            {TREND_INSIGHTS.map((t) => (
              <div key={t.title} className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={12} className="text-accent-bright" />
                  <p className="text-sm font-medium text-text-primary">{t.title}</p>
                  <span className="ml-auto text-[10px] text-muted border border-border rounded px-1.5">{t.tag}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EmbeddedAgent
        agentName="Competitor & Market Intelligence Agent"
        agentIcon={<LightIcon size={13} className="text-accent-bright" />}
        systemPrompt={`You are a market intelligence analyst and competitive strategy expert for Indian D2C, creator, and consumer brands.
Opportunities logged by the founder: ${opportunities.map((o) => o.title + " (" + o.category + ")").join(", ") || "none yet"}.
Your role: Identify market white spaces, analyse competitors, spot emerging trends, and find first-mover opportunities.
Be specific about the Indian market. Give actionable intelligence the founder can act on this week.
Think like a McKinsey analyst meets a startup founder — data-informed and action-oriented.`}
        quickActions={[
          { label: "Analyse my competitors and find gaps", prompt: "Perform a competitive analysis of my market. Identify what my competitors are doing well, where they're weak, and the specific gaps I can exploit to differentiate." },
          { label: "What are the top 3 market opportunities right now?", prompt: "Based on current Indian market trends in D2C and consumer brands, what are the 3 highest-potential white space opportunities I should be looking at right now?" },
          { label: "Find my differentiation strategy", prompt: "Help me find my sharpest differentiation strategy. How should I position myself so I'm not competing on price but on value, identity, and experience?" },
          { label: "What trends should I watch this quarter?", prompt: "What are the 5 most important market and consumer trends I should be tracking this quarter that could impact my business?" },
          { label: "SWOT analysis of my business", prompt: "Run a SWOT analysis of my business based on what you know about my stage, model, and market. Be honest about the weaknesses and threats." },
          { label: "Find a blue ocean opportunity for me", prompt: "Help me find a blue ocean opportunity — a market space where I can create demand rather than compete for existing demand. Think creatively." },
        ]}
      />
    </div>
  );
}
