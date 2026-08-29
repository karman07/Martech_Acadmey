"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { formatCurrency, formatDate } from "@/lib/format";

type SalesPayout = {
  id: string;
  salesRepUid: string;
  periodLabel: string;
  amount: number | string;
  status: "pending" | "processing" | "paid";
  method: string;
  dateISO: string;
  salesRep: { name: string; email: string | null };
};

type SalesRep = { uid: string; name: string; email: string | null };

const STATUS_OPTIONS = ["pending", "processing", "paid"] as const;

export default function SalesPayoutsPage() {
  const { apiFetch } = useAuth();
  const [payouts, setPayouts] = useState<SalesPayout[]>([]);
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/admin/sales-payouts")
      .then((res) => res.json())
      .then(setPayouts)
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    load();
    apiFetch("/admin/sales-reps")
      .then((res) => res.json())
      .then((rows: SalesRep[]) => setReps(rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id: string, status: string) {
    setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, status: status as SalesPayout["status"] } : p)));
    await apiFetch(`/admin/sales-payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-bold">Sales Payouts</h1>
          <p className="mt-1 text-sm text-muted">Record and track commission paid out to the sales team.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          New payout
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background-soft text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Sales rep</th>
              <th className="px-5 py-3 font-semibold">Period</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Method</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!loading && payouts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  No payouts yet.
                </td>
              </tr>
            )}
            {payouts.map((payout) => (
              <tr key={payout.id}>
                <td className="px-5 py-4 font-medium">{payout.salesRep.name}</td>
                <td className="px-5 py-4 text-muted">{payout.periodLabel}</td>
                <td className="px-5 py-4 font-semibold">{formatCurrency(Number(payout.amount))}</td>
                <td className="px-5 py-4 text-muted">{payout.method}</td>
                <td className="px-5 py-4 text-muted">{formatDate(payout.dateISO)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Badge status={payout.status} />
                    <select
                      value={payout.status}
                      onChange={(e) => updateStatus(payout.id, e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:border-accent"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreatePayoutModal
          reps={reps}
          onClose={() => setShowCreate(false)}
          onDone={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreatePayoutModal({
  reps,
  onClose,
  onDone,
}: {
  reps: SalesRep[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { apiFetch } = useAuth();
  const [salesRepUid, setSalesRepUid] = useState(reps[0]?.uid ?? "");
  const [periodLabel, setPeriodLabel] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("Bank transfer");
  const [dateISO, setDateISO] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!salesRepUid || !periodLabel) {
      setError("Pick a sales rep and enter a period label.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/sales-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesRepUid, periodLabel, amount, method, dateISO }),
      });
      if (!res.ok) throw new Error();
      onDone();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-sans text-xl font-bold">New payout</h2>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3.5">
        <div>
          <label className="text-xs font-semibold text-muted">Sales rep</label>
          <select
            value={salesRepUid}
            onChange={(e) => setSalesRepUid(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          >
            {reps.map((r) => (
              <option key={r.uid} value={r.uid}>
                {r.name} ({r.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Period label</label>
          <input
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            placeholder="e.g. August 2026"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Amount (₹)</label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Method</label>
          <input
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Date</label>
          <input
            type="date"
            value={dateISO}
            onChange={(e) => setDateISO(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <Button onClick={submit} loading={submitting} className="mt-6 w-full">
        Create payout
      </Button>
    </Modal>
  );
}
