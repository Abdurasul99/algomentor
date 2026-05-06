"use client";

import { useState } from "react";
import { Key, ExternalLink, CheckCircle, AlertCircle, Eye, EyeOff, Zap } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function testAndSave() {
    if (!apiKey.trim()) return;
    setStatus("testing");
    setMessage("");
    try {
      const res = await fetch("/api/settings/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        setStatus("ok");
        setMessage("✅ Ключ сохранён и проверен. AI Ментор готов к работе!");
        setApiKey("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Не удалось сохранить ключ.");
      }
    } catch {
      setStatus("error");
      setMessage("Ошибка сети. Проверь что сервер запущен.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Настройки</h2>
        <p className="text-slate-500 text-sm mt-1">Конфигурация AI Ментора</p>
      </div>

      {/* DeepSeek info card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-blue-900">Почему DeepSeek?</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Цена", value: "~$0.0001", sub: "за сообщение" },
            { label: "Скорость", value: "Быстро", sub: "потоковый ответ" },
            { label: "Качество", value: "GPT-4 уровень", sub: "для алгоритмов" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="font-bold text-blue-700 text-sm">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              <div className="text-xs text-slate-400">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API Key input */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900">DeepSeek API Key</h3>
        </div>

        {/* Steps */}
        <ol className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
            <span>Зарегистрируйся на{" "}
              <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-0.5">
                platform.deepseek.com <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
            <span>Пополни баланс на $2–5 в разделе <strong>Billing</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
            <span>Создай ключ в{" "}
              <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-0.5">
                API Keys <ExternalLink className="w-3 h-3" />
              </a>
              {" "}и вставь его ниже
            </span>
          </li>
        </ol>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">API Key</label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && testAndSave()}
              placeholder="sk-..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {status === "ok" && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {message}
          </div>
        )}

        <button
          onClick={testAndSave}
          disabled={!apiKey.trim() || status === "testing"}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {status === "testing" ? "Проверяю ключ…" : "Сохранить и проверить"}
        </button>
      </div>

      {/* Cost info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h4 className="font-semibold text-slate-700 text-sm mb-3">Примерная стоимость</h4>
        <div className="space-y-1.5 text-xs text-slate-500">
          <div className="flex justify-between"><span>1 разговор с AI Ментором</span><span className="font-medium text-slate-700">~$0.0001–0.001</span></div>
          <div className="flex justify-between"><span>$2 баланс</span><span className="font-medium text-slate-700">≈ 2,000–20,000 сообщений</span></div>
          <div className="flex justify-between"><span>Генерация задачи (interview)</span><span className="font-medium text-slate-700">~$0.001</span></div>
          <div className="flex justify-between"><span>Ключ хранится</span><span className="font-medium text-slate-700">в .env на сервере</span></div>
        </div>
      </div>
    </div>
  );
}
