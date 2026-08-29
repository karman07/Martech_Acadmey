"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { formatCurrency, formatDate } from "@/lib/format";

type SalesRep = {
  uid: string;
  name: string;
  email: string | null;
  commissionPercent: number;
  createdAt: string;
  enquiryCount: number;
  openEnquiryCount: number;
  enrollmentsSold: number;
  totalCommissionEarned: number;
  totalPaidOut: number;
  totalCommissionOwed: number;
};

export default function SalesTeamPage() {
  const { apiFetch } = useAuth();
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [commissionTarget, setCommissionTarget] = useState<SalesRep | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/admin/sales-reps")
      .then((res) => res.json())
      .then(setReps)
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-bold">Sales Team</h1>
          <p className="mt-1 text-sm text-muted">
            Add sales reps and set their commission rate. Reps do their day-to-day work in the separate sales app.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>Add sales person</Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[840px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background-soft text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Commission</th>
              <th className="px-5 py-3 font-semibold">Enrolled</th>
              <th className="px-5 py-3 font-semibold">Open enquiries</th>
              <th className="px-5 py-3 font-semibold">Owed</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!loading && reps.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-muted">
                  No sales reps yet.
                </td>
              </tr>
            )}
            {reps.map((rep) => (
              <tr key={rep.uid}>
                <td className="px-5 py-4 font-medium">{rep.name}</td>
                <td className="px-5 py-4 text-muted">{rep.email}</td>
                <td className="px-5 py-4 font-semibold text-accent">{rep.commissionPercent}%</td>
                <td className="px-5 py-4">{rep.enrollmentsSold}</td>
                <td className="px-5 py-4">{rep.openEnquiryCount}</td>
                <td className="px-5 py-4">{formatCurrency(rep.totalCommissionOwed)}</td>
                <td className="px-5 py-4 text-muted">{formatDate(rep.createdAt)}</td>
                <td className="px-5 py-4">
                  <Button size="sm" variant="secondary" onClick={() => setCommissionTarget(rep)}>
                    Edit commission
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddSalesRepModal
          onClose={() => setAddOpen(false)}
          onDone={() => {
            setAddOpen(false);
            load();
          }}
        />
      )}

      {commissionTarget && (
        <EditCommissionModal
          rep={commissionTarget}
          onClose={() => setCommissionTarget(null)}
          onDone={() => {
            setCommissionTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddSalesRepModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { apiFetch } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [commissionPercent, setCommissionPercent] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/sales-reps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, commissionPercent }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Could not create this account.");
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-sans text-xl font-bold">Add sales person</h2>
      <p className="mt-1 text-sm text-muted">
        Creates their login for the sales app (localhost:3020) — share these credentials with them directly.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-3.5">
        <div>
          <label className="text-xs font-semibold text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Password</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Commission percent (per enrollment)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <Button
        onClick={submit}
        loading={submitting}
        disabled={name.trim().length < 2 || !email.includes("@") || password.length < 6}
        className="mt-6 w-full"
      >
        Create account
      </Button>
    </Modal>
  );
}

function EditCommissionModal({ rep, onClose, onDone }: { rep: SalesRep; onClose: () => void; onDone: () => void }) {
  const { apiFetch } = useAuth();
  const [commissionPercent, setCommissionPercent] = useState(rep.commissionPercent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(`/admin/sales-reps/${rep.uid}/commission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPercent }),
      });
      if (!res.ok) throw new Error();
      onDone();
    } catch {
      setError("Could not update the commission rate.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-sans text-xl font-bold">Edit commission — {rep.name}</h2>
      <p className="mt-1 text-sm text-muted">
        Only affects future sales — past enrollments keep the commission rate that was in effect when they were made.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5">
        <label className="text-xs font-semibold text-muted">Commission percent</label>
        <input
          type="number"
          min={0}
          max={100}
          value={commissionPercent}
          onChange={(e) => setCommissionPercent(Number(e.target.value))}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <Button onClick={submit} loading={submitting} className="mt-6 w-full">
        Save
      </Button>
    </Modal>
  );
}
