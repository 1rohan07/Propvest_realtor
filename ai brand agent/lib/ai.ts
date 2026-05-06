export type AIProvider = "claude" | "openai" | "perplexity" | "gemini";

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export const PROVIDER_MODELS: Record<AIProvider, { label: string; models: { id: string; label: string }[] }> = {
  claude: {
    label: "Claude (Anthropic)",
    models: [
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Recommended)" },
      { id: "claude-opus-4-7", label: "Claude Opus 4.7 (Most Powerful)" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Fast)" },
    ],
  },
  openai: {
    label: "OpenAI (ChatGPT)",
    models: [
      { id: "gpt-4o", label: "GPT-4o (Recommended)" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini (Fast)" },
      { id: "o1-mini", label: "o1 Mini (Reasoning)" },
    ],
  },
  perplexity: {
    label: "Perplexity AI",
    models: [
      { id: "llama-3.1-sonar-large-128k-online", label: "Sonar Large (Online)" },
      { id: "llama-3.1-sonar-small-128k-online", label: "Sonar Small (Fast)" },
    ],
  },
  gemini: {
    label: "Gemini (Google)",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Recommended)" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
  },
};

const AI_SETTINGS_KEY = "ai_settings";

export function getAISettings(): AISettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAISettings(settings: AISettings): void {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

export function clearAISettings(): void {
  localStorage.removeItem(AI_SETTINGS_KEY);
}

export function hasAIConfigured(): boolean {
  const s = getAISettings();
  return !!(s?.apiKey && s?.provider);
}

export function getDefaultModel(provider: AIProvider): string {
  return PROVIDER_MODELS[provider].models[0].id;
}
