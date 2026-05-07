import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { shopDomain, accessToken, daysBack = 90 } = await req.json();

    if (!shopDomain || !accessToken) {
      return NextResponse.json({ error: "Missing shopDomain or accessToken" }, { status: 400 });
    }

    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    const sinceISO = since.toISOString();

    const url = `https://${shopDomain}.myshopify.com/admin/api/2024-01/orders.json?status=any&financial_status=paid&created_at_min=${encodeURIComponent(sinceISO)}&limit=250`;

    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Shopify API error: ${res.status}`, detail: err }, { status: 400 });
    }

    const data = await res.json();
    const orders = data.orders ?? [];

    const entries = orders.map((order: Record<string, unknown>) => ({
      date: (order.created_at as string).slice(0, 10),
      amount: parseFloat(order.total_price as string),
      source: "Shopify",
      note: `Order ${order.name} (${order.currency})`,
      externalId: `shopify_${order.id}`,
    }));

    const totalRevenue = entries.reduce((s: number, e: { amount: number }) => s + e.amount, 0);

    return NextResponse.json({
      synced: entries.length,
      entries,
      totalRevenue,
      summary: `${entries.length} orders · ₹${Math.round(totalRevenue).toLocaleString("en-IN")}`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
