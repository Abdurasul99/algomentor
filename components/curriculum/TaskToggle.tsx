"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  taskId: string;
  initialCompleted: boolean;
  points: number;
}

export default function TaskToggle({ taskId, initialCompleted, points }: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [flashing, setFlashing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.checked;
    setLoading(true);

    try {
      const res = await fetch("/api/curriculum/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, isCompleted: newValue }),
      });

      if (res.ok) {
        setCompleted(newValue);
        if (newValue) {
          setFlashing(true);
          setTimeout(() => setFlashing(false), 800);
        }
      }
    } catch {
      // Silently revert on network error
    } finally {
      setLoading(false);
    }
  }

  return (
    <label
      className={cn(
        "relative flex items-center justify-center w-5 h-5 rounded cursor-pointer transition-all duration-200 shrink-0",
        loading ? "opacity-50" : "",
        flashing ? "ring-2 ring-green-400 ring-offset-1" : ""
      )}
    >
      <input
        type="checkbox"
        checked={completed}
        onChange={handleChange}
        disabled={loading}
        className="sr-only"
      />
      <div
        className={cn(
          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200",
          completed
            ? "bg-green-500 border-green-500"
            : "bg-white border-slate-300 hover:border-indigo-400"
        )}
      >
        {completed && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      {flashing && (
        <span className="absolute inset-0 rounded bg-green-400 opacity-30 animate-ping" />
      )}
    </label>
  );
}
