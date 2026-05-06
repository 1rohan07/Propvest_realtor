"use client";

import { useEffect, useState } from "react";
import { getStreakCount } from "@/lib/scoring";
import { Flame } from "lucide-react";

export default function HabitStreaks() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(getStreakCount());
  }, []);

  return (
    <div className="glass rounded-xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
        <Flame size={18} className="text-orange-400" />
      </div>
      <div>
        <p className="text-xs text-muted">Daily Streak</p>
        <p className="text-xl font-semibold text-text-primary">{streak} <span className="text-sm font-normal text-muted">days</span></p>
      </div>
    </div>
  );
}
