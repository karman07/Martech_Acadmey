"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import KycDocThumb from "@/components/KycDocThumb";
import { formatDate } from "@/lib/format";

type KycItem = {
  id: string;
  userUid: string;
  idType: string;
  idNumber: string;
  status: string;
  rejectionReason: string | null;
  infoRequestNote: string | null;
  submittedAt: string;
  user: { name: string; email: string | null };
};

const STATUS_TABS = ["pending", "info_requested", "approved", "rejected"] as const;

export default function KycReviewPage() {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState<KycItem[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>("pending");
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<KycItem | null>(null);
  const [infoTarget, setInfoTarget] = useState<KycItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/admin/kyc?status=${status}`)
      .then((res) => res.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [apiFetch, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(userUid: string) {
    await apiFetch(`/admin/kyc/${userUid}/approve`, { method: "POST" });
    load();
  }

  return (
    <div>
      <h1 className="font-sans text-3xl font-bold">KYC Review</h1>
      <p className="mt-1 text-sm text-muted">
        Verify teacher identity documents before they can publish content.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              status === s ? "bg-accent text-on-accent" : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {!loading && items.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface px-5 py-8 text-center text-sm text-muted">
            Nothing here.
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.user.name}</p>
                <p className="text-xs text-muted">{item.user.email}</p>
                <p className="mt-1 text-xs text-muted">
                  {item.idType.replace(/_/g, " ")} · {item.idNumber} · submitted {formatDate(item.submittedAt)}
                </p>
              </div>
              <Badge status={item.status} />
            </div>

            <div className="mt-4 flex gap-4">
              <KycDocThumb userUid={item.userUid} docType="front" label="ID front" />
              <KycDocThumb userUid={item.userUid} docType="back" label="ID back" />
              <KycDocThumb userUid={item.userUid} docType="selfie" label="Selfie" />
            </div>

            {item.rejectionReason && (
              <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                {item.rejectionReason}
              </p>
            )}

            {item.infoRequestNote && (
              <p className="mt-4 rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-400">
                Requested from teacher: {item.infoRequestNote}
              </p>
            )}

            {item.status === "pending" && (
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={() => approve(item.userUid)}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setInfoTarget(item)}>
                  Request more docs
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRejectTarget(item)}>
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {rejectTarget && (
        <RejectModal
          item={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => {
            setRejectTarget(null);
            load();
          }}
        />
      )}

      {infoTarget && (
        <RequestInfoModal
          item={infoTarget}
          onClose={() => setInfoTarget(null)}
          onDone={() => {
            setInfoTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function RejectModal({ item, onClose, onDone }: { item: KycItem; onClose: () => void; onDone: () => void }) {
  const { apiFetch } = useAuth();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    await apiFetch(`/admin/kyc/${item.userUid}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setSubmitting(false);
    onDone();
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-sans text-xl font-bold">Reject KYC — {item.user.name}</h2>
      <div className="mt-5">
        <label htmlFor="reason" className="text-xs font-semibold text-muted">
          Reason (shown to the teacher)
        </label>
        <textarea
          id="reason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <Button onClick={submit} loading={submitting} disabled={reason.trim().length < 3} className="mt-6 w-full">
        Confirm rejection
      </Button>
    </Modal>
  );
}

function RequestInfoModal({ item, onClose, onDone }: { item: KycItem; onClose: () => void; onDone: () => void }) {
  const { apiFetch } = useAuth();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    await apiFetch(`/admin/kyc/${item.userUid}/request-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setSubmitting(false);
    onDone();
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-sans text-xl font-bold">Request more documents — {item.user.name}</h2>
      <div className="mt-5">
        <label htmlFor="note" className="text-xs font-semibold text-muted">
          What do you need from them? (shown to the teacher)
        </label>
        <textarea
          id="note"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Your ID photo is blurry — please re-upload a clearer front and back."
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <Button onClick={submit} loading={submitting} disabled={note.trim().length < 3} className="mt-6 w-full">
        Send request
      </Button>
    </Modal>
  );
}
