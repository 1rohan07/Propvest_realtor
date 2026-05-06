"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, ChevronDown, Sparkles, RotateCcw } from "lucide-react";
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
}

interface EmbeddedAgentProps {
  agentName: string;
  agentIcon?: React.ReactNode;
  systemPrompt: string;
  quickActions: QuickAction[];
  accentColor?: string;
}

function parseSSE(chunk: string, provider: string): string {
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

export default function EmbeddedAgent({
  agentName,
  agentIcon,
  systemPrompt,
  quickActions,
  accentColor = "text-accent-bright",
}: EmbeddedAgentProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const aiSettings = getAISettings();
  const configured = !!(aiSettings?.apiKey);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading || !aiSettings) return;

    const userMsg: Message = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages([...updated, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated,
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
        const text = parseSSE(buf, aiSettings.provider);
        if (text) {
          buf = "";
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + text };
            return copy;
          });
        }
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Something went wrong. Check your API key in Settings." };
        return copy;
      });
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mb-3 w-96 h-[520px] glass rounded-2xl border border-border flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent-dim border border-accent flex items-center justify-center">
                  {agentIcon ?? <Bot size={13} className="text-accent-bright" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">{agentName}</p>
                  <p className="text-[9px] text-muted">AI Agent · {aiSettings?.provider ?? "not configured"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button onClick={() => setMessages([])} className="text-muted hover:text-text-primary transition-colors">
                    <RotateCcw size={12} />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted hover:text-text-primary transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {messages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-3">Quick Actions</p>
                  {quickActions.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => configured ? send(qa.prompt) : null}
                      disabled={!configured}
                      className={cn(
                        "w-full text-left text-xs px-3 py-2.5 rounded-lg border transition-colors",
                        configured
                          ? "border-border text-text-secondary hover:border-accent/40 hover:text-text-primary hover:bg-surface-2"
                          : "border-border text-muted cursor-not-allowed opacity-50"
                      )}
                    >
                      <Sparkles size={10} className="inline mr-1.5 text-accent-bright" />
                      {qa.label}
                    </button>
                  ))}
                  {!configured && (
                    <Link href="/dashboard/settings" className="block mt-3">
                      <div className="text-xs text-center text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 rounded-lg px-3 py-2">
                        → Configure AI key in Settings
                      </div>
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                        m.role === "user" ? "bg-accent text-white" : "glass text-text-secondary"
                      )}>
                        {m.content || (loading && i === messages.length - 1 ? (
                          <span className="flex gap-1 items-center">
                            <span className="w-1 h-1 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1 h-1 bg-muted rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
                            <span className="w-1 h-1 bg-muted rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
                          </span>
                        ) : "—")}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={configured ? "Ask anything..." : "Configure AI key first"}
                  disabled={!configured}
                  className="flex-1 text-xs py-2"
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading || !configured}
                  className={cn(
                    "px-3 py-2 rounded-lg transition-colors",
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg hover:bg-accent-bright transition-colors relative"
      >
        {open ? <ChevronDown size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
        {!configured && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-bg" />
        )}
      </motion.button>
    </div>
  );
}
