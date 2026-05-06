"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Megaphone, Zap, Activity,
  Lightbulb, Target, Users, Bot, Settings, Sparkles, LogOut
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { clearProfile } from "@/lib/storage";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone },
  { href: "/dashboard/brand", label: "Brand", icon: Sparkles },
  { href: "/dashboard/execution", label: "Execution", icon: Zap },
  { href: "/dashboard/performance", label: "Performance", icon: Activity },
  { href: "/dashboard/intelligence", label: "Intelligence", icon: Lightbulb },
  { href: "/dashboard/vision", label: "Vision", icon: Target },
  { href: "/dashboard/networking", label: "Networking", icon: Users },
  { href: "/dashboard/advisor", label: "AI Advisor", icon: Bot },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleReset = () => {
    clearProfile();
    router.push("/onboarding");
  };

  return (
    <aside className="w-56 h-screen bg-surface border-r border-border flex flex-col sticky top-0 shrink-0">
      <div className="p-5 border-b border-border">
        <Logo />
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative",
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
                <Icon size={15} className="relative z-10 shrink-0" />
                <span className="relative z-10 font-medium">{label}</span>
                {label === "AI Advisor" && (
                  <span className="relative z-10 ml-auto text-[9px] bg-accent text-white px-1.5 py-0.5 rounded-full">AI</span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-0.5">
        <Link href="/dashboard/settings">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
            pathname === "/dashboard/settings" ? "bg-accent-dim text-accent-bright" : "text-muted hover:text-text-primary hover:bg-surface-2"
          )}>
            <Settings size={15} />
            <span className="font-medium">Settings</span>
          </div>
        </Link>
        <button
          onClick={handleReset}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-red-400 hover:bg-surface-2 transition-colors"
        >
          <LogOut size={15} />
          <span className="font-medium">Reset Profile</span>
        </button>
      </div>
    </aside>
  );
}
