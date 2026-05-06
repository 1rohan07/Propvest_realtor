"use client";

import { useState } from "react";
import { FounderProfile } from "@/lib/storage";

interface Props {
  data: Partial<FounderProfile>;
  onNext: (data: Partial<FounderProfile>) => void;
}

const STAGES = ["Idea Stage", "Pre-Revenue", "Early Revenue (₹0–1L/mo)", "Growing (₹1L–10L/mo)", "Scaling (₹10L+/mo)"];
const BOTTLENECKS = ["Distribution & Sales", "Product Development", "Team & Hiring", "Marketing & Brand", "Operations", "Capital & Funding", "Clarity & Strategy"];

export default function FounderIdentityStep({ data, onNext }: Props) {
  const [form, setForm] = useState({
    name: data.name ?? "",
    stage: data.stage ?? "",
    currentRevenue: data.currentRevenue ?? "",
    targetRevenue: data.targetRevenue ?? "",
    mainBottleneck: data.mainBottleneck ?? "",
    biggestStrength: data.biggestStrength ?? "",
    biggestWeakness: data.biggestWeakness ?? "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.name && form.stage && form.currentRevenue && form.targetRevenue && form.mainBottleneck;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          Let's understand <span className="text-accent-bright">who you are</span>
        </h1>
        <p className="text-muted text-sm">This helps the system build your personalized founder OS.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Your Name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Rohan Garg" />
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">What are you building?</label>
          <input value={form.biggestStrength} onChange={(e) => set("biggestStrength", e.target.value)} placeholder="e.g. Premium Athleisure Brand — Tuque" />
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Current Stage</label>
          <div className="grid grid-cols-2 gap-2">
            {STAGES.map((s) => (
              <button
                key={s}
                onClick={() => set("stage", s)}
                className={`text-left text-sm px-4 py-3 rounded-lg border transition-colors ${
                  form.stage === s
                    ? "border-accent bg-accent-dim text-accent-bright"
                    : "border-border text-muted hover:border-border hover:text-text-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Current Monthly Revenue</label>
            <input value={form.currentRevenue} onChange={(e) => set("currentRevenue", e.target.value)} placeholder="₹10,000" />
          </div>
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Target Monthly Revenue</label>
            <input value={form.targetRevenue} onChange={(e) => set("targetRevenue", e.target.value)} placeholder="₹1,00,000" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Biggest Bottleneck Right Now</label>
          <div className="grid grid-cols-2 gap-2">
            {BOTTLENECKS.map((b) => (
              <button
                key={b}
                onClick={() => set("mainBottleneck", b)}
                className={`text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                  form.mainBottleneck === b
                    ? "border-accent bg-accent-dim text-accent-bright"
                    : "border-border text-muted hover:border-border hover:text-text-primary"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Biggest Weakness (honest)</label>
          <input value={form.biggestWeakness} onChange={(e) => set("biggestWeakness", e.target.value)} placeholder="e.g. Inconsistent content, poor follow-up" />
        </div>
      </div>

      <button
        onClick={() => valid && onNext(form)}
        disabled={!valid}
        className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all ${
          valid
            ? "bg-accent text-white hover:bg-accent-bright"
            : "bg-surface-2 text-muted cursor-not-allowed"
        }`}
      >
        Continue →
      </button>
    </div>
  );
}
