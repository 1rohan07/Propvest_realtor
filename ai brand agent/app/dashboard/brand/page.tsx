"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/storage";
import { FounderProfile } from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { Sparkles as SparkIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { Sparkles } from "lucide-react";

export default function BrandPage() {
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [notes, setNotes] = useState({ positioning: "", voice: "", differentiators: "", competitors: "" });

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    if (p) {
      setNotes({
        positioning: p.brandPositioning ?? "",
        voice: "",
        differentiators: "",
        competitors: p.competitors ?? "",
      });
    }
  }, []);

  const set = (k: string, v: string) => setNotes((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Brand Identity" />
      <div className="flex-1 p-6 space-y-6">
        <SectionHeader title="Brand Manager" subtitle="Define and track your brand identity, voice, and competitive position" />

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "positioning", label: "Brand Positioning", placeholder: "What do you stand for? Who is it for?" },
            { key: "voice", label: "Brand Voice & Tone", placeholder: "e.g. Bold, aspirational, grounded, premium" },
            { key: "differentiators", label: "Key Differentiators", placeholder: "What makes you different from competitors?" },
            { key: "competitors", label: "Top Competitors", placeholder: "Who are you competing with?" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={13} className="text-accent-bright" />
                <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
              </div>
              <textarea
                rows={4}
                value={(notes as any)[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="resize-none text-sm"
              />
            </div>
          ))}
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Brand Health Checklist</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              "Clear brand positioning statement",
              "Consistent visual identity",
              "Defined target audience",
              "Unique brand voice",
              "Strong hero product / service",
              "Social proof & testimonials",
              "Website with clear CTA",
              "Content strategy in place",
            ].map((item) => (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 accent-accent rounded" />
                <span className="text-xs text-text-secondary">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <EmbeddedAgent
        agentName="Brand Strategy Agent"
        badge="PRO"
        agentIcon={<SparkIcon size={13} className="text-white" />}
        systemPrompt={`You are a world-class brand strategist, positioning expert, and creative director with deep expertise in premium Indian consumer brands, D2C, and personal branding.
You replace expensive brand agencies and consulting firms. You think like the strategists who built Boat, Mamaearth, Bombay Shaving Company, and Lenskart.
Brand positioning: ${notes.positioning || "not defined yet"}.
Brand voice: ${notes.voice || "not defined yet"}.
Key differentiators: ${notes.differentiators || "not defined yet"}.
Competitors: ${notes.competitors || "not defined yet"}.
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
