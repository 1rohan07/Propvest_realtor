import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { keyId, keySecret, daysBack = 90 } = await req.json();

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Missing keyId or keySecret" }, { status: 400 });
    }

    const fromTs = Math.floor(Date.now() / 1000) - daysBack * 86400;
    const toTs = Math.floor(Date.now() / 1000);

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const url = `https://api.razorpay.com/v1/payments?from=${fromTs}&to=${toTs}&count=100`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Razorpay API error: ${res.status}`, detail: err }, { status: 400 });
    }

    const data = await res.json();
    const payments = (data.items ?? []).filter(
      (p: Record<string, unknown>) => p.status === "captured"
    );

    const entries = payments.map((p: Record<string, unknown>) => {
      const createdAt = new Date((p.created_at as number) * 1000);
      return {
        date: createdAt.toISOString().slice(0, 10),
        amount: (p.amount as number) / 100,
        source: "Razorpay",
        note: `Payment ${p.id} (${p.method ?? "online"})`,
        externalId: `razorpay_${p.id}`,
      };
    });

    const totalRevenue = entries.reduce((s: number, e: { amount: number }) => s + e.amount, 0);

    return NextResponse.json({
      synced: entries.length,
      entries,
      totalRevenue,
      summary: `${entries.length} payments · ₹${Math.round(totalRevenue).toLocaleString("en-IN")}`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
