// DeepSeek API helper — OpenAI-compatible endpoint

const DEEPSEEK_BASE = "https://api.deepseek.com";
const MODEL = "deepseek-chat";

function getKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set in .env");
  return key;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Non-streaming: returns full text
export async function aiComplete(
  messages: ChatMessage[],
  maxTokens = 1500
): Promise<string> {
  const key = getKey();
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, stream: false }),
    signal: AbortSignal.timeout(90_000), // 90s timeout for large generations
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}

// Streaming: returns a Response with text/plain stream
export function aiStream(
  messages: ChatMessage[],
  maxTokens = 1500,
  onComplete?: (fullText: string) => Promise<void>
): Response {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    let fullText = "";
    try {
      const key = getKey();
      const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, stream: true }),
      });

      if (!res.ok) {
        const errText = await res.text();
        let friendly = `DeepSeek error (${res.status}): ${errText}`;
        if (errText.includes("Insufficient Balance") || errText.includes("credit")) {
          friendly = "💳 **Недостаточно кредитов.** Пополни баланс на platform.deepseek.com → Billing.";
        } else if (errText.includes("invalid") || res.status === 401) {
          friendly = "🔑 **Неверный API ключ.** Обнови DEEPSEEK_API_KEY в настройках.";
        }
        await writer.write(encoder.encode(friendly));
        return;
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6)) as {
              choices: Array<{ delta: { content?: string }; finish_reason: string | null }>;
            };
            const delta = json.choices[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              await writer.write(encoder.encode(delta));
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await writer.write(encoder.encode(`\n\n⚠️ Ошибка: ${msg}`));
    } finally {
      if (onComplete && fullText) {
        try { await onComplete(fullText); } catch { /* ignore save errors */ }
      }
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
