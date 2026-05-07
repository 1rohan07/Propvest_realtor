import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { propertyId, accessToken, daysBack = 30 } = await req.json();

    if (!propertyId || !accessToken) {
      return NextResponse.json(
        { error: "Missing propertyId or accessToken" },
        { status: 400 }
      );
    }

    const body = {
      dateRanges: [
        {
          startDate: `${daysBack}daysAgo`,
          endDate: "today",
        },
      ],
      metrics: [
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      dimensions: [{ name: "date" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    };

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: `GA4 API error: ${err.error?.message ?? res.status}` },
        { status: 400 }
      );
    }

    const data = await res.json();
    const rows = data.rows ?? [];

    const totals = data.totals?.[0]?.metricValues ?? [];
    const sessions = parseInt(totals[0]?.value ?? "0", 10);
    const pageviews = parseInt(totals[1]?.value ?? "0", 10);
    const activeUsers = parseInt(totals[2]?.value ?? "0", 10);
    const newUsers = parseInt(totals[3]?.value ?? "0", 10);
    const bounceRate = parseFloat(totals[4]?.value ?? "0");
    const avgSessionDuration = parseFloat(totals[5]?.value ?? "0");

    const dailyData = rows.map((row: Record<string, { values?: string[] }>) => ({
      date: row.dimensionValues?.values?.[0] ?? "",
      sessions: parseInt(row.metricValues?.values?.[0] ?? "0", 10),
      pageviews: parseInt(row.metricValues?.values?.[1] ?? "0", 10),
      users: parseInt(row.metricValues?.values?.[2] ?? "0", 10),
    }));

    return NextResponse.json({
      sessions,
      pageviews,
      activeUsers,
      newUsers,
      bounceRate: Math.round(bounceRate * 100) / 100,
      avgSessionDuration: Math.round(avgSessionDuration),
      dailyData,
      summary: `${sessions.toLocaleString()} sessions · ${pageviews.toLocaleString()} pageviews`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
