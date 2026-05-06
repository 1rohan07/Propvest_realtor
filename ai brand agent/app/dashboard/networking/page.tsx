"use client";

import { useEffect, useState } from "react";
import { getContacts, setContacts, Contact } from "@/lib/storage";
import TopBar from "@/components/dashboard/TopBar";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
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

const STATUS_BADGE: Record<Status, string> = {
  interested: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  "follow-up": "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  negotiation: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  confirmed: "text-accent-bright border-accent/30 bg-accent-dim",
  completed: "text-muted border-border",
};

export default function NetworkingPage() {
  const [contacts, setLocalContacts] = useState<Contact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", platform: "Instagram", status: "interested" as Status, note: "" });

  useEffect(() => { setLocalContacts(getContacts()); }, []);

  const add = () => {
    if (!form.name) return;
    const c: Contact = { id: Date.now().toString(), ...form, date: today() };
    const updated = [...contacts, c];
    setLocalContacts(updated);
    setContacts(updated);
    setForm({ name: "", platform: "Instagram", status: "interested", note: "" });
    setShowAdd(false);
  };

  const advance = (id: string) => {
    const order: Status[] = ["interested", "follow-up", "negotiation", "confirmed", "completed"];
    const updated = contacts.map((c) => {
      if (c.id !== id) return c;
      const idx = order.indexOf(c.status);
      return { ...c, status: order[Math.min(idx + 1, 4)] };
    });
    setLocalContacts(updated);
    setContacts(updated);
  };

  const remove = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setLocalContacts(updated);
    setContacts(updated);
  };

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

        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 grid grid-cols-4 gap-4">
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
            <div className="col-span-4 flex gap-2">
              <button onClick={add} className="bg-accent text-white text-sm px-5 py-2 rounded-lg hover:bg-accent-bright">Add</button>
              <button onClick={() => setShowAdd(false)} className="text-muted text-sm px-4 py-2 rounded-lg border border-border">Cancel</button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-5 gap-3">
          {STATUSES.map(({ key, label, color }) => {
            const col = contacts.filter((c) => c.status === key);
            return (
              <div key={key} className={cn("rounded-xl border p-3 min-h-48", color)}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-text-primary">{label}</p>
                  <span className="text-[10px] text-muted">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((c) => (
                    <div key={c.id} className="glass rounded-lg p-2.5 group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">{c.name}</p>
                          <p className="text-[10px] text-muted">{c.platform}</p>
                          {c.note && <p className="text-[10px] text-muted mt-0.5 truncate">{c.note}</p>}
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
                  ))}
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
    </div>
  );
}
