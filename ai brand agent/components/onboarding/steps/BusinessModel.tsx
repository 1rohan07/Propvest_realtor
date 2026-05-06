"use client";

import { useState } from "react";
import { FounderProfile } from "@/lib/storage";

interface Props {
  data: Partial<FounderProfile>;
  onNext: (data: Partial<FounderProfile>) => void;
  onBack: () => void;
}

const BUSINESS_TYPES = ["D2C Brand", "SaaS", "Agency", "Creator / Personal Brand", "Marketplace", "Services", "Consulting", "Retail", "Manufacturing"];
const CHANNELS = ["Instagram / Meta Ads", "WhatsApp / DMs", "Website / SEO", "Word of Mouth", "Influencer Collabs", "Amazon / Meesho", "LinkedIn Outreach", "Cold Calling", "Retail Distribution"];

export default function BusinessModelStep({ data, onNext, onBack }: Props) {
  const [form, setForm] = useState({
    businessType: data.businessType ?? "",
    primaryRevSource: data.primaryRevSource ?? "",
    acquisitionChannel: data.acquisitionChannel ?? "",
    avgOrderValue: data.avgOrderValue ?? "",
    teamSize: data.teamSize ?? "",
    salesChannels: data.salesChannels ?? [] as string[],
  });

  const toggleChannel = (c: string) => {
    setForm((p) => ({
      ...p,
      salesChannels: p.salesChannels.includes(c)
        ? p.salesChannels.filter((x) => x !== c)
        : [...p.salesChannels, c],
    }));
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.businessType && form.avgOrderValue && form.teamSize;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          Your <span className="text-accent-bright">Business Model</span>
        </h1>
        <p className="text-muted text-sm">This shapes your revenue tracking and growth metrics.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Business Type</label>
          <div className="grid grid-cols-3 gap-2">
            {BUSINESS_TYPES.map((b) => (
              <button
                key={b}
                onClick={() => set("businessType", b)}
                className={`text-left text-xs px-3 py-2.5 rounded-lg border transition-colors ${
                  form.businessType === b
                    ? "border-accent bg-accent-dim text-accent-bright"
                    : "border-border text-muted hover:text-text-primary"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Primary Revenue Source</label>
          <input value={form.primaryRevSource} onChange={(e) => set("primaryRevSource", e.target.value)} placeholder="e.g. Product sales, Retainer clients, Subscriptions" />
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Acquisition Channels (select all)</label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <button
                key={c}
                onClick={() => toggleChannel(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  form.salesChannels.includes(c)
                    ? "border-accent bg-accent-dim text-accent-bright"
                    : "border-border text-muted hover:text-text-primary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Average Order Value</label>
            <input value={form.avgOrderValue} onChange={(e) => set("avgOrderValue", e.target.value)} placeholder="₹1,200" />
          </div>
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Team Size</label>
            <select value={form.teamSize} onChange={(e) => set("teamSize", e.target.value)}>
              <option value="">Select</option>
              {["Solo founder", "2-3 people", "4-10 people", "10-25 people", "25+"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
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
