"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/storage";
import { FounderProfile } from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
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
    </div>
  );
}
