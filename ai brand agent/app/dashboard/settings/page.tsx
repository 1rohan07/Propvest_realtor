"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getAISettings, setAISettings, clearAISettings,
  AIProvider, AISettings, PROVIDER_MODELS, getDefaultModel
} from "@/lib/ai";
import { getProfile, getRevenue, getHabits, getTasks, getContacts, getGoals } from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { Key, Check, ExternalLink, Trash2, Eye, EyeOff, Download, Upload, Database } from "lucide-react";
import { useRef } from "react";

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

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const [provider, setProvider] = useState<AIProvider>("claude");
  const [model, setModel] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<{ name: string; founderType: string } | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const importRef = useRef<HTMLInputElement>(null);

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

  const exportAllData = () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      try {
        data[key] = JSON.parse(localStorage.getItem(key) ?? "null");
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(JSON.stringify(data, null, 2), `founder-os-export-${date}.json`, "application/json");
  };

  const exportRevenueCSV = () => {
    const revenue = getRevenue();
    if (revenue.length === 0) return;
    const header = "date,amount,source,note";
    const rows = revenue.map((e) => `${e.date},${e.amount},"${e.source}","${(e.note ?? "").replace(/"/g, '""')}"`);
    const date = new Date().toISOString().slice(0, 10);
    downloadBlob([header, ...rows].join("\n"), `revenue-${date}.csv`, "text/csv");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (typeof data !== "object" || data === null) throw new Error("Invalid format");
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        }
        setImportStatus("success");
        setTimeout(() => setImportStatus("idle"), 3000);
      } catch {
        setImportStatus("error");
        setTimeout(() => setImportStatus("idle"), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const dataSummary = {
    revenue: getRevenue().length,
    habits: getHabits().length,
    tasks: getTasks().length,
    contacts: getContacts().length,
    goals: getGoals().length,
  };

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

        {/* Data Export / Import */}
        <div className="glass rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-accent-bright" />
            <h3 className="text-sm font-semibold text-text-primary">Data Management</h3>
          </div>

          {/* Data summary */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Revenue entries", value: dataSummary.revenue },
              { label: "Habit days", value: dataSummary.habits },
              { label: "Tasks", value: dataSummary.tasks },
              { label: "Contacts", value: dataSummary.contacts },
              { label: "Goals", value: dataSummary.goals },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface-2 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{value}</p>
                <p className="text-[10px] text-muted leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={exportAllData}
                className="flex items-center gap-2 flex-1 justify-center py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors"
              >
                <Download size={14} /> Export All Data (JSON)
              </button>
              <button
                onClick={exportRevenueCSV}
                disabled={dataSummary.revenue === 0}
                className={cn(
                  "flex items-center gap-2 flex-1 justify-center py-2.5 rounded-xl border text-sm transition-colors",
                  dataSummary.revenue > 0
                    ? "border-border text-text-secondary hover:text-text-primary hover:border-accent/40"
                    : "border-border text-muted cursor-not-allowed"
                )}
              >
                <Download size={14} /> Export Revenue CSV
              </button>
            </div>

            <div>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => importRef.current?.click()}
                className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:text-text-primary hover:border-yellow-400/40 transition-colors"
              >
                <Upload size={14} /> Import Data (JSON) — overwrites existing
              </button>
              {importStatus === "success" && (
                <p className="text-xs text-accent-bright text-center mt-1.5">Data imported successfully. Refresh to see changes.</p>
              )}
              {importStatus === "error" && (
                <p className="text-xs text-red-400 text-center mt-1.5">Import failed — invalid JSON file.</p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-muted">
            All data is stored locally in your browser. Export regularly to back up your data.
          </p>
        </div>
      </div>
    </div>
  );
}
