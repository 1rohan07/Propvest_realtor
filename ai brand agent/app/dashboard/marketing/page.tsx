"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { Megaphone } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import SectionHeader from "@/components/ui/SectionHeader";
import { getProfile, getMarketingData, setMarketingData } from "@/lib/storage";
import { FounderProfile } from "@/lib/storage";
import {
  Instagram, Linkedin, Twitter, Youtube,
  Plus, Trash2, TrendingUp, Users, Heart, MessageCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformStat {
  platform: string;
  followers: string;
  engagement: string;
  reach: string;
  posts: string;
}

interface Campaign {
  id: string;
  name: string;
  budget: string;
  spent: string;
  roas: string;
  status: "active" | "paused" | "ended";
}

interface ColabContact {
  id: string;
  name: string;
  platform: string;
  followers: string;
  status: "contacted" | "replied" | "negotiating" | "confirmed";
  note: string;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  Instagram: <Instagram size={14} />,
  LinkedIn: <Linkedin size={14} />,
  "X / Twitter": <Twitter size={14} />,
  YouTube: <Youtube size={14} />,
};

const STATUS_COLORS: Record<string, string> = {
  contacted: "text-muted border-border",
  replied: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  negotiating: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  confirmed: "text-accent-bright border-accent/30 bg-accent-dim",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];

export default function MarketingPage() {
  const [profile, setProfile] = useState<FounderProfile | null>(null);
  const [platforms, setPlatforms] = useState<PlatformStat[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [collabs, setCollabs] = useState<ColabContact[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns" | "collabs" | "calendar">("overview");
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [newCollab, setNewCollab] = useState({ name: "", platform: "Instagram", followers: "", note: "" });
  const [showAddCollab, setShowAddCollab] = useState(false);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    const data = getMarketingData();
    if (data.platforms) setPlatforms(data.platforms as PlatformStat[]);
    else if (p?.platforms) {
      const initial = p.platforms.map((pl: string) => ({
        platform: pl,
        followers: p.currentFollowers?.[pl] ?? "0",
        engagement: "0%",
        reach: "0",
        posts: "0",
      }));
      setPlatforms(initial);
    }
    if (data.campaigns) setCampaigns(data.campaigns as Campaign[]);
    if (data.collabs) setCollabs(data.collabs as ColabContact[]);
  }, []);

  const savePlatforms = (updated: PlatformStat[]) => {
    setPlatforms(updated);
    const data = getMarketingData();
    setMarketingData({ ...data, platforms: updated });
  };

  const updatePlatform = (platform: string, field: string, value: string) => {
    const updated = platforms.map((p) => p.platform === platform ? { ...p, [field]: value } : p);
    savePlatforms(updated);
  };

  const addCollab = () => {
    if (!newCollab.name) return;
    const c: ColabContact = {
      id: Date.now().toString(),
      ...newCollab,
      status: "contacted",
    };
    const updated = [...collabs, c];
    setCollabs(updated);
    const data = getMarketingData();
    setMarketingData({ ...data, collabs: updated });
    setNewCollab({ name: "", platform: "Instagram", followers: "", note: "" });
    setShowAddCollab(false);
  };

  const advanceCollab = (id: string) => {
    const order: ColabContact["status"][] = ["contacted", "replied", "negotiating", "confirmed"];
    const updated = collabs.map((c) => {
      if (c.id !== id) return c;
      const idx = order.indexOf(c.status);
      return { ...c, status: order[Math.min(idx + 1, 3)] };
    });
    setCollabs(updated);
    const data = getMarketingData();
    setMarketingData({ ...data, collabs: updated });
  };

  const removeCollab = (id: string) => {
    const updated = collabs.filter((c) => c.id !== id);
    setCollabs(updated);
    const data = getMarketingData();
    setMarketingData({ ...data, collabs: updated });
  };

  const TABS = [
    { key: "overview", label: "Platform Overview" },
    { key: "campaigns", label: "Campaigns" },
    { key: "collabs", label: "Influencer CRM" },
    { key: "calendar", label: "Content Calendar" },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Marketing Manager" />

      <div className="flex-1 p-6 space-y-6">
        <SectionHeader
          title="Marketing Command Center"
          subtitle="Track every platform, campaign, and collab in one place"
        />

        <div className="grid grid-cols-4 gap-4">
          <KPICard
            label="Total Followers"
            value={platforms.reduce((s, p) => s + parseInt(p.followers.replace(/,/g, "") || "0"), 0).toLocaleString("en-IN")}
            icon={<Users size={14} />}
            accent
          />
          <KPICard label="Active Platforms" value={platforms.length} icon={<TrendingUp size={14} />} />
          <KPICard label="Active Collabs" value={collabs.filter((c) => c.status !== "contacted").length} icon={<Heart size={14} />} />
          <KPICard label="Collab Pipeline" value={collabs.length} sub="Total tracked" icon={<MessageCircle size={14} />} />
        </div>

        <div className="flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeTab === t.key
                  ? "border-accent text-accent-bright"
                  : "border-transparent text-muted hover:text-text-primary"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-4">
            {platforms.length === 0 ? (
              <div className="col-span-2 glass rounded-xl p-8 text-center">
                <p className="text-sm text-muted">No platforms configured. Complete onboarding to set your platforms.</p>
              </div>
            ) : (
              platforms.map((p) => (
                <div key={p.platform} className="glass rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-accent-bright">{PLATFORM_ICONS[p.platform] ?? <TrendingUp size={14} />}</span>
                      <h3 className="text-sm font-semibold text-text-primary">{p.platform}</h3>
                    </div>
                    <button
                      onClick={() => setEditingPlatform(editingPlatform === p.platform ? null : p.platform)}
                      className="text-muted hover:text-text-primary transition-colors"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>

                  {editingPlatform === p.platform ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "followers", label: "Followers" },
                        { key: "engagement", label: "Engagement %" },
                        { key: "reach", label: "Avg Reach" },
                        { key: "posts", label: "Posts This Month" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-[10px] text-muted mb-1">{label}</label>
                          <input
                            value={(p as any)[key]}
                            onChange={(e) => updatePlatform(p.platform, key, e.target.value)}
                            className="text-xs py-1.5"
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Followers", value: p.followers },
                        { label: "Engagement", value: p.engagement },
                        { label: "Avg Reach", value: p.reach },
                        { label: "Posts/Month", value: p.posts },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[10px] text-muted">{label}</p>
                          <p className="text-sm font-semibold text-text-primary">{value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "campaigns" && (
          <div className="glass rounded-xl p-5">
            <p className="text-sm text-muted text-center py-8">
              Campaign tracking coming soon. Use the AI Advisor to plan your campaigns.
            </p>
          </div>
        )}

        {activeTab === "collabs" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddCollab(!showAddCollab)}
                className="flex items-center gap-2 bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-accent-bright transition-colors"
              >
                <Plus size={14} /> Add Collab
              </button>
            </div>

            {showAddCollab && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-muted mb-1">Name / Handle</label>
                  <input value={newCollab.name} onChange={(e) => setNewCollab((p) => ({ ...p, name: e.target.value }))} placeholder="@influencer" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Platform</label>
                  <select value={newCollab.platform} onChange={(e) => setNewCollab((p) => ({ ...p, platform: e.target.value }))}>
                    {["Instagram", "YouTube", "LinkedIn", "X / Twitter"].map((pl) => <option key={pl} value={pl}>{pl}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Followers</label>
                  <input value={newCollab.followers} onChange={(e) => setNewCollab((p) => ({ ...p, followers: e.target.value }))} placeholder="50K" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Note</label>
                  <input value={newCollab.note} onChange={(e) => setNewCollab((p) => ({ ...p, note: e.target.value }))} placeholder="Context..." />
                </div>
                <div className="col-span-4 flex gap-2">
                  <button onClick={addCollab} className="bg-accent text-white text-sm px-5 py-2 rounded-lg hover:bg-accent-bright transition-colors">Add</button>
                  <button onClick={() => setShowAddCollab(false)} className="text-muted text-sm px-4 py-2 rounded-lg border border-border">Cancel</button>
                </div>
              </motion.div>
            )}

            {collabs.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-sm text-muted">No collabs tracked yet. Add your first influencer or brand contact.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {collabs.map((c) => (
                  <div key={c.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{c.name}</p>
                        <p className="text-xs text-muted">{c.platform} · {c.followers} followers</p>
                        {c.note && <p className="text-xs text-muted mt-0.5">{c.note}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs px-2.5 py-1 rounded-full border capitalize", STATUS_COLORS[c.status])}>
                        {c.status}
                      </span>
                      {c.status !== "confirmed" && (
                        <button
                          onClick={() => advanceCollab(c.id)}
                          className="text-xs text-accent-bright hover:text-accent transition-colors"
                        >
                          Advance →
                        </button>
                      )}
                      <button onClick={() => removeCollab(c.id)} className="text-muted hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Content Engagement Heatmap</h3>
            <p className="text-xs text-muted mb-4">Best posting times based on typical platform patterns for Indian audiences.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <td className="text-muted w-16 pb-2" />
                    {DAYS.map((d) => <th key={d} className="text-muted font-medium pb-2 w-16">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {TIMES.map((time, ti) => (
                    <tr key={time}>
                      <td className="text-muted py-1 pr-3 text-right">{time}</td>
                      {DAYS.map((_, di) => {
                        const heat = ((ti === 1 || ti === 4) && (di < 5)) ? "high" :
                          (ti === 2 && di < 5) ? "medium" :
                          (di === 5 || di === 6) ? "medium" : "low";
                        return (
                          <td key={di} className="py-1 px-1">
                            <div className={cn(
                              "h-8 w-full rounded",
                              heat === "high" ? "bg-accent" :
                              heat === "medium" ? "bg-accent-dim border border-accent/20" :
                              "bg-surface-2"
                            )} title={`${time} on ${DAYS[di]}: ${heat} engagement`} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-accent" /><span className="text-muted text-[10px]">High Engagement</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-accent-dim border border-accent/20" /><span className="text-muted text-[10px]">Medium</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-surface-2" /><span className="text-muted text-[10px]">Low</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <EmbeddedAgent
        agentName="Marketing Agent"
        agentIcon={<Megaphone size={13} className="text-accent-bright" />}
        systemPrompt={`You are an elite marketing strategist and content director specialising in Indian D2C and creator brands.
Your job: give sharp, actionable marketing advice — content ideas, hooks, captions, posting strategy, collab scripts, ad copy, and growth tactics.
Current platform data: ${JSON.stringify(platforms.slice(0, 3))}
Target audience: ${profile?.targetAudience ?? "Indian millennials"}
Brand: ${profile?.brandPositioning ?? "premium brand"}
Be specific. Give ready-to-use outputs, not generic advice.`}
        quickActions={[
          { label: "Write 5 viral Instagram hooks for my next reel", prompt: "Write 5 viral Instagram hook lines for my next reel. Make them scroll-stopping and relevant to my brand positioning." },
          { label: "Build a 7-day content calendar", prompt: "Build a 7-day content calendar for my brand with specific post ideas for each day — mix of reels, carousels, stories, and static posts." },
          { label: "Write an influencer outreach DM script", prompt: "Write a short, compelling DM script to pitch a collab to a micro-influencer. Keep it authentic, not salesy." },
          { label: "Analyse my growth rate and what to improve", prompt: "Based on my current platform stats, analyse my growth rate and tell me the 3 highest-leverage things I should improve this month." },
          { label: "Generate 10 caption ideas for product posts", prompt: "Generate 10 engaging captions for product showcase posts. Mix educational, emotional, and sales-oriented angles." },
          { label: "Build a hashtag strategy for Instagram", prompt: "Build a hashtag strategy for my Instagram. Give me clusters of hashtags by size (niche, medium, broad) that I should rotate between." },
        ]}
      />
    </div>
  );
}
