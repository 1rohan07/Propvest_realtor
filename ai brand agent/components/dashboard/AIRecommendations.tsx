"use client";

import { useEffect, useState } from "react";
import { getProfile, getRevenue, getHabits } from "@/lib/storage";
import { Sparkles, TrendingDown, AlertCircle, Lightbulb } from "lucide-react";

interface Rec {
  type: "insight" | "alert" | "tip";
  message: string;
}

function generateRecs(): Rec[] {
  const profile = getProfile();
  const revenue = getRevenue();
  const habits = getHabits();
  const recs: Rec[] = [];

  if (!profile) return [];

  if (revenue.length === 0) {
    recs.push({ type: "tip", message: "Log your first revenue entry to start tracking your growth trajectory." });
  }

  if (habits.length === 0) {
    recs.push({ type: "tip", message: "Log today's habits to start building your discipline score." });
  }

  if (profile.mainBottleneck === "Distribution & Sales") {
    recs.push({ type: "insight", message: "Your main bottleneck is distribution. Focus on 1 sales channel and optimise it before expanding." });
  }

  if (profile.mainBottleneck === "Marketing & Brand") {
    recs.push({ type: "insight", message: "Brand clarity drives revenue. Define your positioning statement and repeat it across all content." });
  }

  if (habits.length > 0 && habits[0].outreach < 3) {
    recs.push({ type: "alert", message: "Outreach activity is low. High-growth founders contact 5–10 people daily." });
  }

  if (profile.workoutFreq === "Rarely" || profile.workoutFreq === "Not currently") {
    recs.push({ type: "tip", message: "Physical performance directly impacts mental performance. Start with 20 min daily." });
  }

  recs.push({ type: "insight", message: `Your peak productivity window is ${profile.peakProductivityWindow}. Guard this time aggressively.` });

  return recs.slice(0, 3);
}

const icons = {
  insight: <Lightbulb size={13} className="text-accent-bright" />,
  alert: <AlertCircle size={13} className="text-yellow-400" />,
  tip: <Sparkles size={13} className="text-blue-400" />,
};

export default function AIRecommendations() {
  const [recs, setRecs] = useState<Rec[]>([]);

  useEffect(() => {
    setRecs(generateRecs());
  }, []);

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className="text-accent-bright" />
        <h3 className="text-sm font-semibold text-text-primary">AI Insights</h3>
      </div>
      <div className="space-y-3">
        {recs.length === 0 && (
          <p className="text-xs text-muted">Complete your profile to get personalised insights.</p>
        )}
        {recs.map((r, i) => (
          <div key={i} className="flex gap-2.5">
            <span className="mt-0.5 flex-shrink-0">{icons[r.type]}</span>
            <p className="text-xs text-text-secondary leading-relaxed">{r.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
