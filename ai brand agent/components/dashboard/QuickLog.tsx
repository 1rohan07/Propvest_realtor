"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addRevenue } from "@/lib/storage";
import { today } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, X, Check, IndianRupee } from "lucide-react";

const SOURCES = ["Product Sales", "Services", "Consulting", "Subscriptions", "Affiliate", "Other"];

export default function QuickLog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: today(), amount: "", source: "Product Sales", note: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "l" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as Element)?.tagName)) {
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const submit = () => {
    if (!form.amount) return;
    addRevenue({
      date: form.date,
      amount: parseFloat(form.amount),
      source: form.source,
      note: form.note,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setForm({ date: today(), amount: "", source: "Product Sales", note: "" });
    }, 1200);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:bg-accent-bright transition-colors"
        title="Quick log revenue (L)"
      >
        <IndianRupee size={18} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-24 right-6 z-50 glass rounded-2xl p-5 w-80 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <IndianRupee size={14} className="text-accent-bright" />
                  <h3 className="text-sm font-semibold text-text-primary">Quick Log Revenue</h3>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted hover:text-text-primary">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-muted mb-1">Date</label>
                    <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      placeholder="5000"
                      autoFocus
                      className="text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-muted mb-1">Source</label>
                  <select value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} className="text-xs">
                    {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-muted mb-1">Note (optional)</label>
                  <input
                    value={form.note}
                    onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="Client name, order ID..."
                    className="text-xs"
                  />
                </div>
                <button
                  onClick={submit}
                  disabled={!form.amount}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                    saved
                      ? "bg-accent-dim text-accent-bright border border-accent"
                      : form.amount
                      ? "bg-accent text-white hover:bg-accent-bright"
                      : "bg-surface-2 text-muted cursor-not-allowed"
                  )}
                >
                  {saved ? <><Check size={14} /> Logged!</> : "Log Revenue"}
                </button>
                <p className="text-center text-[9px] text-muted">Press L anywhere to open · Enter to submit</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
