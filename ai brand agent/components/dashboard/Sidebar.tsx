"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Megaphone, Zap, Activity,
  Lightbulb, Target, Users, Bot, Settings, Sparkles,
  LogOut, Brain, GitBranch,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { clearProfile, getFounderMode } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MODES } from "@/components/dashboard/ModeSelector";
import type { FounderMode } from "@/lib/storage";

const NAV_PRIMARY = [
  { href: "/dashboard",           label: "Briefing",      icon: LayoutDashboard },
  { href: "/dashboard/decision",  label: "Decision Engine", icon: GitBranch,   badge: "NEW" },
  { href: "/dashboard/revenue",   label: "Revenue",       icon: TrendingUp },
  { href: "/dashboard/marketing", label: "Marketing",     icon: Megaphone },
  { href: "/dashboard/brand",     label: "Brand",         icon: Sparkles },
  { href: "/dashboard/intelligence", label: "Intelligence", icon: Lightbulb },
];

const NAV_SECONDARY = [
  { href: "/dashboard/execution",   label: "Execution",    icon: Zap },
  { href: "/dashboard/performance", label: "Performance",  icon: Activity },
  { href: "/dashboard/vision",      label: "Vision",       icon: Target },
  { href: "/dashboard/networking",  label: "Networking",   icon: Users },
  { href: "/dashboard/advisor",     label: "AI Advisor",   icon: Bot,     badge: "AI" },
  { href: "/dashboard/memory",      label: "AI Memory",    icon: Brain },
];

function NavItem({
  href,
  label,
  icon: Icon,
  badge,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  active: boolean;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 2 }}
        transition={{ duration: 0.12 }}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors relative",
          active
            ? "bg-accent-dim text-accent-bright"
            : "text-muted hover:text-text-primary hover:bg-surface-2"
        )}
      >
        {active && (
          <motion.div
            layoutId="activeNav"
            className="absolute inset-0 bg-accent-dim rounded-lg"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <Icon size={13} className="relative z-10 shrink-0" />
        <span className="relative z-10 font-medium">{label}</span>
        {badge && (
          <span className={cn(
            "relative z-10 ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-semibold",
            badge === "AI" ? "bg-accent text-white" : "bg-accent-dim text-accent-bright border border-accent/40"
          )}>{badge}</span>
        )}
      </motion.div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = useState<FounderMode>("growth");

  useEffect(() => { setMode(getFounderMode()); }, []);

  const handleReset = () => {
    clearProfile();
    router.push("/onboarding");
  };

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <aside className="w-52 h-screen bg-surface border-r border-border flex flex-col sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <Logo />
      </div>

      {/* Mode badge */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border w-fit",
          MODES[mode].cls
        )}>
          <span>{MODES[mode].icon}</span>
          <span>{MODES[mode].label} Mode</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto no-scrollbar">
        <p className="text-[9px] text-muted uppercase tracking-widest px-3 py-1.5 mt-1">Core</p>
        {NAV_PRIMARY.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} />
        ))}

        <p className="text-[9px] text-muted uppercase tracking-widest px-3 py-1.5 mt-3">Execution</p>
        {NAV_SECONDARY.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-border space-y-0.5">
        <Link href="/dashboard/settings">
          <div className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors",
            pathname === "/dashboard/settings"
              ? "bg-accent-dim text-accent-bright"
              : "text-muted hover:text-text-primary hover:bg-surface-2"
          )}>
            <Settings size={13} />
            <span className="font-medium">Settings</span>
          </div>
        </Link>
        <button
          onClick={handleReset}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted hover:text-red-400 hover:bg-surface-2 transition-colors"
        >
          <LogOut size={13} />
          <span className="font-medium">Reset Profile</span>
        </button>
      </div>
    </aside>
  );
}
