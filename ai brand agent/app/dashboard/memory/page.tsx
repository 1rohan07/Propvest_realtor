"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import TopBar from "@/components/dashboard/TopBar";
import SectionHeader from "@/components/ui/SectionHeader";
import { getProfile, getFounderMemory, setFounderMemory, getGoals, FounderMemory } from "@/lib/storage";
import { today } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Brain, CheckCircle, Sparkles, Target, Zap, TrendingUp, Users, Settings } from "lucide-react";
import Link from "next/link";

const ENERGY_LEVELS = [
  { value: "high",   label: "High",   desc: "Operating at full capacity", color: "text-accent-bright border-accent/40 bg-accent-dim" },
  { value: "medium", label: "Medium", desc: "Steady, room to improve",    color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" },
  { value: "low",    label: "Low",    desc: "Need recovery or support",   color: "text-red-400 border-red-400/30 bg-red-400/10" },
] as const;

const DEFAULT_MEMORY: FounderMemory = {
  goals: "",
  currentExperiments: "",
  biggestWin: "",
  currentChallenge: "",
  nextMilestone: "",
  preferredStrategy: "",
  energyLevel: "high",
  updatedAt: today(),
};

function MemoryField({
  label, sublabel, value, onChange, placeholder, rows = 2,
}: {
  label: string; sublabel?: string; value: string;
  onChange: (v: string) => void; placeholder: string; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="block text-xs font-semibold text-text-primary">{label}</label>
        {sublabel && <p className="text-[10px] text-muted mt-0.5">{sublabel}</p>}
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="resize-none text-sm"
      />
    </div>
  );
}

export default function MemoryPage() {
  const [memory, setMemoryState] = useState<FounderMemory>(DEFAULT_MEMORY);
  const [profile, setProfile] = useState<ReturnType<typeof getProfile>>(null);
  const [goals, setGoals] = useState<{ title: string; progress: number }[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    const existing = getFounderMemory();
    if (existing) setMemoryState(existing);
    setGoals(getGoals() as { title: string; progress: number }[]);
  }, []);

  const set = (k: keyof FounderMemory, v: string) =>
    setMemoryState((p) => ({ ...p, [k]: v }));

  const save = () => {
    setFounderMemory({ ...memory, updatedAt: today() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Founder Memory" />

      <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-start justify-between">
          <div>
            <SectionHeader
              title="Founder Memory"
              subtitle="Everything the AI knows about you — edit to improve every AI response across the platform"
            />
          </div>
          <button
            onClick={save}
            className={cn(
              "flex items-center gap-2 text-sm px-5 py-2 rounded-lg transition-all font-medium",
              saved
                ? "bg-accent-dim text-accent-bright border border-accent"
                : "bg-accent text-white hover:bg-accent-bright"
            )}
          >
            {saved ? <><CheckCircle size={14} /> Saved</> : <><Brain size={14} /> Save Memory</>}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Left: What AI knows */}
          <div className="space-y-4">
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={13} className="text-accent-bright" />
                <h3 className="text-sm font-semibold text-text-primary">AI Profile Snapshot</h3>
              </div>
              <p className="text-[10px] text-muted uppercase tracking-widest mb-3">From Onboarding</p>
              <div className="space-y-2.5 text-xs">
                {profile ? (
                  <>
                    <Row label="Business" value={profile.businessType} />
                    <Row label="Stage"    value={profile.stage} />
                    <Row label="Team"     value={profile.teamSize} />
                    <Row label="Revenue"  value={profile.currentRevenue} />
                    <Row label="Target"   value={profile.targetRevenue} />
                    <Row label="Bottleneck" value={profile.mainBottleneck} highlight />
                    <Row label="Strength" value={profile.biggestStrength} />
                    <Row label="Audience" value={profile.targetAudience} />
                    <Row label="Competitors" value={profile.competitors} />
                    <Row label="Peak Hours"  value={profile.peakProductivityWindow} />
                  </>
                ) : (
                  <p className="text-muted">
                    Complete onboarding to auto-populate your profile.{" "}
                    <Link href="/onboarding" className="text-accent-bright">Start →</Link>
                  </p>
                )}
              </div>
            </div>

            {goals.length > 0 && (
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={13} className="text-accent-bright" />
                  <h3 className="text-xs font-semibold text-text-primary">Active Goals</h3>
                </div>
                <div className="space-y-2">
                  {goals.slice(0, 5).map((g, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary truncate flex-1 mr-2">{g.title}</span>
                        <span className="text-accent-bright flex-shrink-0">{g.progress}%</span>
                      </div>
                      <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${g.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/vision" className="text-[10px] text-muted hover:text-accent-bright transition-colors mt-2 block">
                  Edit goals →
                </Link>
              </div>
            )}

            <div className="glass rounded-xl p-4">
              <p className="text-[10px] text-muted mb-2">This memory is injected into all AI agents so responses are fully personalised to your context.</p>
              <Link href="/dashboard/settings" className="flex items-center gap-1 text-[10px] text-accent-bright hover:text-accent-bright/80">
                <Settings size={9} /> Configure AI provider
              </Link>
            </div>
          </div>

          {/* Right: Editable memory */}
          <div className="col-span-2 space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-xl p-6 space-y-5"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Brain size={14} className="text-accent-bright" />
                <h3 className="text-sm font-semibold text-text-primary">Strategic Context</h3>
                <span className="ml-auto text-[10px] text-muted">
                  {memory.updatedAt ? `Updated ${memory.updatedAt}` : "Not saved yet"}
                </span>
              </div>

              <MemoryField
                label="Current Goals & Targets"
                sublabel="What are you trying to achieve in the next 90 days?"
                value={memory.goals}
                onChange={(v) => set("goals", v)}
                placeholder="e.g. Hit ₹5L monthly revenue, launch second product line, build team to 3 people"
                rows={3}
              />

              <MemoryField
                label="Active Experiments"
                sublabel="What are you currently testing?"
                value={memory.currentExperiments}
                onChange={(v) => set("currentExperiments", v)}
                placeholder="e.g. Testing Meta ad creative with UGC vs branded, trying 3x/week content cadence"
                rows={2}
              />

              <div className="grid grid-cols-2 gap-4">
                <MemoryField
                  label="Biggest Recent Win"
                  sublabel="What's working?"
                  value={memory.biggestWin}
                  onChange={(v) => set("biggestWin", v)}
                  placeholder="e.g. Instagram Reels driving 40% of website traffic"
                />
                <MemoryField
                  label="Biggest Current Challenge"
                  sublabel="What's blocking you?"
                  value={memory.currentChallenge}
                  onChange={(v) => set("currentChallenge", v)}
                  placeholder="e.g. Customer acquisition cost too high relative to LTV"
                />
              </div>

              <MemoryField
                label="Next Milestone"
                sublabel="What's the next major milestone to hit?"
                value={memory.nextMilestone}
                onChange={(v) => set("nextMilestone", v)}
                placeholder="e.g. Close first ₹10L month, launch on Myntra, hire first salesperson"
              />

              <MemoryField
                label="Preferred Growth Strategy"
                sublabel="How do you like to grow? What approaches resonate?"
                value={memory.preferredStrategy}
                onChange={(v) => set("preferredStrategy", v)}
                placeholder="e.g. Community-led growth, organic content first, then paid amplification. Prefer bootstrapping over VC funding."
                rows={2}
              />

              {/* Energy Level */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-text-primary">Current Energy Level</label>
                  <p className="text-[10px] text-muted mt-0.5">Affects how AI coaches respond to you</p>
                </div>
                <div className="flex gap-2">
                  {ENERGY_LEVELS.map((e) => (
                    <button
                      key={e.value}
                      onClick={() => set("energyLevel", e.value)}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all",
                        memory.energyLevel === e.value ? e.color : "border-border text-muted hover:text-text-primary"
                      )}
                    >
                      <div className="font-semibold">{e.label}</div>
                      <div className="text-[9px] font-normal opacity-70 mt-0.5">{e.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={save}
                  className={cn(
                    "flex items-center gap-2 text-sm px-6 py-2.5 rounded-xl transition-all font-medium",
                    saved
                      ? "bg-accent-dim text-accent-bright border border-accent"
                      : "bg-accent text-white hover:bg-accent-bright"
                  )}
                >
                  {saved ? <><CheckCircle size={14} /> Saved to AI Memory</> : <><Brain size={14} /> Save & Update AI Context</>}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-muted flex-shrink-0 min-w-[60px]">{label}</span>
      <span className={cn("truncate", highlight ? "text-red-400 font-medium" : "text-text-secondary")}>{value}</span>
    </div>
  );
}
