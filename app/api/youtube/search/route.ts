import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface VideoResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  if (!query) return NextResponse.json({ videos: [] });

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " leetcode solution")}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    const html = await res.text();

    // Extract ytInitialData from the page
    // eslint-disable-next-line prefer-regex-literals
    const ytDataRegex = new RegExp("var ytInitialData\\s*=\\s*(\\{.+?\\});\\s*<\\/script>", "s");
    const match = html.match(ytDataRegex);
    if (!match) return NextResponse.json({ videos: [] });

    const data = JSON.parse(match[1]);

    const videos: VideoResult[] = [];

    // Navigate the deeply nested YouTube data structure
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ?? [];

    for (const item of contents) {
      const vr = item?.videoRenderer;
      if (!vr || videos.length >= 4) continue;

      const id = vr.videoId;
      const title = vr.title?.runs?.[0]?.text ?? "";
      const channel = vr.ownerText?.runs?.[0]?.text ?? vr.longBylineText?.runs?.[0]?.text ?? "";
      const thumbnail = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;

      if (id && title) {
        videos.push({ id, title, channel, thumbnail });
      }
    }

    return NextResponse.json({ videos });
  } catch (err) {
    console.error("[youtube/search]", err);
    return NextResponse.json({ videos: [] });
  }
}
