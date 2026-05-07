"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FounderMode, getFounderMode, setFounderMode } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export const MODES: Record<FounderMode, { label: string; desc: string; icon: string; cls: string }> = {
  growth:      { label: "Growth",      desc: "Revenue & market expansion",    icon: "🚀", cls: "mode-growth" },
  survival:    { label: "Survival",    desc: "Protect runway & cut costs",    icon: "🛡", cls: "mode-survival" },
  brand:       { label: "Brand",       desc: "Positioning & content signal",  icon: "✦", cls: "mode-brand" },
  fundraising: { label: "Fundraising", desc: "Investor relations & pitch",    icon: "◈", cls: "mode-fundraising" },
  operations:  { label: "Ops",         desc: "Systems & team building",       icon: "⚙", cls: "mode-operations" },
  sprint:      { label: "Sprint",      desc: "Ship fast, iterate daily",      icon: "⚡", cls: "mode-sprint" },
};

export default function ModeSelector() {
  const [mode, setMode] = useState<FounderMode>("growth");
  const [open, setOpen] = useState(false);

  useEffect(() => { setMode(getFounderMode()); }, []);

  const select = (m: FounderMode) => {
    setMode(m);
    setFounderMode(m);
    setOpen(false);
  };

  const cfg = MODES[mode];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all",
          cfg.cls
        )}
      >
        <span>{cfg.icon}</span>
        <span>{cfg.label} Mode</span>
        <ChevronDown size={9} className={cn("transition-transform", open ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 right-0 z-50 glass-premium rounded-xl border border-border p-2 w-52 glow-card"
            >
              <p className="text-[10px] text-muted uppercase tracking-widest px-2 py-1 mb-1">Operating Mode</p>
              {(Object.entries(MODES) as [FounderMode, typeof MODES[FounderMode]][]).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => select(key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors text-left",
                    mode === key ? "bg-surface-2 text-text-primary" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                  )}
                >
                  <span className="text-sm leading-none">{m.icon}</span>
                  <div>
                    <p className="font-semibold leading-none mb-0.5">{m.label}</p>
                    <p className="text-[10px] text-muted leading-none">{m.desc}</p>
                  </div>
                  {mode === key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-bright flex-shrink-0" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
