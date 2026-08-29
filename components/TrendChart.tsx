"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Point = { month: string; value: number };

function CustomTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="manga-border rounded-lg bg-surface px-3 py-2 text-xs">
      <p className="font-semibold text-muted">{label}</p>
      <p className="mt-0.5 font-bold text-foreground">{formatValue(payload[0].value)}</p>
    </div>
  );
}

export default function TrendChart({
  title,
  data,
  color,
  formatValue = (v) => v.toLocaleString(),
}: {
  title: string;
  data: Point[];
  color: string;
  formatValue?: (value: number) => string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${title.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis
              dataKey="month"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`)}
            />
            <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#fill-${title.replace(/\s+/g, "-")})`}
              activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
