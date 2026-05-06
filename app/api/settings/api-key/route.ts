import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { apiKey } = await req.json() as { apiKey: string };
  if (!apiKey?.trim()) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  // Test the key with a minimal DeepSeek call
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Say hi in 3 words." }],
        max_tokens: 10,
        stream: false,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (body.includes("Insufficient Balance") || body.includes("credit")) {
        return NextResponse.json({ error: "Ключ рабочий, но баланс пустой. Пополни на platform.deepseek.com → Billing." }, { status: 400 });
      }
      if (res.status === 401 || body.includes("invalid")) {
        return NextResponse.json({ error: "Неверный API ключ. Проверь его на platform.deepseek.com." }, { status: 400 });
      }
      return NextResponse.json({ error: `DeepSeek ответил ошибкой ${res.status}: ${body.slice(0, 200)}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: `Не удалось проверить ключ: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  // Write to .env
  const envPath = path.join(process.cwd(), ".env");
  let envContent = "";
  try { envContent = fs.readFileSync(envPath, "utf-8"); } catch { /* file might not exist */ }

  if (envContent.includes("DEEPSEEK_API_KEY=")) {
    envContent = envContent.replace(/DEEPSEEK_API_KEY=.*(\r?\n|$)/m, `DEEPSEEK_API_KEY="${apiKey.trim()}"\n`);
  } else {
    envContent = envContent.trimEnd() + `\nDEEPSEEK_API_KEY="${apiKey.trim()}"\n`;
  }
  fs.writeFileSync(envPath, envContent, "utf-8");

  // Hot-update process.env so no restart needed
  process.env.DEEPSEEK_API_KEY = apiKey.trim();

  return NextResponse.json({ success: true });
}
