"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, TrendingUp, Megaphone, Sparkles, Zap,
  Activity, Lightbulb, Target, Users, Bot, Settings,
  Brain, GitBranch, Search, Command, ArrowRight,
} from "lucide-react";

interface Cmd {
  id: string;
  label: string;
  group: "Navigate" | "Actions";
  icon: React.ElementType;
  href: string;
  keywords?: string[];
}

const ALL_COMMANDS: Cmd[] = [
  { id: "nav-dashboard",    label: "Dashboard",         group: "Navigate", icon: LayoutDashboard, href: "/dashboard" },
  { id: "nav-revenue",      label: "Revenue",           group: "Navigate", icon: TrendingUp,      href: "/dashboard/revenue",      keywords: ["money","income","sales"] },
  { id: "nav-marketing",    label: "Marketing",         group: "Navigate", icon: Megaphone,       href: "/dashboard/marketing",    keywords: ["social","content","ads"] },
  { id: "nav-brand",        label: "Brand",             group: "Navigate", icon: Sparkles,        href: "/dashboard/brand",        keywords: ["identity","voice","positioning"] },
  { id: "nav-execution",    label: "Execution",         group: "Navigate", icon: Zap,             href: "/dashboard/execution",    keywords: ["tasks","todo","pomodoro"] },
  { id: "nav-performance",  label: "Performance",       group: "Navigate", icon: Activity,        href: "/dashboard/performance",  keywords: ["habits","discipline","health"] },
  { id: "nav-intelligence", label: "Intelligence",      group: "Navigate", icon: Lightbulb,       href: "/dashboard/intelligence", keywords: ["market","competitor","trends"] },
  { id: "nav-vision",       label: "Vision & Goals",    group: "Navigate", icon: Target,          href: "/dashboard/vision",       keywords: ["goals","strategy","roadmap"] },
  { id: "nav-networking",   label: "Networking",        group: "Navigate", icon: Users,           href: "/dashboard/networking",   keywords: ["contacts","crm","relationships"] },
  { id: "nav-advisor",      label: "AI Advisor",        group: "Navigate", icon: Bot,             href: "/dashboard/advisor",      keywords: ["chat","ai","coach"] },
  { id: "nav-decision",     label: "Decision Engine",   group: "Navigate", icon: GitBranch,       href: "/dashboard/decision",     keywords: ["decide","what if","simulate"] },
  { id: "nav-memory",       label: "Founder Memory",    group: "Navigate", icon: Brain,           href: "/dashboard/memory",       keywords: ["context","profile","goals"] },
  { id: "nav-settings",     label: "Settings",          group: "Navigate", icon: Settings,        href: "/dashboard/settings",     keywords: ["api","key","provider"] },
  { id: "act-revenue",      label: "Log Revenue Entry", group: "Actions",  icon: TrendingUp,      href: "/dashboard/revenue",      keywords: ["add","log","track"] },
  { id: "act-task",         label: "Add New Task",      group: "Actions",  icon: Zap,             href: "/dashboard/execution",    keywords: ["todo","task","create"] },
  { id: "act-advisor",      label: "Ask AI Advisor",    group: "Actions",  icon: Bot,             href: "/dashboard/advisor",      keywords: ["question","help","ask"] },
  { id: "act-decision",     label: "Run a Decision",    group: "Actions",  icon: GitBranch,       href: "/dashboard/decision",     keywords: ["what if","simulate","decide"] },
  { id: "act-memory",       label: "Update AI Context", group: "Actions",  icon: Brain,           href: "/dashboard/memory",       keywords: ["edit","update","context"] },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = query.trim()
    ? ALL_COMMANDS.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.keywords?.some((k) => k.includes(q))
        );
      })
    : ALL_COMMANDS;

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, Cmd[]>);

  const flat = filtered;

  const navigate = useCallback(
    (cmd: Cmd) => {
      router.push(cmd.href);
      setOpen(false);
      setQuery("");
      setSelected(0);
    },
    [router]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (!open) return;
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, flat.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && flat[selected]) navigate(flat[selected]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flat, selected, navigate]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  let flatIdx = 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-xs text-muted hover:text-text-primary hover:border-border/80 transition-colors"
      >
        <Search size={11} />
        <span>Search</span>
        <span className="flex items-center gap-0.5 ml-1 opacity-60">
          <Command size={9} />
          <span>K</span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-[100] cmd-backdrop flex items-start justify-center pt-[15vh]"
            onClick={() => { setOpen(false); setQuery(""); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass-premium rounded-2xl border border-border overflow-hidden glow-card"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <Search size={14} className="text-muted flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages, actions..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-muted p-0"
                />
                <kbd className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">ESC</kbd>
              </div>

              <div className="max-h-80 overflow-y-auto no-scrollbar p-2">
                {Object.entries(grouped).map(([group, cmds]) => (
                  <div key={group} className="mb-2">
                    <p className="text-[10px] text-muted uppercase tracking-widest px-2 py-1.5">{group}</p>
                    {cmds.map((cmd) => {
                      const idx = flatIdx++;
                      const isSelected = idx === selected;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => navigate(cmd)}
                          onMouseEnter={() => setSelected(idx)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors",
                            isSelected ? "bg-accent-dim text-accent-bright" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
                          )}
                        >
                          <Icon size={14} className="flex-shrink-0" />
                          <span className="flex-1 font-medium">{cmd.label}</span>
                          {isSelected && <ArrowRight size={12} className="opacity-60" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-muted text-center py-8">No results for "{query}"</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
