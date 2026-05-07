"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, X, ChevronDown, Sparkles, RotateCcw,
  Maximize2, Minimize2, Copy, Check
} from "lucide-react";
import { getAISettings } from "@/lib/ai";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface QuickAction {
  label: string;
  prompt: string;
  category?: string;
}

interface EmbeddedAgentProps {
  agentName: string;
  agentIcon?: React.ReactNode;
  systemPrompt: string;
  quickActions: QuickAction[];
  badge?: string;
}

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

function FormattedMessage({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lines = content.split("\n");
  const rendered = lines.map((line, i) => {
    if (line.startsWith("### ")) return <p key={i} className="font-semibold text-accent-bright text-xs mt-2 mb-0.5">{line.slice(4)}</p>;
    if (line.startsWith("## ")) return <p key={i} className="font-bold text-text-primary text-xs mt-3 mb-1">{line.slice(3)}</p>;
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-text-primary text-xs">{line.slice(2, -2)}</p>;
    if (line.startsWith("- ") || line.startsWith("• ")) return <div key={i} className="flex gap-1.5 text-xs text-text-secondary"><span className="text-accent-bright mt-0.5 flex-shrink-0">•</span><span>{line.slice(2)}</span></div>;
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\.\s(.*)/)!;
      return <div key={i} className="flex gap-1.5 text-xs text-text-secondary"><span className="text-accent font-medium flex-shrink-0 w-4">{num[1]}.</span><span>{num[2]}</span></div>;
    }
    if (line === "") return <div key={i} className="h-1.5" />;
    return <p key={i} className="text-xs text-text-secondary leading-relaxed">{line}</p>;
  });

  return (
    <div className="group relative">
      <div className="space-y-0.5">{rendered}</div>
      <button
        onClick={copy}
        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-border rounded p-1"
      >
        {copied ? <Check size={9} className="text-accent-bright" /> : <Copy size={9} className="text-muted" />}
      </button>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  "Content": "text-purple-400 border-purple-400/20 bg-purple-400/5",
  "Strategy": "text-blue-400 border-blue-400/20 bg-blue-400/5",
  "Analysis": "text-orange-400 border-orange-400/20 bg-orange-400/5",
  "Growth": "text-accent-bright border-accent/20 bg-accent-dim",
  "Operations": "text-yellow-400 border-yellow-400/20 bg-yellow-400/5",
  "Finance": "text-green-400 border-green-400/20 bg-green-400/5",
};

export default function EmbeddedAgent({
  agentName,
  agentIcon,
  systemPrompt,
  quickActions,
  badge,
}: EmbeddedAgentProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aiSettings = getAISettings();
  const configured = !!(aiSettings?.apiKey);

  const categories = [...new Set(quickActions.map((q) => q.category).filter(Boolean))] as string[];
  const filtered = activeCategory
    ? quickActions.filter((q) => q.category === activeCategory)
    : quickActions;

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading || !aiSettings) return;

    const userMsg: Message = { role: "user", content: msg };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
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
        if (text) {
          buf = "";
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "assistant",
              content: copy[copy.length - 1].content + text,
            };
            return copy;
          });
        }
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Check your API key in Settings.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  };

  const width = expanded ? "w-[640px]" : "w-96";
  const height = expanded ? "h-[700px]" : "h-[540px]";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn("mb-3 glass rounded-2xl border border-border flex flex-col shadow-2xl transition-all duration-200", width, height)}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent flex items-center justify-center flex-shrink-0">
                  {agentIcon ?? <Bot size={13} className="text-accent-bright" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-text-primary">{agentName}</p>
                    {badge && <span className="text-[9px] bg-accent text-white px-1.5 py-0.5 rounded-full">{badge}</span>}
                  </div>
                  <p className="text-[9px] text-muted">{aiSettings?.provider ? `${aiSettings.provider} · ${aiSettings.model?.split("-").slice(0, 2).join(" ")}` : "not configured"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <button onClick={() => setMessages([])} title="New chat" className="p-1 text-muted hover:text-text-primary transition-colors rounded">
                    <RotateCcw size={11} />
                  </button>
                )}
                <button onClick={() => setExpanded(!expanded)} title="Expand" className="p-1 text-muted hover:text-text-primary transition-colors rounded">
                  {expanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                </button>
                <button onClick={() => setOpen(false)} className="p-1 text-muted hover:text-text-primary transition-colors rounded">
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {messages.length === 0 ? (
                <div className="p-4 space-y-3">
                  {!configured && (
                    <Link href="/dashboard/settings" className="block">
                      <div className="flex items-center gap-2 text-xs text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 rounded-lg px-3 py-2.5">
                        <span className="text-base">⚙</span>
                        <div>
                          <p className="font-medium">API key not configured</p>
                          <p className="text-[10px] text-yellow-300/70">Click to add your Claude / OpenAI / Gemini key in Settings</p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setActiveCategory(null)}
                        className={cn("text-[10px] px-2.5 py-1 rounded-full border transition-colors", !activeCategory ? "border-accent bg-accent-dim text-accent-bright" : "border-border text-muted hover:text-text-primary")}
                      >
                        All
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                          className={cn("text-[10px] px-2.5 py-1 rounded-full border transition-colors", activeCategory === cat ? (CATEGORY_COLORS[cat] ?? "border-accent bg-accent-dim text-accent-bright") : "border-border text-muted hover:text-text-primary")}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {filtered.map((qa) => (
                      <button
                        key={qa.label}
                        onClick={() => configured && send(qa.prompt)}
                        disabled={!configured}
                        className={cn(
                          "w-full text-left text-xs px-3 py-2.5 rounded-lg border transition-all",
                          configured
                            ? "border-border text-text-secondary hover:border-accent/50 hover:text-text-primary hover:bg-surface-2"
                            : "border-border text-muted cursor-not-allowed opacity-40"
                        )}
                      >
                        <Sparkles size={9} className="inline mr-1.5 text-accent-bright" />
                        {qa.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      {m.role === "assistant" && (
                        <div className="w-5 h-5 rounded bg-accent-dim border border-accent flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                          <Bot size={10} className="text-accent-bright" />
                        </div>
                      )}
                      <div className={cn(
                        "rounded-xl px-3 py-2.5",
                        m.role === "user"
                          ? "max-w-[80%] bg-accent text-white text-xs"
                          : "flex-1 glass"
                      )}>
                        {m.role === "user" ? (
                          <p className="text-xs">{m.content}</p>
                        ) : m.content ? (
                          <FormattedMessage content={m.content} />
                        ) : loading && i === messages.length - 1 ? (
                          <span className="flex gap-1 items-center py-0.5">
                            {[0, 120, 240].map((d) => (
                              <span key={d} className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex-shrink-0">
              {messages.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {quickActions.slice(0, 3).map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => configured && send(qa.prompt)}
                      disabled={!configured || loading}
                      className="text-[10px] px-2 py-0.5 rounded border border-border text-muted hover:text-text-primary hover:border-accent/30 transition-colors"
                    >
                      {qa.label.split(" ").slice(0, 4).join(" ")}…
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={configured ? "Ask anything — I'll give you a complete answer..." : "Add API key in Settings first"}
                  disabled={!configured}
                  className="flex-1 text-xs py-2"
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading || !configured}
                  className={cn(
                    "px-3 py-2 rounded-lg transition-colors flex-shrink-0",
                    input.trim() && !loading && configured
                      ? "bg-accent text-white hover:bg-accent-bright"
                      : "bg-surface-2 text-muted cursor-not-allowed"
                  )}
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => { setOpen(!open); if (!open) setTimeout(() => inputRef.current?.focus(), 300); }}
        className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-xl hover:bg-accent-bright transition-colors relative"
        title={agentName}
      >
        {open ? <ChevronDown size={18} className="text-white" /> : (agentIcon ? <span className="text-white">{agentIcon}</span> : <Bot size={18} className="text-white" />)}
        {!configured && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full border-2 border-bg animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
