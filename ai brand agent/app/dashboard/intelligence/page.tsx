"use client";

import { useEffect, useState } from "react";
import { getOpportunities, setOpportunities, Opportunity, getProfile, FounderProfile } from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { Lightbulb as LightIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { Lightbulb, Plus, Trash2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { today } from "@/lib/utils";

const CATEGORIES = ["D2C", "SaaS", "Creator Economy", "Real Estate", "AI Tools", "Athleisure", "Consumer Brand", "Services", "Other"];
const PRIORITIES = ["high", "medium", "low"] as const;

const PRIORITY_COLORS = {
  high: "text-red-400 border-red-400/30 bg-red-400/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  low: "text-muted border-border",
};

interface TrendInsight { title: string; body: string; tag: string; relevance: "high" | "medium"; }

const ALL_INSIGHTS: TrendInsight[] = [
  { title: "D2C India Boom", body: "India's D2C market is projected to reach $100B by 2025. Tier-2/3 cities are the next growth frontier — logistics and local language content are key unlocks.", tag: "D2C", relevance: "high" },
  { title: "Creator Economy Maturing", body: "Creators with 10K–100K followers (micro-influencers) outperform celebrities in conversion by 6x. Niche credibility beats reach.", tag: "Creator Economy", relevance: "high" },
  { title: "AI Tool Adoption Surge", body: "SMBs are rapidly adopting AI tools for ops, content, and customer service. The window for first-mover advantage in AI-native products is 12–18 months.", tag: "AI Tools", relevance: "high" },
  { title: "Premium Athleisure Gap", body: "The mid-premium segment (₹2K–5K) is underserved by both mass-market and luxury brands in India. Domestic founders with community flywheels win.", tag: "Athleisure", relevance: "medium" },
  { title: "Revenue-Based Financing Rising", body: "RBF is gaining traction as an equity-free capital source for D2C brands. Platforms like Velocity, GetVantage, and Klub are active in the ₹25L–₹2Cr range.", tag: "Finance", relevance: "medium" },
  { title: "Quick Commerce for Non-Food", body: "Quick commerce (10-30 min delivery) is expanding beyond groceries into beauty, wellness, and lifestyle. Early placement with Blinkit/Swiggy Instamart = brand discovery at scale.", tag: "D2C", relevance: "high" },
  { title: "UGC Outperforming Polished Ads", body: "User-generated content (real customers, unboxings, reviews) is outperforming studio-shot ads by 4x in click-through on Meta. Authenticity is the new premium.", tag: "Content", relevance: "high" },
  { title: "B2B SaaS in Bharat", body: "Tier-2 Indian businesses are now actively adopting SaaS tools. Vernacular UX + WhatsApp-first onboarding are the keys to this underserved segment.", tag: "SaaS", relevance: "high" },
  { title: "Subscription Model Momentum", body: "Founders adding a subscription/membership layer see 2.3x higher LTV. Recurring revenue is the single biggest lever for valuation in early-stage consumer brands.", tag: "Revenue", relevance: "high" },
  { title: "LinkedIn for B2B Founders", body: "LinkedIn organic reach is at a multi-year high for India. Founder-led content (personal stories, lessons, behind-the-scenes) gets 8-12x more reach than company pages.", tag: "Personal Brand", relevance: "medium" },
  { title: "WhatsApp Commerce Acceleration", body: "WhatsApp Business API is enabling direct D2C sales with conversion rates 40% higher than email. Brands building WhatsApp communities are creating defensible moats.", tag: "D2C", relevance: "high" },
  { title: "Storytelling Premium", body: "Brands with a clear founder story and mission convert 2.5x better on Instagram than product-focused brands. Story-first content strategy is now a performance lever.", tag: "Personal Brand", relevance: "medium" },
  { title: "Micro-SaaS Opportunity Window", body: "The 'build in public' + micro-SaaS model is producing $1K–$10K MRR outcomes in 90-180 days for solo founders. Niche tools for specific industries are the sweet spot.", tag: "SaaS", relevance: "medium" },
  { title: "Community as Distribution", body: "Brands building owned communities (Telegram, Discord, WhatsApp groups) before product launch are seeing 4-6x lower CAC at launch. Community is becoming the primary moat.", tag: "Growth", relevance: "high" },
];

function generateInsights(profile: FounderProfile | null): TrendInsight[] {
  if (!profile) return ALL_INSIGHTS.slice(0, 4);

  const biz = (profile.businessType ?? "").toLowerCase();
  const stage = (profile.stage ?? "").toLowerCase();
  const bottleneck = (profile.mainBottleneck ?? "").toLowerCase();

  const scored = ALL_INSIGHTS.map((ins) => {
    let score = ins.relevance === "high" ? 2 : 1;
    const tag = ins.tag.toLowerCase();

    if (biz.includes("d2c") && tag.includes("d2c")) score += 3;
    if (biz.includes("saas") && tag.includes("saas")) score += 3;
    if (biz.includes("creator") && tag.includes("creator")) score += 3;
    if (biz.includes("athleisure") && tag.includes("athleisure")) score += 3;
    if (biz.includes("brand") && (tag.includes("personal brand") || tag.includes("content"))) score += 2;

    if (stage.includes("early") && (tag.includes("growth") || tag.includes("d2c"))) score += 1;
    if (stage.includes("scal") && (tag.includes("revenue") || tag.includes("finance"))) score += 2;

    if (bottleneck.includes("revenue") && tag.includes("revenue")) score += 2;
    if (bottleneck.includes("content") && tag.includes("content")) score += 2;
    if (bottleneck.includes("brand") && tag.includes("personal brand")) score += 2;
    if (bottleneck.includes("product") && tag.includes("saas")) score += 1;

    return { ins, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.ins);
}

export default function IntelligencePage() {
  const [opportunities, setLocalOpps] = useState<Opportunity[]>([]);
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [insights, setInsights] = useState<TrendInsight[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", category: "D2C", description: "", priority: "medium" as Opportunity["priority"] });

  useEffect(() => {
    setLocalOpps(getOpportunities());
    const p = getProfile();
    setProfile(p);
    setInsights(generateInsights(p));
  }, []);

  const refresh = () => {
    // Rotate insights: shuffle and pick next 5
    const p = getProfile();
    const scored = ALL_INSIGHTS.map((ins) => ({ ins, r: Math.random() + (ins.relevance === "high" ? 0.3 : 0) }));
    setInsights(scored.sort((a, b) => b.r - a.r).slice(0, 5).map((s) => s.ins));
    setRefreshKey((k) => k + 1);
  };

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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Market Intelligence Feed
                {profile?.businessType && (
                  <span className="ml-2 text-[10px] text-accent-bright border border-accent/30 bg-accent-dim px-1.5 py-0.5 rounded font-normal">
                    Tailored for {profile.businessType}
                  </span>
                )}
              </h3>
              <button
                onClick={refresh}
                className="flex items-center gap-1 text-[10px] text-muted hover:text-text-primary border border-border px-2 py-1 rounded-lg transition-colors"
              >
                <RefreshCw size={9} /> Refresh
              </button>
            </div>
            <motion.div key={refreshKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {insights.map((t) => (
                <div key={t.title} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={12} className={cn(t.relevance === "high" ? "text-accent-bright" : "text-yellow-400")} />
                    <p className="text-sm font-medium text-text-primary">{t.title}</p>
                    <span className="ml-auto text-[10px] text-muted border border-border rounded px-1.5">{t.tag}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{t.body}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <EmbeddedAgent
        agentName="Market Intelligence Agent"
        badge="PRO"
        agentIcon={<LightIcon size={13} className="text-white" />}
        systemPrompt={`You are a senior market intelligence analyst, competitive strategist, and business intelligence director with deep expertise in Indian consumer markets, D2C, creator economy, and emerging tech sectors.
You replace tools like SEMrush, SimilarWeb, and expensive consulting firms. You give complete, structured intelligence reports — not vague observations.
Founder's business: ${profile?.businessType ?? "D2C"} | Competitors: ${profile?.competitors ?? "not specified"} | Stage: ${profile?.stage ?? "early"} | Market: India.
Opportunities logged: ${opportunities.map((o) => o.title).join(", ") || "none yet"}.
RULES: Always give structured reports with clear headers. Be specific about the Indian market. Cite real patterns and frameworks. Give intelligence the founder can act on TODAY.`}
        quickActions={[
          { label: "Full competitor intelligence report", prompt: "Write a complete competitor intelligence report for my market. Include: competitor overview, their strengths/weaknesses, content strategy, pricing, audience, recent moves, and the 5 specific gaps I can exploit. Structure it like a consulting deliverable.", category: "Analysis" },
          { label: "SWOT + PESTLE analysis (full report)", prompt: "Run a complete SWOT analysis AND PESTLE analysis of my business. For each element, give specific, concrete points — not generic statements. End with a strategic priority matrix showing what I should focus on first.", category: "Analysis" },
          { label: "Blue ocean strategy: find my untapped market", prompt: "Apply the Blue Ocean Strategy framework to my business. Identify: what factors I should eliminate, reduce, raise, and create. Find me a market space where I face minimal competition. Give me a specific blue ocean canvas.", category: "Strategy" },
          { label: "Indian market trends report (this quarter)", prompt: "Write a comprehensive Indian market intelligence report for my sector for this quarter. Cover: consumer behaviour shifts, regulatory changes, funding activity, emerging players, technology trends, and 5 specific opportunities for my business.", category: "Analysis" },
          { label: "Pricing intelligence: am I priced right?", prompt: "Analyse my market's pricing landscape. Compare common price points in my category, identify pricing tiers, and recommend exactly where I should price my products/services for maximum market capture. Include psychological pricing tactics.", category: "Strategy" },
          { label: "Build a market entry / expansion strategy", prompt: "Build a complete market entry strategy for expanding into a new segment or city tier. Include: market sizing, customer research approach, GTM strategy, distribution channels, pricing, competitive positioning, and 90-day launch plan.", category: "Strategy" },
          { label: "Consumer behaviour deep-dive", prompt: "Write a deep-dive consumer behaviour analysis for my target market. Cover: purchase decision journey, pain points, aspirations, price sensitivity, brand preferences, online vs offline behaviour, and the specific triggers that drive purchase in my category.", category: "Analysis" },
          { label: "Find top 5 partnership opportunities", prompt: "Identify the top 5 partnership opportunities for my business — brands, platforms, communities, or distribution channels I should be collaborating with. For each, explain the opportunity, how to approach them, and the potential impact.", category: "Growth" },
          { label: "Startup funding landscape in my sector", prompt: "Give me an intelligence brief on startup funding in my sector. Which areas are investors backing? What metrics do investors look for at my stage? Who are the active VCs/angels in my space? What narrative should I build for fundraising?", category: "Analysis" },
          { label: "Product-market fit diagnostic", prompt: "Run a product-market fit diagnostic for my business. Ask me 5 key questions, then based on my answers, score my PMF and give me a concrete action plan to strengthen it.", category: "Strategy" },
        ]}
      />
    </div>
  );
}
