"use client";

import { useEffect, useRef, useState } from "react";
import { getProfile } from "@/lib/storage";
import { calcMomentumScore } from "@/lib/scoring";
import { greet, today } from "@/lib/utils";
import { generateAlerts, dismissAlert, Alert } from "@/lib/alerts";
import ProgressRing from "@/components/ui/ProgressRing";
import ModeSelector from "@/components/dashboard/ModeSelector";
import CommandPalette from "@/components/dashboard/CommandPalette";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const SEVERITY_STYLES = {
  critical: "text-red-400 border-red-400/30 bg-red-400/10",
  warning: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  info: "text-blue-400 border-blue-400/30 bg-blue-400/10",
};

const SEVERITY_DOT = {
  critical: "bg-red-400",
  warning: "bg-yellow-400",
  info: "bg-blue-400",
};

export default function TopBar({ title }: { title?: string }) {
  const [profile, setProfileState] = useState<{ name: string; founderType: string } | null>(null);
  const [score, setScore] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = getProfile();
    if (p) setProfileState({ name: p.name, founderType: p.founderType ?? "Founder" });
    setScore(calcMomentumScore(today()));
    setAlerts(generateAlerts());
  }, []);

  // Close bell dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dismiss = (id: string) => {
    dismissAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const badgeCount = alerts.length;

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

        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setBellOpen((o) => !o)}
            className={cn(
              "relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
              bellOpen ? "bg-surface-2 text-text-primary" : "text-muted hover:text-text-primary hover:bg-surface-2"
            )}
          >
            <Bell size={15} />
            {badgeCount > 0 && (
              <span className={cn(
                "absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center px-0.5 text-white",
                criticalCount > 0 ? "bg-red-400" : "bg-yellow-400"
              )}>
                {badgeCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 glass rounded-xl shadow-2xl border border-border overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-semibold text-text-primary">Alerts</p>
                  <span className="text-[10px] text-muted">{alerts.length} active</span>
                </div>
                {alerts.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-muted">All clear — no active alerts.</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {alerts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-2 transition-colors group"
                      >
                        <span className={cn("mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0", SEVERITY_DOT[a.severity])} />
                        <Link href={a.href} onClick={() => setBellOpen(false)} className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary leading-snug">{a.title}</p>
                          <p className="text-[10px] text-muted leading-snug mt-0.5">{a.body}</p>
                        </Link>
                        <button
                          onClick={() => dismiss(a.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted hover:text-text-primary flex-shrink-0 transition-all"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
