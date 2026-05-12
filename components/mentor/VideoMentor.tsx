"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Persona } from "@/lib/personas";
import { Video, VideoOff, Loader2, Wifi, WifiOff } from "lucide-react";

interface Props {
  persona: Persona;
  textToSpeak: string | null;
  onClose: () => void;
}

type Status = "idle" | "connecting" | "connected" | "error";

export default function VideoMentor({ persona, textToSpeak, onClose }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const pcRef      = useRef<RTCPeerConnection | null>(null);
  const streamRef  = useRef<{ id: string; sessionId: string } | null>(null);
  const [status, setStatus]   = useState<Status>("idle");
  const [error, setError]     = useState("");

  const callApi = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/ai/did-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      throw new Error(d.error ?? `HTTP ${res.status}`);
    }
    return res.json();
  }, []);

  // Connect WebRTC stream
  const connect = useCallback(async () => {
    setStatus("connecting");
    setError("");
    try {
      // 1. Create D-ID stream
      const created = await callApi({ action: "create", imageUrl: persona.avatarUrl }) as {
        id: string; session_id: string; offer: RTCSessionDescriptionInit;
        ice_servers: RTCIceServer[];
      };

      streamRef.current = { id: created.id, sessionId: created.session_id };

      // 2. Set up RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: created.ice_servers });
      pcRef.current = pc;

      // When we get the video track, attach to <video>
      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          videoRef.current.srcObject = e.streams[0];
        }
      };

      // Send ICE candidates to D-ID
      pc.onicecandidate = async (e) => {
        if (e.candidate && streamRef.current) {
          await callApi({
            action: "ice",
            streamId: streamRef.current.id,
            sessionId: streamRef.current.sessionId,
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid ?? "",
            sdpMLineIndex: e.candidate.sdpMLineIndex ?? 0,
          }).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatus("connected");
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setStatus("error");
          setError("Connection lost");
        }
      };

      // 3. Set remote description (D-ID offer)
      await pc.setRemoteDescription(created.offer);

      // 4. Create answer and send to D-ID
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await callApi({
        action: "sdp",
        streamId: created.id,
        sessionId: created.session_id,
        sdp: answer,
      });

      setStatus("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setStatus("error");
    }
  }, [persona.avatarUrl, callApi]);

  // Speak text via D-ID
  useEffect(() => {
    if (!textToSpeak || status !== "connected" || !streamRef.current) return;
    callApi({
      action: "talk",
      streamId: streamRef.current.id,
      sessionId: streamRef.current.sessionId,
      text: textToSpeak.slice(0, 400),
    }).catch(console.error);
  }, [textToSpeak, status, callApi]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        callApi({ action: "close", ...streamRef.current }).catch(() => {});
      }
      pcRef.current?.close();
    };
  }, [callApi]);

  // Auto-connect on mount
  useEffect(() => { connect(); }, [connect]);

  return (
    <div style={{
      position: "relative", borderRadius: 20, overflow: "hidden",
      border: `2.5px solid ${persona.borderColor}`,
      boxShadow: `0 8px 40px ${persona.borderColor}44`,
      background: "#0f172a",
      width: "100%", aspectRatio: "9/16", maxHeight: 480,
    }}>
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "100%", height: "100%",
          objectFit: "cover",
          display: status === "connected" ? "block" : "none",
        }}
      />

      {/* Overlay when not connected */}
      {status !== "connected" && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        }}>
          {/* Static photo behind */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={persona.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 16px" }}>
            {status === "connecting" && (
              <>
                <Loader2 style={{ width: 32, height: 32, color: persona.companyColor, margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Connecting to {persona.name}…</p>
                <p style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Setting up video stream</p>
              </>
            )}
            {status === "error" && (
              <>
                <WifiOff style={{ width: 32, height: 32, color: "#ef4444", margin: "0 auto 12px" }} />
                <p style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Connection failed</p>
                <p style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{error}</p>
                <button
                  onClick={connect}
                  style={{
                    marginTop: 12, padding: "8px 20px", borderRadius: 10,
                    background: persona.companyColor, color: "white",
                    border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                  }}
                >
                  Retry
                </button>
              </>
            )}
            {status === "idle" && (
              <button
                onClick={connect}
                style={{
                  padding: "10px 24px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${persona.borderColor}, ${persona.companyColor})`,
                  color: "white", border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <Video style={{ width: 16, height: 16 }} />
                Start Video Call
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top overlay: name + status */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
        padding: "12px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ color: "white", fontWeight: 800, fontSize: 13, margin: 0 }}>{persona.name}</p>
          <p style={{ color: "#94a3b8", fontSize: 11, margin: 0 }}>{persona.company}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 8, height: 8, borderRadius: 4,
            background: status === "connected" ? "#22c55e" : status === "connecting" ? "#f59e0b" : "#ef4444",
            animation: status === "connected" ? "pulse 2s infinite" : "none",
          }} />
          <span style={{ color: "#94a3b8", fontSize: 11 }}>
            {status === "connected" ? "Live" : status === "connecting" ? "Connecting…" : "Offline"}
          </span>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", bottom: 12, right: 12,
          padding: "6px 14px", borderRadius: 10,
          background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)",
          color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5,
        }}
      >
        <VideoOff style={{ width: 13, height: 13 }} />
        End Call
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
