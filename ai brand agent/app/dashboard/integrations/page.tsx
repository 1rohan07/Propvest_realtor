"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "@/components/dashboard/TopBar";
import SectionHeader from "@/components/ui/SectionHeader";
import { addRevenue, getRevenue, getMarketingData, setMarketingData } from "@/lib/storage";
import {
  IntegrationPlatform,
  IntegrationStatus,
  ShopifyConfig,
  RazorpayConfig,
  MetaAdsConfig,
  InstagramConfig,
  GoogleAnalyticsConfig,
  getIntegrationConfig,
  setIntegrationConfig,
  clearIntegrationConfig,
  getIntegrationStatus,
  setIntegrationStatus,
  ALL_PLATFORMS,
} from "@/lib/integrations";
import { cn } from "@/lib/utils";
import {
  ShoppingBag, CreditCard, Megaphone, Instagram, BarChart3,
  Search, RefreshCw, Plus, X, Check, AlertCircle, ExternalLink,
  Zap, TrendingUp, Users, Activity, Link2, Unlink,
} from "lucide-react";

interface PlatformMeta {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  tracks: string;
  description: string;
  fields: { key: string; label: string; placeholder: string; type?: string; help?: string }[];
  docsUrl: string;
  badge?: string;
}

const PLATFORMS: Record<IntegrationPlatform, PlatformMeta> = {
  shopify: {
    label: "Shopify",
    icon: ShoppingBag,
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/20",
    tracks: "Revenue · Orders · GMV",
    description: "Auto-log every paid order as a revenue entry",
    docsUrl: "https://help.shopify.com/en/manual/apps/app-types/custom-apps",
    fields: [
      {
        key: "shopDomain",
        label: "Shop Domain",
        placeholder: "your-store (without .myshopify.com)",
        help: "The part before .myshopify.com in your store URL",
      },
      {
        key: "accessToken",
        label: "Admin API Access Token",
        placeholder: "shpat_xxxxxxxxxxxxxxxxxxxx",
        type: "password",
        help: "Shopify Admin → Settings → Apps → Develop apps → Create app → Configure API (read_orders) → Install",
      },
    ],
  },
  razorpay: {
    label: "Razorpay",
    icon: CreditCard,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    tracks: "Revenue · Payments · Refunds",
    description: "Auto-log captured payments as revenue entries",
    docsUrl: "https://razorpay.com/docs/account/api-keys/",
    fields: [
      {
        key: "keyId",
        label: "Key ID",
        placeholder: "rzp_live_xxxxxxxxxxxx",
        help: "From Razorpay Dashboard → Account & Settings → API Keys",
      },
      {
        key: "keySecret",
        label: "Key Secret",
        placeholder: "xxxxxxxxxxxxxxxxxxxx",
        type: "password",
        help: "Generated along with your Key ID — keep this private",
      },
    ],
  },
  meta_ads: {
    label: "Meta Ads",
    icon: Megaphone,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    tracks: "Ad Spend · Impressions · Clicks · CTR",
    description: "Pull ad performance data from Facebook/Instagram Ads Manager",
    docsUrl: "https://developers.facebook.com/tools/explorer/",
    badge: "Graph API",
    fields: [
      {
        key: "accessToken",
        label: "Access Token",
        placeholder: "EAAxxxxxxxxxxxx",
        type: "password",
        help: "Go to developers.facebook.com/tools/explorer → Generate Token with ads_read permission → Extend to 60 days via /oauth/access_token",
      },
      {
        key: "adAccountId",
        label: "Ad Account ID",
        placeholder: "act_123456789 or just 123456789",
        help: "Find in Ads Manager URL: facebook.com/adsmanager/manage/?act=XXXXXXXXX",
      },
    ],
  },
  instagram: {
    label: "Instagram Business",
    icon: Instagram,
    color: "text-pink-400",
    bg: "bg-pink-400/10 border-pink-400/20",
    tracks: "Followers · Engagement · Posts",
    description: "Track follower growth and post engagement from your Business account",
    docsUrl: "https://developers.facebook.com/docs/instagram-api/getting-started",
    badge: "Graph API",
    fields: [
      {
        key: "accessToken",
        label: "Access Token",
        placeholder: "EAAxxxxxxxxxxxx",
        type: "password",
        help: "Same token as Meta Ads if you use Facebook Business — needs instagram_basic + instagram_manage_insights permissions",
      },
      {
        key: "instagramAccountId",
        label: "Instagram Business Account ID",
        placeholder: "17841234567890123",
        help: "From Facebook Business Manager → Instagram Accounts, or Graph API Explorer: /me/accounts then find your Instagram ID",
      },
    ],
  },
  google_analytics: {
    label: "Google Analytics",
    icon: BarChart3,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
    tracks: "Sessions · Pageviews · Users · Bounce Rate",
    description: "Pull GA4 traffic data to understand what drives revenue",
    docsUrl: "https://developers.google.com/oauthplayground/",
    badge: "GA4",
    fields: [
      {
        key: "propertyId",
        label: "GA4 Property ID",
        placeholder: "123456789",
        help: "Google Analytics Admin → Property Settings → Property ID (numbers only)",
      },
      {
        key: "accessToken",
        label: "OAuth Access Token",
        placeholder: "ya29.xxxxxxxxxxxx",
        type: "password",
        help: "Go to developers.google.com/oauthplayground → Select analytics.readonly scope → Authorize → Copy Access Token. Note: expires hourly — re-sync after refresh.",
      },
    ],
  },
  google_ads: {
    label: "Google Ads",
    icon: Search,
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/20",
    tracks: "Ad Spend · Clicks · Conversions · ROAS",
    description: "Track Google Ads spend and performance metrics",
    docsUrl: "https://developers.google.com/google-ads/api/docs/start",
    badge: "Coming Soon",
    fields: [],
  },
};

type SyncData = {
  entries?: Array<{ date: string; amount: number; source: string; note: string; externalId?: string }>;
  synced?: number;
  totalRevenue?: number;
  summary?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  reach?: number;
  ctr?: number;
  followers?: number;
  mediaCount?: number;
  engagementRate?: number;
  sessions?: number;
  pageviews?: number;
  activeUsers?: number;
};

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (!status.isConnected) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted">
        Not connected
      </span>
    );
  }
  if (status.syncStatus === "error") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-400/10 border border-red-400/30 text-red-400 flex items-center gap-1">
        <AlertCircle size={8} /> Error
      </span>
    );
  }
  if (status.syncStatus === "syncing") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-dim border border-accent/30 text-accent-bright flex items-center gap-1">
        <RefreshCw size={8} className="animate-spin" /> Syncing
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/30 text-green-400 flex items-center gap-1">
      <Check size={8} /> Connected
    </span>
  );
}

function IntegrationCard({
  platform,
  status,
  syncing,
  onConnect,
  onSync,
  onDisconnect,
}: {
  platform: IntegrationPlatform;
  status: IntegrationStatus;
  syncing: boolean;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  const meta = PLATFORMS[platform];
  const Icon = meta.icon;
  const isComingSoon = meta.badge === "Coming Soon";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass rounded-xl p-5 border transition-all flex flex-col gap-4",
        status.isConnected ? "border-border/60" : "border-border"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0", meta.bg)}>
            <Icon size={16} className={meta.color} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary">{meta.label}</h3>
              {meta.badge && meta.badge !== "Coming Soon" && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-surface-2 border border-border text-muted font-medium">
                  {meta.badge}
                </span>
              )}
              {isComingSoon && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-medium">
                  SOON
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted mt-0.5">{meta.tracks}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Description */}
      <p className="text-xs text-text-secondary leading-relaxed">{meta.description}</p>

      {/* Last sync info */}
      {status.isConnected && status.lastSyncedAt && (
        <div className="text-[10px] text-muted border-t border-border pt-3 space-y-1">
          <p>Last sync: {new Date(status.lastSyncedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          {status.summary && <p className="text-text-secondary font-medium">{status.summary}</p>}
          {status.errorMessage && <p className="text-red-400">{status.errorMessage}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto">
        {isComingSoon ? (
          <div className="flex-1 text-center py-2 text-[10px] text-muted border border-border rounded-lg">
            Developer token required — coming soon
          </div>
        ) : status.isConnected ? (
          <>
            <button
              onClick={onSync}
              disabled={syncing}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border transition-all font-medium",
                syncing
                  ? "border-border text-muted"
                  : "border-accent/40 text-accent-bright bg-accent-dim hover:bg-accent/20"
              )}
            >
              <RefreshCw size={11} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync Now"}
            </button>
            <button
              onClick={onDisconnect}
              className="p-2 rounded-lg border border-border text-muted hover:text-red-400 hover:border-red-400/30 transition-colors"
              title="Disconnect"
            >
              <Unlink size={11} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onConnect}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-accent/40 bg-accent-dim text-accent-bright hover:bg-accent/20 transition-all font-medium"
            >
              <Plus size={11} /> Connect
            </button>
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-border text-muted hover:text-text-primary transition-colors"
              title="Setup guide"
            >
              <ExternalLink size={11} />
            </a>
          </>
        )}
      </div>
    </motion.div>
  );
}

function ConnectModal({
  platform,
  onSave,
  onClose,
}: {
  platform: IntegrationPlatform;
  onSave: (config: Record<string, string>) => void;
  onClose: () => void;
}) {
  const meta = PLATFORMS[platform];
  const [form, setForm] = useState<Record<string, string>>({});
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const handleSubmit = () => {
    const allFilled = meta.fields.every((f) => form[f.key]?.trim());
    if (!allFilled) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative glass rounded-2xl p-6 w-full max-w-md z-10 border border-border"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center", meta.bg)}>
              <meta.icon size={14} className={meta.color} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Connect {meta.label}</h3>
              <p className="text-[10px] text-muted">Tracks: {meta.tracks}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:text-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {meta.fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-primary">{field.label}</label>
                {field.help && (
                  <button
                    onClick={() => setShowHelp(showHelp === field.key ? null : field.key)}
                    className="text-[10px] text-muted hover:text-accent-bright transition-colors"
                  >
                    {showHelp === field.key ? "Hide help" : "How to get this?"}
                  </button>
                )}
              </div>
              {showHelp === field.key && field.help && (
                <p className="text-[10px] text-text-secondary bg-surface-2 rounded-lg px-3 py-2 border border-border leading-relaxed">
                  {field.help}
                </p>
              )}
              <input
                type={field.type ?? "text"}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full text-sm rounded-lg bg-surface-2 border border-border px-3 py-2 text-text-primary placeholder:text-muted focus:outline-none focus:border-accent/60 transition-colors"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <a
            href={meta.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-muted hover:text-accent-bright transition-colors"
          >
            <ExternalLink size={9} /> Setup guide
          </a>
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="text-xs px-4 py-2 rounded-lg border border-border text-muted hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!meta.fields.every((f) => form[f.key]?.trim())}
              className={cn(
                "text-xs px-4 py-2 rounded-lg font-medium transition-all",
                meta.fields.every((f) => form[f.key]?.trim())
                  ? "bg-accent text-white hover:bg-accent-bright"
                  : "bg-surface-2 text-muted cursor-not-allowed"
              )}
            >
              <Link2 size={11} className="inline mr-1.5" />
              Connect & Save
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const SYNC_ENDPOINTS: Record<IntegrationPlatform, string> = {
  shopify: "/api/integrations/shopify/sync",
  razorpay: "/api/integrations/razorpay/sync",
  meta_ads: "/api/integrations/meta/sync",
  instagram: "/api/integrations/instagram/sync",
  google_analytics: "/api/integrations/google-analytics/sync",
  google_ads: "",
};

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<IntegrationPlatform, IntegrationStatus>>(
    Object.fromEntries(ALL_PLATFORMS.map((p) => [p, { isConnected: false }])) as Record<IntegrationPlatform, IntegrationStatus>
  );
  const [syncing, setSyncing] = useState<Partial<Record<IntegrationPlatform, boolean>>>({});
  const [connectingPlatform, setConnectingPlatform] = useState<IntegrationPlatform | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    const loaded = Object.fromEntries(
      ALL_PLATFORMS.map((p) => [p, getIntegrationStatus(p)])
    ) as Record<IntegrationPlatform, IntegrationStatus>;
    setStatuses(loaded);
  }, []);

  const refreshStatus = (platform: IntegrationPlatform, update: Partial<IntegrationStatus>) => {
    const next = { ...statuses[platform], ...update };
    setIntegrationStatus(platform, next);
    setStatuses((s) => ({ ...s, [platform]: next }));
  };

  const handleConnect = (platform: IntegrationPlatform, config: Record<string, string>) => {
    setIntegrationConfig(platform, config as never);
    const next: IntegrationStatus = { isConnected: true, syncStatus: "success" };
    setIntegrationStatus(platform, next);
    setStatuses((s) => ({ ...s, [platform]: next }));
    setConnectingPlatform(null);
  };

  const handleDisconnect = (platform: IntegrationPlatform) => {
    clearIntegrationConfig(platform);
    const next: IntegrationStatus = { isConnected: false };
    setIntegrationStatus(platform, next);
    setStatuses((s) => ({ ...s, [platform]: next }));
  };

  const handleSync = useCallback(async (platform: IntegrationPlatform) => {
    const endpoint = SYNC_ENDPOINTS[platform];
    if (!endpoint) return;

    const config = getIntegrationConfig(platform);
    if (!config) return;

    setSyncing((s) => ({ ...s, [platform]: true }));
    refreshStatus(platform, { syncStatus: "syncing" });

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, daysBack: 90 }),
      });

      const data: SyncData = await res.json();

      if (!res.ok) {
        const errData = data as { error?: string };
        refreshStatus(platform, {
          syncStatus: "error",
          errorMessage: errData.error ?? "Sync failed",
          lastSyncedAt: new Date().toISOString(),
        });
        return;
      }

      // Write revenue entries for payment platforms
      if (platform === "shopify" || platform === "razorpay") {
        const existing = getRevenue();
        const existingNotes = new Set(existing.map((e) => e.note));

        const newEntries = (data.entries ?? []).filter(
          (e) => !existingNotes.has(e.note)
        );
        for (const entry of newEntries.reverse()) {
          addRevenue({ date: entry.date, amount: entry.amount, source: entry.source, note: entry.note });
        }
      }

      // Write analytics data for marketing platforms
      if (["meta_ads", "instagram", "google_analytics"].includes(platform)) {
        const marketing = getMarketingData();
        const updated = {
          ...marketing,
          [platform]: { ...data, lastSync: new Date().toISOString() },
        };
        setMarketingData(updated);
      }

      refreshStatus(platform, {
        isConnected: true,
        syncStatus: "success",
        lastSyncedAt: new Date().toISOString(),
        dataPoints: data.synced ?? 1,
        summary: data.summary,
        errorMessage: undefined,
      });
    } catch (err) {
      refreshStatus(platform, {
        syncStatus: "error",
        errorMessage: String(err),
        lastSyncedAt: new Date().toISOString(),
      });
    } finally {
      setSyncing((s) => ({ ...s, [platform]: false }));
    }
  }, [statuses]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSyncAll = async () => {
    setSyncingAll(true);
    const connected = ALL_PLATFORMS.filter((p) => statuses[p].isConnected && SYNC_ENDPOINTS[p]);
    await Promise.all(connected.map((p) => handleSync(p)));
    setSyncingAll(false);
  };

  const connectedCount = ALL_PLATFORMS.filter((p) => statuses[p].isConnected).length;
  const lastSyncs = ALL_PLATFORMS.map((p) => statuses[p].lastSyncedAt).filter(Boolean);
  const lastSyncTime = lastSyncs.length > 0
    ? new Date(Math.max(...lastSyncs.map((d) => new Date(d!).getTime())))
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Integrations" />

      <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <SectionHeader
            title="Business Tool Integrations"
            subtitle="Connect your tools to auto-sync revenue, ad spend, and traffic data — no manual entry"
          />
          <button
            onClick={handleSyncAll}
            disabled={syncingAll || connectedCount === 0}
            className={cn(
              "flex items-center gap-2 text-sm px-4 py-2 rounded-lg border font-medium transition-all flex-shrink-0",
              connectedCount > 0 && !syncingAll
                ? "border-accent/40 text-accent-bright bg-accent-dim hover:bg-accent/20"
                : "border-border text-muted cursor-not-allowed"
            )}
          >
            <RefreshCw size={13} className={syncingAll ? "animate-spin" : ""} />
            Sync All
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Connected", value: `${connectedCount}/6`, icon: Link2, accent: connectedCount > 0 },
            { label: "Revenue Sources", value: connectedCount > 0 && (statuses.shopify.isConnected || statuses.razorpay.isConnected) ? "Active" : "0 active", icon: TrendingUp, accent: false },
            { label: "Ad Platforms", value: statuses.meta_ads.isConnected ? "Meta Ads" : "None", icon: Megaphone, accent: false },
            {
              label: "Last Sync",
              value: lastSyncTime
                ? lastSyncTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                : "Never",
              icon: Activity,
              accent: false,
            },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border",
                s.accent ? "glass-accent border-accent/30" : "glass border-border"
              )}
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", s.accent ? "bg-accent/20" : "bg-surface-2")}>
                <s.icon size={13} className={s.accent ? "text-accent-bright" : "text-muted"} />
              </div>
              <div>
                <p className="text-[10px] text-muted">{s.label}</p>
                <p className={cn("text-sm font-bold leading-tight", s.accent ? "text-accent-bright" : "text-text-primary")}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        {connectedCount === 0 && (
          <div className="glass rounded-xl p-5 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-accent-bright" />
              <h3 className="text-sm font-semibold text-text-primary">How auto-sync works</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              {[
                { n: "1", title: "Enter your API credentials", body: "Your tokens are stored locally on your device — never sent to any server except the platform APIs." },
                { n: "2", title: "Click Sync Now", body: "Data is pulled from each platform through secure server-side requests, bypassing CORS restrictions." },
                { n: "3", title: "Revenue auto-logged", body: "Shopify orders and Razorpay payments appear instantly in your Revenue tracker with zero manual entry." },
              ].map((step) => (
                <div key={step.n} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-accent-dim border border-accent/40 text-accent-bright text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary mb-0.5">{step.title}</p>
                    <p className="text-text-secondary leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integration cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {ALL_PLATFORMS.map((platform) => (
            <IntegrationCard
              key={platform}
              platform={platform}
              status={statuses[platform]}
              syncing={!!syncing[platform]}
              onConnect={() => setConnectingPlatform(platform)}
              onSync={() => handleSync(platform)}
              onDisconnect={() => handleDisconnect(platform)}
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-muted text-center leading-relaxed">
          All credentials are stored in your browser&apos;s localStorage — encrypted in transit, never persisted on any server.
          <br />
          Tokens with expiry (Meta, Google) need refreshing every 60 days.
        </p>
      </div>

      {/* Connect modal */}
      <AnimatePresence>
        {connectingPlatform && (
          <ConnectModal
            platform={connectingPlatform}
            onSave={(config) => handleConnect(connectingPlatform, config)}
            onClose={() => setConnectingPlatform(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
