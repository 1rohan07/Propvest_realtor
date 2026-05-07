import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, instagramAccountId } = await req.json();

    if (!accessToken || !instagramAccountId) {
      return NextResponse.json(
        { error: "Missing accessToken or instagramAccountId" },
        { status: 400 }
      );
    }

    const profileParams = new URLSearchParams({
      fields: "followers_count,media_count,username,biography,website",
      access_token: accessToken,
    });

    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}?${profileParams}`
    );

    if (!profileRes.ok) {
      const err = await profileRes.json();
      return NextResponse.json(
        { error: `Instagram API error: ${err.error?.message ?? profileRes.status}` },
        { status: 400 }
      );
    }

    const profile = await profileRes.json();

    // Fetch recent media insights
    const mediaParams = new URLSearchParams({
      fields: "id,timestamp,like_count,comments_count,media_type,permalink",
      limit: "12",
      access_token: accessToken,
    });

    const mediaRes = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media?${mediaParams}`
    );

    let recentPosts: unknown[] = [];
    if (mediaRes.ok) {
      const mediaData = await mediaRes.json();
      recentPosts = mediaData.data ?? [];
    }

    const followers = profile.followers_count ?? 0;
    const mediaCount = profile.media_count ?? 0;

    const totalLikes = (recentPosts as Record<string, number>[]).reduce(
      (s, p) => s + (p.like_count ?? 0),
      0
    );
    const avgLikes =
      recentPosts.length > 0 ? Math.round(totalLikes / recentPosts.length) : 0;
    const engagementRate =
      followers > 0 ? ((avgLikes / followers) * 100).toFixed(2) : "0";

    return NextResponse.json({
      followers,
      mediaCount,
      username: profile.username,
      avgLikes,
      engagementRate: parseFloat(engagementRate),
      recentPostCount: recentPosts.length,
      summary: `${followers.toLocaleString()} followers · ${engagementRate}% engagement`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
