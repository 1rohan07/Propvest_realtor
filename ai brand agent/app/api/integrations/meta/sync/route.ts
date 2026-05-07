import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, adAccountId, daysBack = 30 } = await req.json();

    if (!accessToken || !adAccountId) {
      return NextResponse.json({ error: "Missing accessToken or adAccountId" }, { status: 400 });
    }

    const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    const sinceStr = since.toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);

    const params = new URLSearchParams({
      fields: "spend,impressions,reach,clicks,cpc,cpm,ctr,actions",
      time_range: JSON.stringify({ since: sinceStr, until: todayStr }),
      level: "account",
      access_token: accessToken,
    });

    const url = `https://graph.facebook.com/v19.0/${accountId}/insights?${params}`;

    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: `Meta API error: ${err.error?.message ?? res.status}` },
        { status: 400 }
      );
    }

    const data = await res.json();
    const insights = data.data?.[0] ?? {};

    const spend = parseFloat(insights.spend ?? "0");
    const impressions = parseInt(insights.impressions ?? "0", 10);
    const clicks = parseInt(insights.clicks ?? "0", 10);
    const reach = parseInt(insights.reach ?? "0", 10);
    const ctr = parseFloat(insights.ctr ?? "0");
    const cpc = parseFloat(insights.cpc ?? "0");

    return NextResponse.json({
      spend,
      impressions,
      clicks,
      reach,
      ctr,
      cpc,
      dateRange: { from: sinceStr, to: todayStr },
      summary: `₹${Math.round(spend).toLocaleString("en-IN")} spend · ${impressions.toLocaleString()} impressions · ${clicks.toLocaleString()} clicks`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
