"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getAISettings, setAISettings, clearAISettings,
  AIProvider, AISettings, PROVIDER_MODELS, getDefaultModel
} from "@/lib/ai";
import { getProfile } from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { Key, Check, ExternalLink, Trash2, Eye, EyeOff } from "lucide-react";

const PROVIDER_DOCS: Record<AIProvider, { label: string; url: string; hint: string }> = {
  claude: {
    label: "Claude (Anthropic)",
    url: "https://console.anthropic.com/settings/keys",
    hint: "Best for strategic analysis and nuanced business reasoning.",
  },
  openai: {
    label: "OpenAI (ChatGPT)",
    url: "https://platform.openai.com/api-keys",
    hint: "Great for content generation and general business tasks.",
  },
  perplexity: {
    label: "Perplexity AI",
    url: "https://www.perplexity.ai/settings/api",
    hint: "Excellent for real-time market research and trend intelligence.",
  },
  gemini: {
    label: "Gemini (Google)",
    url: "https://aistudio.google.com/app/apikey",
    hint: "Fast and capable for general advisor tasks.",
  },
};

export default function SettingsPage() {
  const [provider, setProvider] = useState<AIProvider>("claude");
  const [model, setModel] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<{ name: string; founderType: string } | null>(null);

  useEffect(() => {
    const existing = getAISettings();
    if (existing) {
      setProvider(existing.provider);
      setApiKey(existing.apiKey);
      setModel(existing.model ?? getDefaultModel(existing.provider));
    }
    const p = getProfile();
    if (p) setProfile({ name: p.name, founderType: p.founderType ?? "Founder" });
  }, []);

  const handleProviderChange = (p: AIProvider) => {
    setProvider(p);
    setModel(getDefaultModel(p));
  };

  const save = () => {
    if (!apiKey.trim()) return;
    const settings: AISettings = { provider, apiKey: apiKey.trim(), model };
    setAISettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const clear = () => {
    clearAISettings();
    setApiKey("");
    setProvider("claude");
    setModel(getDefaultModel("claude"));
  };

  const doc = PROVIDER_DOCS[provider];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Settings" />

      <div className="flex-1 p-6 max-w-2xl space-y-8">
        <SectionHeader title="Settings" subtitle="Configure your AI provider and account preferences" />

        <div className="glass rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Key size={15} className="text-accent-bright" />
            <h3 className="text-sm font-semibold text-text-primary">AI Provider</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(PROVIDER_DOCS) as AIProvider[]).map((p) => {
              const info = PROVIDER_DOCS[p];
              const models = PROVIDER_MODELS[p];
              return (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={cn(
                    "text-left px-4 py-3.5 rounded-xl border transition-all",
                    provider === p
                      ? "border-accent bg-accent-dim"
                      : "border-border hover:border-border hover:bg-surface-2"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-sm font-medium", provider === p ? "text-accent-bright" : "text-text-primary")}>
                      {models.label}
                    </span>
                    {provider === p && <Check size={12} className="text-accent-bright" />}
                  </div>
                  <p className="text-[11px] text-muted leading-snug">{info.hint}</p>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {PROVIDER_MODELS[provider].models.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted uppercase tracking-wider">API Key</label>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-accent-bright hover:underline"
              >
                Get key <ExternalLink size={10} />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${doc.label} API key...`}
                className="pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary transition-colors"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-muted mt-1.5">
              Your API key is stored locally in your browser. It is never sent to our servers.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={!apiKey.trim()}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
                saved
                  ? "bg-accent-dim border border-accent text-accent-bright"
                  : apiKey.trim()
                  ? "bg-accent text-white hover:bg-accent-bright"
                  : "bg-surface-2 text-muted cursor-not-allowed"
              )}
            >
              {saved ? "Saved ✓" : "Save Configuration"}
            </button>
            {apiKey && (
              <button onClick={clear} className="px-4 py-3 rounded-xl border border-border text-muted hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {profile && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Founder Profile</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Name</span>
                <span className="text-text-primary">{profile.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Founder Type</span>
                <span className="text-text-primary">{profile.founderType}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
