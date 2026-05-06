"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FounderProfile } from "@/lib/storage";

interface Props {
  profile: FounderProfile;
  onComplete: (profile: FounderProfile) => void;
}

const FOUNDER_TYPES: Record<string, string> = {
  "D2C Brand": "Brand Builder",
  "SaaS": "Product Founder",
  "Agency": "Agency Operator",
  "Creator / Personal Brand": "Creator Founder",
  "Services": "Service Entrepreneur",
  "Consulting": "Expert Consultant",
  "Marketplace": "Platform Founder",
};

const ANALYSES = [
  "Analysing your founder profile...",
  "Mapping your business model...",
  "Identifying growth bottlenecks...",
  "Building your custom KPIs...",
  "Configuring your dashboard...",
  "Generating strategic roadmap...",
  "Finalising your Founder OS...",
];

export default function OnboardingComplete({ profile, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const founderType =
    FOUNDER_TYPES[profile.businessType ?? ""] ?? "Ambitious Founder";

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => {
        if (s >= ANALYSES.length - 1) {
          clearInterval(interval);
          setTimeout(() => setDone(true), 600);
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, []);

  const enrichedProfile: FounderProfile = {
    ...profile,
    founderType,
    aiProfile: founderType,
    aiDiagnosis: `Primary bottleneck: ${profile.mainBottleneck}. Stage: ${profile.stage}.`,
    aiPriorities: `Focus on converting your ${profile.acquisitionChannel ?? "main channel"} into consistent revenue.`,
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-8">
        {!done ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full border-2 border-accent border-t-accent-bright mx-auto"
            />
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Building Your Founder OS
              </h2>
              <p className="text-sm text-muted h-5 transition-all">
                {ANALYSES[step]}
              </p>
            </div>
            <div className="space-y-2">
              {ANALYSES.map((a, i) => (
                <motion.div
                  key={a}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i <= step ? 1 : 0.2 }}
                  className="flex items-center gap-3 text-left"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      i < step ? "bg-accent-bright" : i === step ? "bg-accent animate-pulse" : "bg-border"
                    }`}
                  />
                  <span className={`text-xs ${i <= step ? "text-text-secondary" : "text-muted"}`}>{a}</span>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-accent-dim border border-accent flex items-center justify-center mx-auto">
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-text-primary mb-2">
                Your OS is ready, <span className="text-accent-bright">{profile.name?.split(" ")[0]}</span>
              </h2>
              <p className="text-sm text-muted">
                You're identified as a <span className="text-accent-bright font-medium">{founderType}</span>.
                Your dashboard is personalised for your stage and goals.
              </p>
            </div>

            <div className="glass rounded-xl p-4 text-left space-y-3">
              <p className="text-xs text-muted uppercase tracking-wider">AI Diagnosis</p>
              <p className="text-sm text-text-secondary">
                Revenue target: <span className="text-text-primary">{profile.targetRevenue}</span> — Key bottleneck: <span className="text-text-primary">{profile.mainBottleneck}</span>
              </p>
              <p className="text-sm text-text-secondary">
                Peak window: <span className="text-text-primary">{profile.peakProductivityWindow}</span> — Stage: <span className="text-text-primary">{profile.stage}</span>
              </p>
            </div>

            <button
              onClick={() => onComplete(enrichedProfile)}
              className="w-full py-4 rounded-xl bg-accent text-white font-medium hover:bg-accent-bright transition-all text-sm"
            >
              Enter Your Founder OS →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
