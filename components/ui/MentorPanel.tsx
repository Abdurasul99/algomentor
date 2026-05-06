import Link from "next/link";
import { Sparkles, AlertTriangle, CheckCircle, ArrowRight, Info } from "lucide-react";
import type { MentorRecommendation } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons = {
  warning: AlertTriangle,
  suggestion: Info,
  encouragement: CheckCircle,
  action: Sparkles,
};

const colors = {
  warning: "border-amber-200 bg-amber-50",
  suggestion: "border-blue-200 bg-blue-50",
  encouragement: "border-green-200 bg-green-50",
  action: "border-indigo-200 bg-indigo-50",
};

const iconColors = {
  warning: "text-amber-600",
  suggestion: "text-blue-600",
  encouragement: "text-green-600",
  action: "text-indigo-600",
};

interface MentorPanelProps {
  recommendations: MentorRecommendation[];
  title?: string;
}

export default function MentorPanel({ recommendations, title = "Mentor Recommendations" }: MentorPanelProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <h2 className="font-bold text-white text-sm">{title}</h2>
        </div>
        <p className="text-indigo-200 text-xs mt-0.5">Personalized guidance based on your progress</p>
      </div>
      <div className="p-4 space-y-3">
        {recommendations.map((rec, i) => {
          const Icon = icons[rec.type];
          return (
            <div
              key={i}
              className={cn("border rounded-lg p-3.5 flex gap-3", colors[rec.type])}
            >
              <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", iconColors[rec.type])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-relaxed">{rec.message}</p>
                {rec.action && rec.actionHref && (
                  <Link
                    href={rec.actionHref}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold mt-2",
                      iconColors[rec.type],
                      "hover:underline"
                    )}
                  >
                    {rec.action}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
