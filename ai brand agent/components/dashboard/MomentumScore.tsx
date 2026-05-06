"use client";

import { useEffect, useState } from "react";
import { calcMomentumScore, calcDisciplineScore, calcExecutionScore } from "@/lib/scoring";
import { today } from "@/lib/utils";
import ProgressRing from "@/components/ui/ProgressRing";

export default function MomentumScore() {
  const [scores, setScores] = useState({ momentum: 0, discipline: 0, execution: 0 });

  useEffect(() => {
    const d = today();
    setScores({
      momentum: calcMomentumScore(d),
      discipline: calcDisciplineScore(d),
      execution: calcExecutionScore(d),
    });
  }, []);

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-5">Today's Scores</h3>
      <div className="flex items-center justify-around">
        <div className="flex flex-col items-center gap-2">
          <ProgressRing value={scores.momentum} size={72} strokeWidth={5} color="#4a7c59" label={`${scores.momentum}`} sublabel="Momentum" />
          <span className="text-[10px] text-muted">Momentum</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ProgressRing value={scores.discipline} size={72} strokeWidth={5} color="#6aaf7e" label={`${scores.discipline}`} sublabel="Discipline" />
          <span className="text-[10px] text-muted">Discipline</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ProgressRing value={scores.execution} size={72} strokeWidth={5} color="#3d6b4f" label={`${scores.execution}`} sublabel="Execution" />
          <span className="text-[10px] text-muted">Execution</span>
        </div>
      </div>
    </div>
  );
}
