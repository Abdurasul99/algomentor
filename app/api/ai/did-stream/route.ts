import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

const DID_API = "https://api.d-id.com";
const DID_KEY = process.env.DID_API_KEY ?? "";

function didHeaders() {
  return {
    Authorization: `Basic ${DID_KEY}`,
    "Content-Type": "application/json",
  };
}

// POST /api/ai/did-stream  { action: "create", imageUrl, voiceId? }
// POST /api/ai/did-stream  { action: "sdp", streamId, sessionId, sdp }
// POST /api/ai/did-stream  { action: "ice", streamId, sessionId, candidate, sdpMid, sdpMLineIndex }
// POST /api/ai/did-stream  { action: "talk", streamId, sessionId, text }
// POST /api/ai/did-stream  { action: "close", streamId, sessionId }

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!DID_KEY) return NextResponse.json({ error: "DID_API_KEY not configured" }, { status: 503 });

  const body = await req.json() as Record<string, unknown>;
  const { action } = body;

  try {
    if (action === "create") {
      const res = await fetch(`${DID_API}/talks/streams`, {
        method: "POST",
        headers: didHeaders(),
        body: JSON.stringify({
          source_url: body.imageUrl,
          driver_url: "bank://lively",
          config: { stitch: true },
        }),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data.message ?? "D-ID create failed" }, { status: res.status });
      return NextResponse.json(data);
    }

    if (action === "sdp") {
      const { streamId, sessionId, sdp } = body as { streamId: string; sessionId: string; sdp: RTCSessionDescriptionInit };
      const res = await fetch(`${DID_API}/talks/streams/${streamId}/sdp`, {
        method: "POST",
        headers: didHeaders(),
        body: JSON.stringify({ answer: sdp, session_id: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data.message ?? "SDP failed" }, { status: res.status });
      return NextResponse.json(data);
    }

    if (action === "ice") {
      const { streamId, sessionId, candidate, sdpMid, sdpMLineIndex } = body as {
        streamId: string; sessionId: string;
        candidate: string; sdpMid: string; sdpMLineIndex: number;
      };
      const res = await fetch(`${DID_API}/talks/streams/${streamId}/ice`, {
        method: "POST",
        headers: didHeaders(),
        body: JSON.stringify({ candidate, sdpMid, sdpMLineIndex, session_id: sessionId }),
      });
      return NextResponse.json({ ok: res.ok });
    }

    if (action === "talk") {
      const { streamId, sessionId, text } = body as { streamId: string; sessionId: string; text: string };
      const res = await fetch(`${DID_API}/talks/streams/${streamId}`, {
        method: "POST",
        headers: didHeaders(),
        body: JSON.stringify({
          script: { type: "text", input: text, provider: { type: "microsoft", voice_id: "en-US-JennyNeural" } },
          config: { fluent: true, pad_audio: 0 },
          session_id: sessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data.message ?? "Talk failed" }, { status: res.status });
      return NextResponse.json(data);
    }

    if (action === "close") {
      const { streamId, sessionId } = body as { streamId: string; sessionId: string };
      await fetch(`${DID_API}/talks/streams/${streamId}`, {
        method: "DELETE",
        headers: didHeaders(),
        body: JSON.stringify({ session_id: sessionId }),
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[did-stream]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
