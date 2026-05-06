"use client";

import { useState } from "react";
import { FounderProfile } from "@/lib/storage";

interface Props {
  data: Partial<FounderProfile>;
  onNext: (data: Partial<FounderProfile>) => void;
  onBack: () => void;
}

const ALL_TOOLS = [
  "Shopify", "WooCommerce", "Amazon Seller", "Shiprocket", "NimbusPost", "Delhivery",
  "Razorpay", "Stripe", "PayU", "Zoho CRM", "HubSpot", "Notion", "Slack",
  "Google Sheets", "WhatsApp Business", "Mailchimp", "Meta Ads", "Google Ads",
  "Tally", "Zoho Books", "QuickBooks",
];

export default function OperationsStep({ data, onNext, onBack }: Props) {
  const [form, setForm] = useState({
    tools: data.tools ?? [] as string[],
    logisticsPartner: "",
    crmTool: "",
    paymentGateway: "",
  });

  const toggleTool = (t: string) => {
    setForm((prev) => ({
      ...prev,
      tools: prev.tools.includes(t)
        ? prev.tools.filter((x) => x !== t)
        : [...prev.tools, t],
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          Your <span className="text-accent-bright">Operations Stack</span>
        </h1>
        <p className="text-muted text-sm">The AI will suggest integrations and workflow optimisations based on your tools.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-3">Tools You Currently Use</label>
          <div className="flex flex-wrap gap-2">
            {ALL_TOOLS.map((t) => (
              <button
                key={t}
                onClick={() => toggleTool(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  form.tools.includes(t)
                    ? "border-accent bg-accent-dim text-accent-bright"
                    : "border-border text-muted hover:text-text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Logistics Partner</label>
            <input
              value={form.logisticsPartner}
              onChange={(e) => setForm((p) => ({ ...p, logisticsPartner: e.target.value }))}
              placeholder="e.g. Shiprocket, None yet"
            />
          </div>
          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-2">Payment Gateway</label>
            <input
              value={form.paymentGateway}
              onChange={(e) => setForm((p) => ({ ...p, paymentGateway: e.target.value }))}
              placeholder="e.g. Razorpay"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3.5 rounded-xl border border-border text-muted text-sm hover:text-text-primary transition-colors">
          ← Back
        </button>
        <button
          onClick={() => onNext({ tools: form.tools })}
          className="flex-1 py-3.5 rounded-xl font-medium text-sm bg-accent text-white hover:bg-accent-bright transition-all"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
