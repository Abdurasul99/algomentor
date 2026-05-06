import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  size = "md",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };
  const color =
    pct >= 75
      ? "bg-green-500"
      : pct >= 50
      ? "bg-blue-500"
      : pct >= 25
      ? "bg-yellow-500"
      : "bg-red-400";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 bg-slate-100 rounded-full overflow-hidden", heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", color, barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 w-9 text-right">{Math.round(pct)}%</span>
      )}
    </div>
  );
}
