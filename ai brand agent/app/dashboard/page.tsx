"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getProfile, getRevenue } from "@/lib/storage";
import { FounderProfile, RevenueEntry } from "@/lib/storage";
import { formatCurrency, greet, today } from "@/lib/utils";
import TopBar from "@/components/dashboard/TopBar";
import MomentumScore from "@/components/dashboard/MomentumScore";
import DailyChecklist from "@/components/dashboard/DailyChecklist";
import HabitStreaks from "@/components/dashboard/HabitStreaks";
import AIRecommendations from "@/components/dashboard/AIRecommendations";
import KPICard from "@/components/ui/KPICard";
import { TrendingUp, Target, Zap, Users } from "lucide-react";
import { stagger, slideUp } from "@/lib/motion";

export default function DashboardPage() {
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setRevenue(getRevenue());
  }, []);

  const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
  const thisMonth = revenue
    .filter((r) => r.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />

      <div className="flex-1 p-6 space-y-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-1"
        >
          <motion.h1 variants={slideUp} className="text-xl font-semibold text-text-primary">
            {greet()}, <span className="text-accent-bright">{profile?.name?.split(" ")[0] ?? "Founder"}</span>
          </motion.h1>
          <motion.p variants={slideUp} className="text-sm text-muted">
            {profile?.founderType ?? "Founder"} · {profile?.stage ?? "Early Stage"} · Target: {profile?.targetRevenue ?? "Set your target"}
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-4 gap-4">
          <KPICard
            label="Total Revenue"
            value={formatCurrency(totalRevenue)}
            sub="All time"
            icon={<TrendingUp size={14} />}
            accent
          />
          <KPICard
            label="This Month"
            value={formatCurrency(thisMonth)}
            sub={new Date().toLocaleString("default", { month: "long" })}
            icon={<Target size={14} />}
          />
          <KPICard
            label="Revenue Entries"
            value={revenue.length}
            sub="Logged so far"
            icon={<Zap size={14} />}
          />
          <KPICard
            label="Team Size"
            value={profile?.teamSize ?? "—"}
            sub="Current team"
            icon={<Users size={14} />}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <DailyChecklist />
            <AIRecommendations />
          </div>
          <div className="space-y-4">
            <MomentumScore />
            <HabitStreaks />
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">30-Day Focus</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {profile?.mainBottleneck
                  ? `Fix your biggest bottleneck: ${profile.mainBottleneck}. This is your #1 growth lever right now.`
                  : "Complete onboarding to see your 30-day focus area."}
              </p>
              {profile && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Target</p>
                  <p className="text-sm font-semibold text-accent-bright">{profile.targetRevenue}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
