"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getRevenue, getHabits, getTasks, getProfile } from "@/lib/storage";
import { generateInsights, Insight } from "@/lib/insights";
import {
  TrendingUp, AlertTriangle, BarChart2, Brain,
  ChevronRight, Zap, Shield,
} from "lucide-react";

const TYPE_CONFIG = {
  opportunity: {
    label: "OPPORTUNITY",
    icon: TrendingUp,
    className: "insight-opportunity",
    badge: "text-accent-bright border-accent/40 bg-accent-dim",
    dot: "bg-accent-bright",
  },
  warning: {
    label: "WARNING",
    icon: AlertTriangle,
    className: "insight-warning",
    badge: "text-red-400 border-red-400/30 bg-red-400/10",
    dot: "bg-red-400",
  },
  trend: {
    label: "TREND",
    icon: BarChart2,
    className: "insight-trend",
    badge: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    dot: "bg-blue-400",
  },
  prediction: {
    label: "PREDICTION",
    icon: Brain,
    className: "insight-prediction",
    badge: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    dot: "bg-purple-400",
  },
};

const IMPACT_COLORS = {
  high:   "text-red-400 border-red-400/20",
  medium: "text-yellow-400 border-yellow-400/20",
  low:    "text-muted border-border",
};

const URGENCY_LABELS = {
  urgent: { label: "URGENT", color: "text-red-400" },
  normal: { label: "LIVE",   color: "text-accent-bright" },
  low:    { label: "FYI",    color: "text-muted" },
};

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const cfg = TYPE_CONFIG[insight.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={cn(
        "glass rounded-xl p-4 hover-lift cursor-default transition-all group",
        cfg.className
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className={cn("text-[9px] font-semibold tracking-widest px-2 py-0.5 rounded-full border", cfg.badge)}>
          {cfg.label}
        </span>
        <span className={cn("text-[9px] border rounded px-1.5 py-0.5 uppercase font-medium", IMPACT_COLORS[insight.impact])}>
          {insight.impact} impact
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span className={cn("text-[9px] font-medium", URGENCY_LABELS[insight.urgency].color)}>
            {URGENCY_LABELS[insight.urgency].label}
          </span>
          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot, insight.urgency === "urgent" ? "animate-pulse" : "")} />
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-text-primary leading-snug mb-1.5">{insight.title}</p>

      {/* Body */}
      <p className="text-xs text-text-secondary leading-relaxed mb-3">{insight.body}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Confidence */}
        <div className="flex items-center gap-2 flex-1 mr-4">
          <span className="text-[10px] text-muted whitespace-nowrap">Confidence</span>
          <div className="confidence-bar flex-1">
            <div
              className="confidence-bar-fill"
              style={{ width: `${insight.confidence}%` }}
            />
          </div>
          <span className="text-[10px] text-muted whitespace-nowrap">{insight.confidence}%</span>
        </div>

        {/* Action */}
        {insight.action && (
          <Link
            href={insight.action.href}
            className="flex items-center gap-1 text-[10px] text-accent-bright hover:text-accent-bright/80 transition-colors flex-shrink-0 font-medium"
          >
            {insight.action.label}
            <ChevronRight size={10} />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-4 space-y-2.5">
      <div className="flex gap-2">
        <div className="shimmer h-4 w-20 rounded-full" />
        <div className="shimmer h-4 w-16 rounded-full" />
      </div>
      <div className="shimmer h-4 w-3/4 rounded" />
      <div className="shimmer h-3 w-full rounded" />
      <div className="shimmer h-3 w-5/6 rounded" />
    </div>
  );
}

export default function InsightsFeed({ maxItems = 6 }: { maxItems?: number }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const revenue  = getRevenue();
    const habits   = getHabits();
    const tasks    = getTasks();
    const profile  = getProfile();
    const generated = generateInsights(revenue, habits, tasks, profile);
    setInsights(generated.slice(0, maxItems));
    setLoaded(true);
  }, [maxItems]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-accent-bright" />
          <span className="text-xs font-semibold text-text-primary">Intelligence Feed</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-bright status-live relative" />
            <span className="text-[9px] text-accent-bright font-medium ml-1">LIVE</span>
          </span>
        </div>
        <span className="text-[10px] text-muted">{insights.length} signals detected</span>
      </div>

      {!loaded ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : insights.length === 0 ? (
        <div className="glass rounded-xl p-6 text-center">
          <Shield size={20} className="text-muted mx-auto mb-2" />
          <p className="text-xs text-muted">Log revenue and habits to generate business intelligence.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
