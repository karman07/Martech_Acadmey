"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import StatCard from "@/components/StatCard";
import TrendChart from "@/components/TrendChart";
import Badge from "@/components/Badge";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";

type Metrics = {
  users: { total: number; students: number; teachers: number; admins: number; newLast30Days: number };
  content: Record<string, Record<string, number>>;
  pendingContentCount: number;
  pendingKycCount: number;
  revenue: {
    totalGMV: number;
    totalPayoutsPaid: number;
    months: { month: string; gmv: number; enrollments: number }[];
  };
  recentSignups: { uid: string; name: string; email: string | null; role: string; createdAt: string }[];
};

export default function OverviewPage() {
  const { apiFetch } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/admin/metrics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load metrics");
        return res.json();
      })
      .then(setMetrics)
      .catch(() => setError("Couldn't load platform metrics."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!metrics) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading metrics...
      </div>
    );
  }

  const gmvSeries = metrics.revenue.months.map((m) => ({ month: m.month, value: m.gmv }));
  const enrollmentSeries = metrics.revenue.months.map((m) => ({ month: m.month, value: m.enrollments }));

  return (
    <div>
      <h1 className="font-sans text-3xl font-bold">Overview</h1>
      <p className="mt-1 text-sm text-muted">Platform health at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={formatNumber(metrics.users.total)}
          sublabel={`+${metrics.users.newLast30Days} / 30d`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
              <path d="M16 8.5a3.5 3.5 0 1 1 3.5 3.5" />
              <path d="M21.5 19a5.5 5.5 0 0 0-4-5.3" />
            </svg>
          }
        />
        <StatCard
          label="Students / Teachers"
          value={`${formatNumber(metrics.users.students)} / ${formatNumber(metrics.users.teachers)}`}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2Z" />
            </svg>
          }
        />
        <StatCard
          label="Pending review"
          value={formatNumber(metrics.pendingContentCount)}
          sublabel="content"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
        <StatCard
          label="Pending KYC"
          value={formatNumber(metrics.pendingKycCount)}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="2" />
            </svg>
          }
        />
        <StatCard
          label="Total GMV"
          value={formatCurrency(metrics.revenue.totalGMV)}
          sublabel="all-time"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Payouts issued"
          value={formatCurrency(metrics.revenue.totalPayoutsPaid)}
          sublabel="all-time"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3 10h18" />
            </svg>
          }
        />
        <StatCard
          label="Est. platform margin"
          value={formatCurrency(metrics.revenue.totalGMV - metrics.revenue.totalPayoutsPaid)}
          sublabel="GMV − payouts"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M15 7h6v6" />
            </svg>
          }
        />
        <StatCard
          label="Admins"
          value={formatNumber(metrics.users.admins)}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M12 3 4 6v6c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V6l-8-3Z" />
            </svg>
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <TrendChart title="GMV, last 12 months" data={gmvSeries} color="var(--accent)" formatValue={formatCurrency} />
        <TrendChart
          title="Enrollments, last 12 months"
          data={enrollmentSeries}
          color="var(--chart-series-2)"
          formatValue={formatNumber}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Needs review</p>
            <div className="flex gap-2">
              <Link href="/content" className="text-xs font-semibold text-accent hover:underline">
                Content →
              </Link>
              <Link href="/kyc" className="text-xs font-semibold text-accent hover:underline">
                KYC →
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {(["courses", "ebooks", "bootcamps", "bundles"] as const).map((type) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted">{type}</span>
                <Badge status={metrics.content[type].pending_review > 0 ? "pending_review" : "published"} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm font-semibold">Recent signups</p>
          <div className="mt-4 flex flex-col gap-3">
            {metrics.recentSignups.map((user) => (
              <div key={user.uid} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs capitalize text-muted">{user.role}</span>
                  <span className="text-xs text-muted">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
