"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  icon?: React.ReactNode;
  accent?: boolean;
  className?: string;
}

export default function KPICard({
  label,
  value,
  sub,
  trend,
  icon,
  accent,
  className,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "glass rounded-xl p-5 flex flex-col gap-3",
        accent && "border-accent/40 accent-glow",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted uppercase tracking-wider font-medium">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className="flex items-end justify-between">
        <span className={cn("text-2xl font-semibold", accent && "text-accent-bright")}>
          {value}
        </span>
        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend > 0 ? "text-accent-bright" : trend < 0 ? "text-red-400" : "text-muted"
            )}
          >
            {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </motion.div>
  );
}
