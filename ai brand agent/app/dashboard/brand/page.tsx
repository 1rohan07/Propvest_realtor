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
        agentIcon={<SparkIcon size={13} className="text-accent-bright" />}
        systemPrompt={`You are a world-class brand strategist specialising in premium Indian consumer and D2C brands.
Brand positioning: ${notes.positioning || "not defined yet"}.
Brand voice: ${notes.voice || "not defined yet"}.
Differentiators: ${notes.differentiators || "not defined yet"}.
Competitors: ${notes.competitors || "not defined yet"}.
Your role: Help sharpen the brand identity, define the voice, create positioning statements, taglines, and brand story.
Think like a strategist who built brands like Boat, Mamaearth, and Bombay Shaving Company.`}
        quickActions={[
          { label: "Write my brand positioning statement", prompt: "Write a razor-sharp brand positioning statement for my business. It should define who I serve, what I offer, and why I'm different in one powerful sentence." },
          { label: "Define my brand voice and tone", prompt: "Define my brand voice and tone with 5 specific adjectives. Then show me examples of how I should and shouldn't sound in social posts, ads, and customer communication." },
          { label: "Write 5 tagline options for my brand", prompt: "Write 5 strong tagline options for my brand. Make them memorable, differentiated, and emotionally resonant." },
          { label: "Build my brand story (origin + mission)", prompt: "Help me craft a compelling brand story — the origin, the why, the mission, and the vision. Make it authentic and emotionally connecting." },
          { label: "Audit my brand consistency", prompt: "Audit my brand consistency. Based on my positioning and voice, tell me what I should fix to make my brand feel more cohesive and premium." },
          { label: "Create my ideal customer avatar", prompt: "Build a detailed ideal customer avatar for my brand — demographics, psychographics, aspirations, pain points, and what makes them buy." },
        ]}
      />
    </div>
  );
}
