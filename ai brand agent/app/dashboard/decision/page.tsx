"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "@/components/dashboard/TopBar";
import SectionHeader from "@/components/ui/SectionHeader";
import { getProfile, getRevenue, getFounderMemory } from "@/lib/storage";
import { getAISettings } from "@/lib/ai";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  GitBranch, Send, RotateCcw, Sparkles, TrendingUp, Users,
  Shield, Target, BarChart3, Zap, Bot, ChevronRight, Copy, Check,
} from "lucide-react";

interface Scenario {
  category: string;
  label: string;
  icon: React.ElementType;
}

const SCENARIOS: Scenario[] = [
  { category: "Revenue",  label: "What if I increase ad spend by 30%?",          icon: TrendingUp },
  { category: "Strategy", label: "Should I focus on retention or acquisition?",   icon: Target },
  { category: "Growth",   label: "What is the single biggest thing slowing my growth?", icon: BarChart3 },
  { category: "Product",  label: "Which product or service category should I expand next?", icon: Sparkles },
  { category: "Team",     label: "Should I hire a salesperson or a content creator first?", icon: Users },
  { category: "Risk",     label: "What is my biggest business risk this quarter?",  icon: Shield },
  { category: "Revenue",  label: "How can I add ₹1 lakh in recurring revenue in 90 days?", icon: Zap },
  { category: "Strategy", label: "Should I raise prices? By how much?",            icon: TrendingUp },
  { category: "Growth",   label: "Is it the right time to launch a new product?",  icon: GitBranch },
  { category: "Team",     label: "When should I raise funding vs bootstrap further?", icon: BarChart3 },
];

const CATEGORIES = ["All", ...Array.from(new Set(SCENARIOS.map((s) => s.category)))];

function parseSSE(chunk: string): string {
  const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
  let text = "";
  for (const line of lines) {
    const data = line.replace("data: ", "").trim();
    if (data === "[DONE]" || !data) continue;
    try {
      const obj = JSON.parse(data);
      if (obj.type === "content_block_delta" && obj.delta?.text) text += obj.delta.text;
      if (obj.choices?.[0]?.delta?.content) text += obj.choices[0].delta.content;
      if (obj.candidates?.[0]?.content?.parts?.[0]?.text) text += obj.candidates[0].content.parts[0].text;
    } catch {}
  }
  return text;
}

function FormattedResponse({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const lines = content.split("\n");
  return (
    <div className="group relative">
      <div className="space-y-1">
        {lines.map((line, i) => {
          if (line.startsWith("### ")) return <p key={i} className="font-semibold text-accent-bright text-sm mt-3 mb-1">{line.slice(4)}</p>;
          if (line.startsWith("## ")) return <p key={i} className="font-bold text-text-primary text-sm mt-4 mb-1.5 pb-1 border-b border-border">{line.slice(3)}</p>;
          if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-text-primary text-sm">{line.slice(2, -2)}</p>;
          if (line.startsWith("- ") || line.startsWith("• ")) return (
            <div key={i} className="flex gap-2 text-sm text-text-secondary">
              <span className="text-accent-bright mt-1 flex-shrink-0 text-xs">•</span>
              <span>{line.slice(2)}</span>
            </div>
          );
          if (/^\d+\.\s/.test(line)) {
            const m = line.match(/^(\d+)\.\s(.*)/)!;
            return (
              <div key={i} className="flex gap-2 text-sm text-text-secondary">
                <span className="text-accent font-semibold flex-shrink-0 w-5">{m[1]}.</span>
                <span>{m[2]}</span>
              </div>
            );
          }
          if (line === "") return <div key={i} className="h-2" />;
          return <p key={i} className="text-sm text-text-secondary leading-relaxed">{line}</p>;
        })}
      </div>
      <button
        onClick={copy}
        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-border rounded p-1.5"
      >
        {copied ? <Check size={11} className="text-accent-bright" /> : <Copy size={11} className="text-muted" />}
      </button>
    </div>
  );
}

export default function DecisionPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [asked, setAsked] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const profile = typeof window !== "undefined" ? getProfile() : null;
  const revenue = typeof window !== "undefined" ? getRevenue() : [];
  const memory  = typeof window !== "undefined" ? getFounderMemory() : null;
  const aiSettings = typeof window !== "undefined" ? getAISettings() : null;
  const configured = !!(aiSettings?.apiKey);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthRevenue = revenue.filter((e) => e.date.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0);

  const systemPrompt = `You are a world-class business decision analyst, venture strategist, and founder advisor. You replace McKinsey, BCG, and expensive advisors.

Founder context:
- Business: ${profile?.businessType ?? "D2C"} | Stage: ${profile?.stage ?? "early"} | Team: ${profile?.teamSize ?? "solo"}
- Revenue this month: ₹${thisMonthRevenue.toLocaleString("en-IN")} | Target: ${profile?.targetRevenue ?? "not set"}
- Main bottleneck: ${profile?.mainBottleneck ?? "unknown"} | Strength: ${profile?.biggestStrength ?? "unknown"}
- Audience: ${profile?.targetAudience ?? "not defined"} | Positioning: ${profile?.brandPositioning ?? "not defined"}
${memory ? `- Strategic context: ${memory.currentChallenge || ""} ${memory.currentExperiments || ""}` : ""}

DECISION ANALYSIS FRAMEWORK — structure every response exactly like this:

## Decision Summary
[1-2 sentence framing of what's actually being decided and why it matters]

## Scenario Matrix

### Bull Case (optimistic — 30% probability)
[What happens if everything goes right]
- Outcome: [specific metric]
- Timeline: [realistic timeframe]
- Requirements: [what needs to be true]

### Base Case (realistic — 50% probability)
[Most likely outcome]
- Outcome: [specific metric]
- Timeline: [realistic timeframe]
- Key assumption: [the main assumption]

### Bear Case (downside — 20% probability)
[What happens if it goes wrong]
- Outcome: [specific metric]
- Mitigation: [how to limit downside]

## Key Risks
1. [Risk 1 — specific, not generic]
2. [Risk 2]
3. [Risk 3]

## Strategic Recommendation
[Clear direction: DO / DON'T DO / DO WITH CONDITIONS]
[2-3 sentences of reasoning]

## First 3 Actions This Week
1. [Specific action]
2. [Specific action]
3. [Specific action]

## Confidence Score: [X]/100
[One line reasoning for confidence level]`;

  const filtered = activeCategory === "All"
    ? SCENARIOS
    : SCENARIOS.filter((s) => s.category === activeCategory);

  const run = async (q: string) => {
    if (!q.trim() || loading || !aiSettings) return;
    setAsked(q);
    setQuestion("");
    setResponse("");
    setLoading(true);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: q }],
          systemPrompt,
          provider: aiSettings.provider,
          apiKey: aiSettings.apiKey,
          model: aiSettings.model,
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const text = parseSSE(buf);
        if (text) { buf = ""; setResponse((p) => p + text); }
      }
    } catch {
      setResponse("Something went wrong. Check your API key in Settings.");
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const reset = () => { setAsked(""); setResponse(""); setQuestion(""); };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Decision Engine" />

      <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 53px)" }}>

        {/* Left Panel — Input */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col bg-surface">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch size={14} className="text-accent-bright" />
              <h2 className="text-sm font-semibold text-text-primary">Decision Engine</h2>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Ask any business question. Get scenario analysis, risk assessment, and a strategic recommendation.
            </p>
          </div>

          {/* Category filter */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                    activeCategory === cat
                      ? "border-accent bg-accent-dim text-accent-bright"
                      : "border-border text-muted hover:text-text-primary"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario chips */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1.5">
            {filtered.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  onClick={() => configured && run(s.label)}
                  disabled={!configured || loading}
                  className={cn(
                    "w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-xs transition-all",
                    configured && !loading
                      ? "border-border text-text-secondary hover:border-accent/40 hover:bg-surface-2 hover:text-text-primary"
                      : "border-border text-muted opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon size={12} className="text-muted flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Custom input */}
          <div className="p-3 border-t border-border space-y-2">
            {!configured && (
              <Link href="/dashboard/settings" className="block">
                <div className="text-xs text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 rounded-lg px-3 py-2">
                  ⚙ Configure API key in Settings first
                </div>
              </Link>
            )}
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(question); } }}
                placeholder={configured ? "Ask your own decision..." : "Add API key in Settings"}
                disabled={!configured}
                rows={2}
                className="flex-1 resize-none text-xs py-2"
              />
              <button
                onClick={() => run(question)}
                disabled={!question.trim() || loading || !configured}
                className={cn(
                  "px-3 rounded-lg transition-colors flex-shrink-0 self-end py-2",
                  question.trim() && !loading && configured ? "bg-accent text-white hover:bg-accent-bright" : "bg-surface-2 text-muted"
                )}
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel — Analysis Output */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {!asked ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12 hero-gradient">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 max-w-md"
              >
                <div className="w-16 h-16 rounded-2xl glass-accent border border-accent/30 flex items-center justify-center mx-auto float">
                  <GitBranch size={24} className="text-accent-bright" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">What do you want to decide?</h2>
                <p className="text-sm text-muted leading-relaxed">
                  Pick a scenario from the left or type your own question. You'll get a structured analysis with Bull/Base/Bear scenarios, key risks, and a clear recommendation.
                </p>
                <div className="flex items-center gap-2 justify-center text-xs text-muted">
                  <Bot size={12} />
                  <span>Powered by your business data + AI</span>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="p-8 max-w-3xl">
              {/* Question */}
              <div className="flex items-start gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GitBranch size={13} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text-primary mb-2">{asked}</p>
                    <button onClick={reset} className="text-muted hover:text-text-primary transition-colors p-1">
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Response */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-dim border border-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={13} className="text-accent-bright" />
                </div>
                <div className="flex-1 glass rounded-xl p-6">
                  {response ? (
                    <FormattedResponse content={response} />
                  ) : loading ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="flex gap-1">
                          {[0, 100, 200].map((d) => (
                            <span key={d} className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </span>
                        <span>Analysing scenarios...</span>
                      </div>
                      <div className="space-y-2">
                        {[80, 60, 90, 50, 70].map((w, i) => (
                          <div key={i} className="shimmer h-3 rounded" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div ref={bottomRef} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
