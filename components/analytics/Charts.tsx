"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  type PieLabelRenderProps,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

// ─── Module Bar Chart ──────────────────────────────────────────────────────────

export interface ModuleBarChartData {
  name: string;
  quizScore: number;
  practiceScore: number;
  masteryScore: number;
}

interface ModuleBarChartProps {
  data: ModuleBarChartData[];
}

export function ModuleBarChart({ data }: ModuleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#64748b" }}
          angle={-40}
          textAnchor="end"
          interval={0}
          height={72}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          formatter={(value: ValueType | undefined) => [`${Math.round(Number(value ?? 0))}%`]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="quizScore" name="Quiz Score" fill="#6366f1" radius={[3, 3, 0, 0]} />
        <Bar dataKey="practiceScore" name="Practice Score" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="masteryScore" name="Mastery Score" fill="#f59e0b" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Activity Line Chart ───────────────────────────────────────────────────────

export interface ActivityLineChartData {
  date: string;
  minutesSpent: number;
  problemsSolved: number;
}

interface ActivityLineChartProps {
  data: ActivityLineChartData[];
}

export function ActivityLineChart({ data }: ActivityLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#64748b" }}
          interval={Math.max(0, Math.floor(data.length / 6) - 1)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickFormatter={(v) => `${v}m`}
        />
        <Tooltip
          formatter={(value: ValueType | undefined, name: NameType | undefined) => [
            name === "minutesSpent" ? `${value ?? 0} min` : `${value ?? 0} solved`,
            name === "minutesSpent" ? "Minutes Spent" : "Problems Solved",
          ]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
        <Line
          type="monotone"
          dataKey="minutesSpent"
          name="Minutes Spent"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3, fill: "#6366f1" }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="problemsSolved"
          name="Problems Solved"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 3, fill: "#22c55e" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Accuracy Donut Chart ──────────────────────────────────────────────────────

export interface AccuracyDonutChartData {
  name: string;
  value: number;
  color: string;
}

interface AccuracyDonutChartProps {
  data: AccuracyDonutChartData[];
}

const RADIAN = Math.PI / 180;

function renderCustomLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  const cxNum = Number(cx ?? 0);
  const cyNum = Number(cy ?? 0);
  const midAngleNum = Number(midAngle ?? 0);
  const innerR = Number(innerRadius ?? 0);
  const outerR = Number(outerRadius ?? 0);
  const pct = Number(percent ?? 0);

  if (pct < 0.05) return null;
  const radius = innerR + (outerR - innerR) * 0.5;
  const x = cxNum + radius * Math.cos(-midAngleNum * RADIAN);
  const y = cyNum + radius * Math.sin(-midAngleNum * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${Math.round(pct * 100)}%`}
    </text>
  );
}

export function AccuracyDonutChart({ data }: AccuracyDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: ValueType | undefined) => [`${value ?? 0} attempts`]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => <span style={{ color: "#475569" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
