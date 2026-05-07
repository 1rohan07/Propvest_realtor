"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/storage";
import {
  getBrandNotes, setBrandNotes, getBrandChecklist, setBrandChecklist, BrandNotes,
  getCompetitorLog, setCompetitorLog, CompetitorEntry,
} from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { Sparkles, Plus, Trash2, Check, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { today } from "@/lib/utils";

const CHECKLIST_ITEMS = [
  "Clear brand positioning statement",
  "Consistent visual identity",
  "Defined target audience",
  "Unique brand voice",
  "Strong hero product / service",
  "Social proof & testimonials",
  "Website with clear CTA",
  "Content strategy in place",
];

export default function BrandPage() {
  const [profile, setProfile] = useState<ReturnType<typeof getProfile>>(null);
  const [notes, setNotes] = useState<BrandNotes>({ positioning: "", voice: "", differentiators: "", competitors: "" });
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [competitors, setLocalCompetitors] = useState<CompetitorEntry[]>([]);
  const [showAddComp, setShowAddComp] = useState(false);
  const [compForm, setCompForm] = useState({ name: "", pricing: "", latestMove: "", ourResponse: "" });

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    const savedNotes = getBrandNotes();
    // Pre-fill from profile if brand_notes is empty
    setNotes({
      positioning: savedNotes.positioning || p?.brandPositioning || "",
      voice: savedNotes.voice || "",
      differentiators: savedNotes.differentiators || "",
      competitors: savedNotes.competitors || p?.competitors || "",
    });
    setChecklist(getBrandChecklist());
    setLocalCompetitors(getCompetitorLog());
  }, []);

  const handleNoteBlur = (key: keyof BrandNotes, value: string) => {
    const updated = { ...notes, [key]: value };
    setBrandNotes(updated);
    setSavedNote(key);
    setTimeout(() => setSavedNote(null), 1500);
  };

  const toggleCheck = (item: string) => {
    const updated = { ...checklist, [item]: !checklist[item] };
    setChecklist(updated);
    setBrandChecklist(updated);
  };

  const addCompetitor = () => {
    if (!compForm.name) return;
    const entry: CompetitorEntry = { id: Date.now().toString(), ...compForm, date: today() };
    const updated = [entry, ...competitors];
    setLocalCompetitors(updated);
    setCompetitorLog(updated);
    setCompForm({ name: "", pricing: "", latestMove: "", ourResponse: "" });
    setShowAddComp(false);
  };

  const removeCompetitor = (id: string) => {
    const updated = competitors.filter((c) => c.id !== id);
    setLocalCompetitors(updated);
    setCompetitorLog(updated);
  };

  const checkedCount = CHECKLIST_ITEMS.filter((item) => checklist[item]).length;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Brand Identity" />
      <div className="flex-1 p-6 space-y-6">
        <SectionHeader title="Brand Manager" subtitle="Define and track your brand identity, voice, and competitive position" />

        {/* Brand notes — 2 col grid */}
        <div className="grid grid-cols-2 gap-4">
          {([
            { key: "positioning" as const, label: "Brand Positioning", placeholder: "What do you stand for? Who is it for?" },
            { key: "voice" as const, label: "Brand Voice & Tone", placeholder: "e.g. Bold, aspirational, grounded, premium" },
            { key: "differentiators" as const, label: "Key Differentiators", placeholder: "What makes you different from competitors?" },
            { key: "competitors" as const, label: "Top Competitors", placeholder: "Who are you competing with?" },
          ]).map(({ key, label, placeholder }) => (
            <div key={key} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-accent-bright" />
                  <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
                </div>
                {savedNote === key && (
                  <span className="text-[10px] text-accent-bright flex items-center gap-1">
                    <Check size={9} /> Saved
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={notes[key]}
                onChange={(e) => setNotes((p) => ({ ...p, [key]: e.target.value }))}
                onBlur={(e) => handleNoteBlur(key, e.target.value)}
                placeholder={placeholder}
                className="resize-none text-sm"
              />
            </div>
          ))}
        </div>

        {/* Brand health checklist */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Brand Health Checklist</h3>
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              checkedCount === CHECKLIST_ITEMS.length
                ? "bg-accent-dim text-accent-bright"
                : "text-muted"
            )}>
              {checkedCount}/{CHECKLIST_ITEMS.length} complete
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CHECKLIST_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => toggleCheck(item)}
                className="flex items-center gap-2 text-left group"
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                  checklist[item] ? "bg-accent border-accent" : "border-border group-hover:border-accent/60"
                )}>
                  {checklist[item] && <Check size={9} className="text-white" />}
                </div>
                <span className={cn("text-xs transition-colors", checklist[item] ? "text-text-primary line-through" : "text-text-secondary")}>
                  {item}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Competitor tracker */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Swords size={13} className="text-accent-bright" />
              <h3 className="text-sm font-semibold text-text-primary">Competitor Intelligence</h3>
            </div>
            <button
              onClick={() => setShowAddComp(!showAddComp)}
              className="flex items-center gap-1.5 text-xs text-accent-bright hover:text-accent-bright/80 border border-accent/30 px-2.5 py-1 rounded-lg bg-accent-dim transition-colors"
            >
              <Plus size={11} /> Track Competitor
            </button>
          </div>

          {showAddComp && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3 mb-4 p-4 bg-surface-2 rounded-xl border border-border"
            >
              <div>
                <label className="block text-[10px] text-muted mb-1">Competitor Name</label>
                <input value={compForm.name} onChange={(e) => setCompForm((p) => ({ ...p, name: e.target.value }))} placeholder="Brand name" className="text-sm" />
              </div>
              <div>
                <label className="block text-[10px] text-muted mb-1">Their Pricing</label>
                <input value={compForm.pricing} onChange={(e) => setCompForm((p) => ({ ...p, pricing: e.target.value }))} placeholder="e.g. ₹999–₹4,999" className="text-sm" />
              </div>
              <div>
                <label className="block text-[10px] text-muted mb-1">Latest Move</label>
                <input value={compForm.latestMove} onChange={(e) => setCompForm((p) => ({ ...p, latestMove: e.target.value }))} placeholder="e.g. Launched ambassador program" className="text-sm" />
              </div>
              <div>
                <label className="block text-[10px] text-muted mb-1">Our Response</label>
                <input value={compForm.ourResponse} onChange={(e) => setCompForm((p) => ({ ...p, ourResponse: e.target.value }))} placeholder="How we respond or differentiate" className="text-sm" />
              </div>
              <div className="col-span-2 flex gap-2">
                <button onClick={addCompetitor} className="bg-accent text-white text-xs px-4 py-1.5 rounded-lg hover:bg-accent-bright">Save</button>
                <button onClick={() => setShowAddComp(false)} className="text-muted text-xs px-3 py-1.5 rounded-lg border border-border">Cancel</button>
              </div>
            </motion.div>
          )}

          {competitors.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">No competitors tracked yet. Add one to build your competitive intelligence.</p>
          ) : (
            <div className="space-y-3">
              {competitors.map((c) => (
                <div key={c.id} className="grid grid-cols-4 gap-3 p-3 bg-surface-2 rounded-xl border border-border group">
                  <div>
                    <p className="text-[10px] text-muted mb-0.5">Competitor</p>
                    <p className="text-xs font-semibold text-text-primary">{c.name}</p>
                    <p className="text-[10px] text-muted mt-0.5">{c.pricing}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-muted mb-0.5">Latest Move</p>
                    <p className="text-xs text-text-secondary leading-snug">{c.latestMove || "—"}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[10px] text-muted mb-0.5">Our Response</p>
                    <p className="text-xs text-text-secondary leading-snug">{c.ourResponse || "—"}</p>
                  </div>
                  <div className="flex items-start justify-end">
                    <button onClick={() => removeCompetitor(c.id)} className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EmbeddedAgent
        agentName="Brand Strategy Agent"
        badge="PRO"
        agentIcon={<Sparkles size={13} className="text-white" />}
        systemPrompt={`You are a world-class brand strategist, positioning expert, and creative director with deep expertise in premium Indian consumer brands, D2C, and personal branding.
You replace expensive brand agencies and consulting firms. You think like the strategists who built Boat, Mamaearth, Bombay Shaving Company, and Lenskart.
Brand positioning: ${notes.positioning || "not defined yet"}.
Brand voice: ${notes.voice || "not defined yet"}.
Key differentiators: ${notes.differentiators || "not defined yet"}.
Competitors: ${notes.competitors || "not defined yet"}.
Tracked competitor moves: ${competitors.map((c) => `${c.name} (${c.latestMove})`).join(", ") || "none tracked"}.
RULES: Give complete brand deliverables — not advice. Always produce copy, frameworks, and strategy documents the founder can use immediately. Every response should be structured and professional.`}
        quickActions={[
          { label: "Write my brand positioning statement", prompt: "Write 3 versions of my brand positioning statement — one for investors (clear, market-focused), one for customers (emotional, benefit-focused), and one internal north star. For each, explain why it works and who it's designed to resonate with.", category: "Identity" },
          { label: "Define my brand voice: full personality system", prompt: "Define my complete brand voice and personality system. Include: 5 core brand personality adjectives with definitions, the brand's communication style (formal/informal, bold/calm, etc.), 3 real examples of on-brand vs off-brand writing for social posts and customer emails, and tone guidelines for different contexts (Instagram, LinkedIn, ads, support).", category: "Identity" },
          { label: "Write 7 tagline options (with rationale)", prompt: "Write 7 distinct tagline options for my brand — spanning different angles (functional benefit, emotional aspiration, category disruption, founder voice). For each tagline, write a one-line rationale explaining the strategic intent. Then tell me which 2 you'd recommend and why.", category: "Storytelling" },
          { label: "Craft my brand origin story (full narrative)", prompt: "Craft a compelling brand origin story for me. Include: the founding moment and insight, the problem I set out to solve, what makes this personal, the vision behind it, and a short version (200 words) + long version (500 words) I can use on my website, investor decks, and social media.", category: "Storytelling" },
          { label: "Build my 3 content pillars + content strategy", prompt: "Define my 3 core content pillars based on my brand positioning. For each pillar: name it, explain the strategic purpose, give 5 specific content topic ideas, recommend the ideal format (video/carousel/article), and suggest the posting frequency. Then give me a 4-week content calendar using these pillars.", category: "Content" },
          { label: "Build my ideal customer avatar (full profile)", prompt: "Create a complete ideal customer avatar (ICA) for my brand. Include: demographic profile (age, income, location, occupation), psychographic profile (values, aspirations, identity, lifestyle), pain points my brand solves, purchase triggers and barriers, where they spend time online, what they aspire to be, and what language/words they use. Give me a named persona I can reference.", category: "Identity" },
          { label: "Brand audit: consistency + premium score", prompt: "Audit my brand across all dimensions. Score me on: positioning clarity (1-10), visual consistency (1-10), voice consistency (1-10), customer-facing copy quality (1-10), and overall premium perception (1-10). For any score under 8, give me exactly what to fix and how.", category: "Identity" },
          { label: "Competitive differentiation strategy", prompt: "Run a competitive differentiation analysis. Based on my competitors, identify: the 3 white spaces in my market that no one owns, the 5 ways I can meaningfully differentiate (product, pricing, experience, voice, positioning), and a specific 'category of one' strategy that makes direct comparison to competitors irrelevant.", category: "Positioning" },
          { label: "Build my PR + thought leadership strategy", prompt: "Build a complete PR and thought leadership strategy for my brand. Include: my 3 core narrative angles for media coverage, the top 10 publications/podcasts/communities I should target, how to pitch myself as an expert, a 90-day PR calendar with specific actions, and how to build a thought leadership content engine on LinkedIn.", category: "Growth" },
          { label: "Brand relaunch / refresh playbook", prompt: "I want to rebrand or refresh my brand. Build a complete brand refresh playbook. Include: what to audit before changing anything, how to test new positioning without alienating existing customers, the sequence of changes to make (from easiest to hardest), how to communicate the refresh to existing customers, and a 60-day rollout plan.", category: "Growth" },
        ]}
      />
    </div>
  );
}
