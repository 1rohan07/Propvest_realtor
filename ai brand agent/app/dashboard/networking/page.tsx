"use client";

import { useEffect, useState } from "react";
import { getContacts, setContacts, Contact } from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
import SectionHeader from "@/components/ui/SectionHeader";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Search, Users } from "lucide-react";
import { motion } from "framer-motion";
import { today } from "@/lib/utils";

type Status = Contact["status"];

const STATUSES: { key: Status; label: string; color: string }[] = [
  { key: "interested", label: "Interested", color: "border-blue-500/30 bg-blue-500/5" },
  { key: "follow-up", label: "Follow Up", color: "border-yellow-500/30 bg-yellow-500/5" },
  { key: "negotiation", label: "Negotiation", color: "border-purple-500/30 bg-purple-500/5" },
  { key: "confirmed", label: "Confirmed", color: "border-accent/40 bg-accent-dim" },
  { key: "completed", label: "Completed", color: "border-border bg-surface" },
];

function getFollowUpStatus(followUpDate?: string): "overdue" | "today" | null {
  if (!followUpDate) return null;
  const diff = new Date(followUpDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  return null;
}

export default function NetworkingPage() {
  const [contacts, setLocalContacts] = useState<Contact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", platform: "Instagram", status: "interested" as Status,
    note: "", followUpDate: "",
  });

  useEffect(() => { setLocalContacts(getContacts()); }, []);

  const save = (updated: Contact[]) => {
    setLocalContacts(updated);
    setContacts(updated);
  };

  const add = () => {
    if (!form.name) return;
    const c: Contact = {
      id: Date.now().toString(),
      name: form.name,
      platform: form.platform,
      status: form.status,
      note: form.note,
      date: today(),
      ...(form.followUpDate ? { followUpDate: form.followUpDate } : {}),
    };
    save([...contacts, c]);
    setForm({ name: "", platform: "Instagram", status: "interested", note: "", followUpDate: "" });
    setShowAdd(false);
  };

  const advance = (id: string) => {
    const order: Status[] = ["interested", "follow-up", "negotiation", "confirmed", "completed"];
    save(contacts.map((c) => {
      if (c.id !== id) return c;
      const idx = order.indexOf(c.status);
      return { ...c, status: order[Math.min(idx + 1, 4)] };
    }));
  };

  const remove = (id: string) => save(contacts.filter((c) => c.id !== id));

  const q = search.toLowerCase();
  const filtered = q
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.platform.toLowerCase().includes(q) ||
          (c.note ?? "").toLowerCase().includes(q)
      )
    : contacts;

  // Sort each column: overdue first, then today, then rest
  const sortCol = (list: Contact[]) =>
    [...list].sort((a, b) => {
      const sa = getFollowUpStatus(a.followUpDate);
      const sb = getFollowUpStatus(b.followUpDate);
      const rank = (s: "overdue" | "today" | null) => s === "overdue" ? 0 : s === "today" ? 1 : 2;
      return rank(sa) - rank(sb);
    });

  const overdueCount = contacts.filter((c) => getFollowUpStatus(c.followUpDate) === "overdue").length;
  const todayCount = contacts.filter((c) => getFollowUpStatus(c.followUpDate) === "today").length;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Networking & Collabs" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-start justify-between">
          <SectionHeader title="Networking Pipeline" subtitle="Track brand collabs, partnership pipeline, and business relationships" />
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-accent-bright transition-colors">
            <Plus size={14} /> Add Contact
          </button>
        </div>

        {/* Stats + search row */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="pl-8 text-sm"
            />
          </div>
          {overdueCount > 0 && (
            <span className="text-[10px] text-red-400 border border-red-400/30 bg-red-400/10 px-2 py-1 rounded-full">
              {overdueCount} overdue follow-up{overdueCount > 1 ? "s" : ""}
            </span>
          )}
          {todayCount > 0 && (
            <span className="text-[10px] text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 rounded-full">
              {todayCount} due today
            </span>
          )}
          <span className="text-xs text-muted ml-auto">{contacts.length} contacts total</span>
        </div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Name / Company</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Brand or person name" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Platform / Type</label>
              <select value={form.platform} onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))}>
                {["Instagram", "LinkedIn", "WhatsApp", "Email", "In-person", "Other"].map((pl) => <option key={pl} value={pl}>{pl}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Stage</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Status }))}>
                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Note</label>
              <input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Context..." />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Follow-up Date (optional)</label>
              <input type="date" value={form.followUpDate} onChange={(e) => setForm((p) => ({ ...p, followUpDate: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <div className="flex gap-2">
                <button onClick={add} className="bg-accent text-white text-sm px-5 py-2 rounded-lg hover:bg-accent-bright">Add</button>
                <button onClick={() => setShowAdd(false)} className="text-muted text-sm px-4 py-2 rounded-lg border border-border">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-5 gap-3">
          {STATUSES.map(({ key, label, color }) => {
            const col = sortCol(filtered.filter((c) => c.status === key));
            return (
              <div key={key} className={cn("rounded-xl border p-3 min-h-48", color)}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-text-primary">{label}</p>
                  <span className="text-[10px] text-muted">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((c) => {
                    const followStatus = getFollowUpStatus(c.followUpDate);
                    return (
                      <div key={c.id} className="glass rounded-lg p-2.5 group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{c.name}</p>
                            <p className="text-[10px] text-muted">{c.platform}</p>
                            {c.note && <p className="text-[10px] text-muted mt-0.5 truncate">{c.note}</p>}
                            {followStatus === "overdue" && (
                              <span className="text-[9px] text-red-400 border border-red-400/30 bg-red-400/10 px-1 py-0.5 rounded mt-1 inline-block">
                                Follow-up overdue
                              </span>
                            )}
                            {followStatus === "today" && (
                              <span className="text-[9px] text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 px-1 py-0.5 rounded mt-1 inline-block">
                                Follow up today
                              </span>
                            )}
                          </div>
                          <button onClick={() => remove(c.id)} className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all ml-1 flex-shrink-0">
                            <Trash2 size={10} />
                          </button>
                        </div>
                        {key !== "completed" && (
                          <button
                            onClick={() => advance(c.id)}
                            className="mt-1.5 text-[10px] text-accent-bright hover:underline"
                          >
                            Advance →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {contacts.length === 0 && (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-sm text-muted">No contacts in pipeline. Start adding brand collabs and business connections.</p>
          </div>
        )}
      </div>

      <EmbeddedAgent
        agentName="Networking Agent"
        badge="PRO"
        agentIcon={<Users size={13} className="text-white" />}
        systemPrompt={`You are a world-class business development strategist, relationship-builder, and brand partnership expert. You help founders build high-value networks and close brand deals.
Pipeline: ${contacts.length} contacts total — ${contacts.filter(c => c.status === "interested").length} interested, ${contacts.filter(c => c.status === "follow-up").length} follow-up, ${contacts.filter(c => c.status === "negotiation").length} in negotiation, ${contacts.filter(c => c.status === "confirmed").length} confirmed.
Overdue follow-ups: ${overdueCount}. Due today: ${todayCount}.
RULES: Be specific and actionable. Give real outreach scripts, negotiation frameworks, and relationship strategies. Never give generic networking advice.`}
        quickActions={[
          { label: "Write a DM to open a brand collab", prompt: "Write a cold DM template to open a brand collaboration conversation with a brand I admire. Make it specific, not generic — include a personalised opener, a clear value prop, and a low-friction CTA. Give me 3 variations: casual, semi-formal, and founder-to-founder.", category: "Outreach" },
          { label: "Follow-up sequence for cold contacts", prompt: "Build a 5-touch follow-up sequence for contacts who haven't responded. Include: timing for each follow-up (Day 1, 3, 7, 14, 30), the content/angle of each message, how to add value without being pushy, and a graceful exit message if they never respond.", category: "Outreach" },
          { label: "Collab pitch template (partnership deck)", prompt: "Build a complete brand collaboration pitch template. Include: how to open (personalised hook), our brand story in 2 sentences, what we're offering (reach, content, revenue share), what we want in return, social proof, and a specific next step. Format it so I can adapt it quickly for different brands.", category: "Strategy" },
          { label: "How to negotiate a collab deal", prompt: "Walk me through how to negotiate a brand collaboration deal. Include: how to anchor the conversation on value not cost, how to handle 'what's your rate?' professionally, how to structure a revenue share vs fixed fee, how to handle lowball offers, and how to close without being desperate.", category: "Strategy" },
          { label: "Build my network in 30 days (from zero)", prompt: "Build a 30-day networking sprint plan for a founder starting from near-zero connections. Include: daily actions (who to DM, what to say, where to show up), which platforms to prioritise, how to get 30 quality conversations in 30 days, and how to convert conversations into collaborations.", category: "Growth" },
        ]}
      />
    </div>
  );
}
