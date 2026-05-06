"use client";

import { useState } from "react";
import { FounderProfile } from "@/lib/storage";

interface Props {
  data: Partial<FounderProfile>;
  onNext: (data: Partial<FounderProfile>) => void;
  onBack: () => void;
}

const PLATFORMS = ["Instagram", "LinkedIn", "X / Twitter", "YouTube", "Pinterest", "WhatsApp", "Telegram"];

export default function BrandAudienceStep({ data, onNext, onBack }: Props) {
  const [form, setForm] = useState({
    platforms: data.platforms ?? [] as string[],
    currentFollowers: data.currentFollowers ?? {} as Record<string, string>,
    targetAudience: data.targetAudience ?? "",
    brandPositioning: data.brandPositioning ?? "",
    competitors: data.competitors ?? "",
  });

  const togglePlatform = (p: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    }));
  };

  const setFollowers = (platform: string, val: string) => {
    setForm((prev) => ({
      ...prev,
      currentFollowers: { ...prev.currentFollowers, [platform]: val },
    }));
  };

  const valid = form.platforms.length > 0 && form.targetAudience && form.brandPositioning;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          Brand & <span className="text-accent-bright">Audience</span>
        </h1>
        <p className="text-muted text-sm">Defines your marketing command center and brand metrics.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Active Platforms</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  form.platforms.includes(p)
                    ? "border-accent bg-accent-dim text-accent-bright"
                    : "border-border text-muted hover:text-text-primary"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {form.platforms.length > 0 && (
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Current Followers per Platform</label>
            <div className="grid grid-cols-2 gap-3">
              {form.platforms.map((p) => (
                <div key={p}>
                  <label className="block text-xs text-muted mb-1">{p}</label>
                  <input
                    value={form.currentFollowers[p] ?? ""}
                    onChange={(e) => setFollowers(p, e.target.value)}
                    placeholder="e.g. 2,500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Target Audience</label>
          <input
            value={form.targetAudience}
            onChange={(e) => setForm((p) => ({ ...p, targetAudience: e.target.value }))}
            placeholder="e.g. 18-30 year old fitness-conscious Indians"
          />
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Brand Positioning</label>
          <textarea
            rows={2}
            value={form.brandPositioning}
            onChange={(e) => setForm((p) => ({ ...p, brandPositioning: e.target.value }))}
            placeholder="e.g. Premium athleisure for performance-focused millennials"
            className="resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Top Competitors</label>
          <input
            value={form.competitors}
            onChange={(e) => setForm((p) => ({ ...p, competitors: e.target.value }))}
            placeholder="e.g. Decathlon, Nivia, Zymrat"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3.5 rounded-xl border border-border text-muted text-sm hover:text-text-primary transition-colors">
          ← Back
        </button>
        <button
          onClick={() => valid && onNext(form)}
          disabled={!valid}
          className={`flex-1 py-3.5 rounded-xl font-medium text-sm transition-all ${
            valid ? "bg-accent text-white hover:bg-accent-bright" : "bg-surface-2 text-muted cursor-not-allowed"
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
