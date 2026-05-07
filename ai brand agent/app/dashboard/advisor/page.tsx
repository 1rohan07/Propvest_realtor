"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProfile, getAdvisorHistory, setAdvisorHistory, clearAdvisorHistory, AdvisorMessage } from "@/lib/storage";
import { getAISettings, hasAIConfigured } from "@/lib/ai";
import { FounderProfile } from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
import { Bot, Send, Settings, TrendingUp, Target, Megaphone, Lightbulb, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Mode = "strategic" | "coach" | "brand" | "analyst";
type Message = { role: "user" | "assistant"; content: string };

const MODES: { key: Mode; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { key: "strategic", label: "Strategic Advisor", icon: <TrendingUp size={15} />, description: "Revenue strategy, growth levers, market positioning", color: "border-accent/40 bg-accent-dim text-accent-bright" },
  { key: "coach", label: "Discipline Coach", icon: <Target size={15} />, description: "Accountability, execution habits, time management", color: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  { key: "brand", label: "Brand Manager", icon: <Megaphone size={15} />, description: "Content strategy, social growth, brand voice", color: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
  { key: "analyst", label: "Opportunity Analyst", icon: <Lightbulb size={15} />, description: "Trend spotting, competitor intelligence, white-space", color: "border-orange-500/30 bg-orange-500/10 text-orange-400" },
];

const QUICK_PROMPTS: Record<Mode, string[]> = {
  strategic: [
    "What's my fastest path to 10x revenue from here?",
    "Analyse my bottleneck and give me a 30-day fix plan",
    "What business model changes could unlock more revenue?",
  ],
  coach: [
    "I've been inconsistent. How do I fix my daily routine?",
    "Build me a morning routine for peak performance",
    "I'm procrastinating on sales. Hold me accountable.",
  ],
  brand: [
    "Write 5 Instagram caption hooks for my brand",
    "What content strategy would grow me from 1K to 10K followers?",
    "Analyse my brand positioning and suggest improvements",
  ],
  analyst: [
    "What are the biggest white-space opportunities in D2C India right now?",
    "Analyse my competitors and find my differentiation angle",
    "What emerging trends should I be watching in my sector?",
  ],
};

function buildSystemPrompt(profile: FounderProfile | null, mode: Mode): string {
  const base = profile
    ? `You are an elite advisor for ${profile.name}, a ${profile.founderType ?? "founder"} in the ${profile.businessType ?? "business"} space.
Current stage: ${profile.stage} | Revenue: ${profile.currentRevenue} → Target: ${profile.targetRevenue}
Main bottleneck: ${profile.mainBottleneck} | Team: ${profile.teamSize}
Brand positioning: ${profile.brandPositioning}
Peak productivity window: ${profile.peakProductivityWindow}
`
    : "You are an elite founder advisor. The founder has not completed their profile yet.";

  const modeInstructions: Record<Mode, string> = {
    strategic: "Act as a world-class business strategist. Be direct, data-driven, and focus on leverage points and revenue growth. Give actionable 30/90-day frameworks.",
    coach: "Act as a high-performance discipline coach. Be direct, honest, and accountability-focused. Don't coddle. Push the founder to execute.",
    brand: "Act as a premium brand strategist and content director. Focus on positioning, storytelling, platform growth, and brand differentiation.",
    analyst: "Act as a market intelligence analyst. Identify trends, white spaces, competitor weaknesses, and emerging opportunities the founder can capitalise on.",
  };

  return `${base}\nYour role: ${modeInstructions[mode]}\n\nBe concise, sharp, and specific. Avoid generic advice. Reference the founder's actual context.`;
}

function buildClaudeTextFromSSE(chunk: string): string {
  const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
  let text = "";
  for (const line of lines) {
    const data = line.replace("data: ", "").trim();
    if (data === "[DONE]" || data === "") continue;
    try {
      const obj = JSON.parse(data);
      if (obj.type === "content_block_delta" && obj.delta?.text) text += obj.delta.text;
      if (obj.choices?.[0]?.delta?.content) text += obj.choices[0].delta.content;
      if (obj.candidates?.[0]?.content?.parts?.[0]?.text) text += obj.candidates[0].content.parts[0].text;
    } catch {}
  }
  return text;
}

export default function AdvisorPage() {
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [mode, setMode] = useState<Mode>("strategic");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfile(getProfile());
    setConfigured(hasAIConfigured());
    // Restore chat history
    const history = getAdvisorHistory();
    if (history.length > 0) {
      setMode((history[history.length - 1].mode as Mode) ?? "strategic");
      setMessages(history.map(({ role, content }) => ({ role, content })));
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const persistHistory = (msgs: Message[], currentMode: Mode) => {
    const withMode: AdvisorMessage[] = msgs.map((m) => ({ ...m, mode: currentMode }));
    setAdvisorHistory(withMode);
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const aiSettings = getAISettings();
    if (!aiSettings?.apiKey) { setConfigured(false); return; }

    const userMsg: Message = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: buildSystemPrompt(profile, mode),
          provider: aiSettings.provider,
          apiKey: aiSettings.apiKey,
          model: aiSettings.model,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const text = buildClaudeTextFromSSE(buffer);
        if (text) {
          buffer = "";
          finalContent += text;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: updated[updated.length - 1].content + text };
            return updated;
          });
        }
      }

      // Persist after response complete
      setMessages((prev) => {
        persistHistory(prev, mode);
        return prev;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please check your API key in Settings." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    clearAdvisorHistory();
    setMessages([]);
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    // Don't clear messages on mode switch — user can continue cross-mode
  };

  const activeMode = MODES.find((m) => m.key === mode)!;

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="AI Advisor" />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 border-r border-border p-3 space-y-2 overflow-y-auto flex flex-col">
          <p className="text-[10px] text-muted uppercase tracking-wider px-2 mb-3">Advisor Mode</p>
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => handleModeChange(m.key)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg border text-xs transition-colors",
                mode === m.key ? m.color : "border-transparent text-muted hover:text-text-primary hover:bg-surface-2"
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                {m.icon}
                <span className="font-medium">{m.label}</span>
              </div>
              <p className="text-[10px] text-muted leading-snug">{m.description}</p>
            </button>
          ))}

          <div className="mt-auto pt-4 border-t border-border space-y-1">
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted hover:text-red-400 hover:bg-surface-2 transition-colors"
              >
                <Trash2 size={11} />
                <span>Clear History</span>
                <span className="ml-auto text-[9px]">{messages.length} msgs</span>
              </button>
            )}
            {!configured && (
              <Link href="/dashboard/settings" className="block">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 text-xs">
                  <Settings size={12} />
                  <span>Configure AI Key</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-accent-dim border border-accent flex items-center justify-center">
                <Bot size={20} className="text-accent-bright" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-text-primary mb-1">{activeMode.label}</h3>
                <p className="text-xs text-muted">{activeMode.description}</p>
              </div>
              <div className="space-y-2 w-full max-w-md">
                {QUICK_PROMPTS[mode].map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="w-full text-left glass rounded-lg px-4 py-3 text-sm text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed",
                        m.role === "user" ? "bg-accent text-white" : "glass text-text-secondary"
                      )}
                    >
                      {m.content || (loading && i === messages.length - 1 ? (
                        <span className="flex gap-1">
                          {[0, 150, 300].map((d) => (
                            <span key={d} className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </span>
                      ) : "")}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}

          <div className="p-4 border-t border-border">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={configured ? `Ask your ${activeMode.label}...` : "Configure AI key in Settings first →"}
                disabled={!configured}
                className="flex-1"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading || !configured}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5",
                  input.trim() && !loading && configured
                    ? "bg-accent text-white hover:bg-accent-bright"
                    : "bg-surface-2 text-muted cursor-not-allowed"
                )}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
