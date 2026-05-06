"use client";

import { useState } from "react";
import { FounderProfile } from "@/lib/storage";

interface Props {
  data: Partial<FounderProfile>;
  onNext: (data: Partial<FounderProfile>) => void;
  onBack: () => void;
}

const WINDOWS = ["5 AM – 8 AM", "8 AM – 12 PM", "12 PM – 4 PM", "4 PM – 8 PM", "8 PM – 12 AM", "Night Owl"];
const DISTRACTIONS = ["Social media scrolling", "Poor sleep", "Meetings overload", "Unclear priorities", "Team management", "Procrastination", "Family commitments"];
const WORKOUT = ["Daily", "4–5x/week", "2–3x/week", "Rarely", "Not currently"];

export default function FounderPerformanceStep({ data, onNext, onBack }: Props) {
  const [form, setForm] = useState({
    productiveHours: data.productiveHours ?? "",
    sleepSchedule: data.sleepSchedule ?? "",
    workoutFreq: data.workoutFreq ?? "",
    biggestDistraction: data.biggestDistraction ?? "",
    peakProductivityWindow: data.peakProductivityWindow ?? "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.productiveHours && form.sleepSchedule && form.workoutFreq && form.biggestDistraction && form.peakProductivityWindow;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          Founder <span className="text-accent-bright">Performance</span>
        </h1>
        <p className="text-muted text-sm">This builds your discipline dashboard and habit tracking system.</p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Average Deep Work Hours / Day</label>
            <select value={form.productiveHours} onChange={(e) => set("productiveHours", e.target.value)}>
              <option value="">Select</option>
              {["Less than 2", "2-3 hours", "4-5 hours", "6+ hours"].map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Sleep Schedule</label>
            <select value={form.sleepSchedule} onChange={(e) => set("sleepSchedule", e.target.value)}>
              <option value="">Select</option>
              {["Less than 5h", "5-6 hours", "7-8 hours", "8+ hours"].map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Workout / Swimming Frequency</label>
          <div className="flex flex-wrap gap-2">
            {WORKOUT.map((w) => (
              <button
                key={w}
                onClick={() => set("workoutFreq", w)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  form.workoutFreq === w
                    ? "border-accent bg-accent-dim text-accent-bright"
                    : "border-border text-muted hover:text-text-primary"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Peak Productivity Window</label>
          <div className="grid grid-cols-3 gap-2">
            {WINDOWS.map((w) => (
              <button
                key={w}
                onClick={() => set("peakProductivityWindow", w)}
                className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                  form.peakProductivityWindow === w
                    ? "border-accent bg-accent-dim text-accent-bright"
                    : "border-border text-muted hover:text-text-primary"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-2">Biggest Distraction</label>
          <div className="flex flex-wrap gap-2">
            {DISTRACTIONS.map((d) => (
              <button
                key={d}
                onClick={() => set("biggestDistraction", d)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  form.biggestDistraction === d
                    ? "border-accent bg-accent-dim text-accent-bright"
                    : "border-border text-muted hover:text-text-primary"
                }`}
              >
                {d}
              </button>
            ))}
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
          Build My OS →
        </button>
      </div>
    </div>
  );
}
