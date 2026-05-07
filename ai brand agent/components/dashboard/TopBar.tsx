"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/storage";
import { calcMomentumScore } from "@/lib/scoring";
import { greet, today } from "@/lib/utils";
import ProgressRing from "@/components/ui/ProgressRing";
import ModeSelector from "@/components/dashboard/ModeSelector";
import CommandPalette from "@/components/dashboard/CommandPalette";

export default function TopBar({ title }: { title?: string }) {
  const [profile, setProfileState] = useState<{ name: string; founderType: string } | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const p = getProfile();
    if (p) setProfileState({ name: p.name, founderType: p.founderType ?? "Founder" });
    setScore(calcMomentumScore(today()));
  }, []);

  return (
    <header className="h-13 border-b border-border bg-surface/80 backdrop-blur flex items-center px-5 justify-between sticky top-0 z-10 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {title ? (
          <h1 className="text-sm font-semibold text-text-primary truncate">{title}</h1>
        ) : (
          <div>
            <p className="text-[10px] text-muted leading-none">{greet()}</p>
            <p className="text-sm font-semibold text-text-primary leading-tight mt-0.5 truncate">
              {profile?.name ?? "Founder"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <CommandPalette />
        <ModeSelector />

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <ProgressRing value={score} size={28} strokeWidth={2.5} label={`${score}`} />
          <div className="hidden sm:block">
            <p className="text-[9px] text-muted leading-none">Focus</p>
            <p className="text-xs font-semibold text-text-primary leading-none mt-0.5">{score}/100</p>
          </div>
        </div>

        <div className="w-7 h-7 rounded-full bg-accent-dim border border-accent flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-accent-bright">
            {profile?.name?.[0]?.toUpperCase() ?? "F"}
          </span>
        </div>
      </div>
    </header>
  );
}
