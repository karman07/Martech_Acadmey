"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import KycDocThumb from "@/components/KycDocThumb";
import { formatCurrency, formatDate } from "@/lib/format";

type ContentRow = { id: string; title: string; status: string; price: string; createdAt: string };
type PayoutRow = { id: string; periodLabel: string; amount: string; status: string; method: string; dateISO: string };
type EnrollmentRow = { id: string; enrolledAt: string; course: { title: string; slug: string } };

type UserDetail = {
  uid: string;
  name: string;
  email: string | null;
  role: "student" | "teacher" | "admin";
  phone: string | null;
  phoneVerified: boolean;
  state: string | null;
  city: string | null;
  expertise: string | null;
  experience: string | null;
  bio: string | null;
  createdAt: string;
  kyc: {
    idType: string;
    idNumber: string;
    status: string;
    rejectionReason: string | null;
    infoRequestNote: string | null;
    submittedAt: string;
  } | null;
  courses: ContentRow[];
  ebooks: ContentRow[];
  bootcamps: ContentRow[];
  bundles: ContentRow[];
  payouts: PayoutRow[];
  enrollments: EnrollmentRow[];
};

export default function UserDetailPage() {
  const params = useParams<{ uid: string }>();
  const router = useRouter();
  const { apiFetch } = useAuth();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/admin/users/${params.uid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .finally(() => setLoading(false));
  }, [apiFetch, params.uid]);

  useEffect(() => {
    load();
  }, [load]);

  async function approveKyc() {
    await apiFetch(`/admin/kyc/${params.uid}/approve`, { method: "POST" });
    load();
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-14 text-center">
        <p className="font-sans text-lg font-bold">User not found</p>
        <Button href="/users" variant="secondary" size="sm" className="mt-4">
          Back to users
        </Button>
      </div>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();
  const contentSections: { label: string; rows: ContentRow[] }[] = [
    { label: "Courses", rows: user.courses },
    { label: "Ebooks", rows: user.ebooks },
    { label: "Bootcamps", rows: user.bootcamps },
    { label: "Bundles", rows: user.bundles },
  ];

  return (
    <div>
      <button
        onClick={() => router.push("/users")}
        className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to users
      </button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-on-accent">
            {initial}
          </span>
          <div>
            <h1 className="font-sans text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[11px] font-bold capitalize text-muted">
                {user.role}
              </span>
              <span className="text-[11px] text-muted">Joined {formatDate(user.createdAt)}</span>
              <span className="text-[11px] text-muted">Phone {user.phoneVerified ? "verified" : "not verified"}</span>
            </div>
          </div>
        </div>

        {user.role === "teacher" && (
          <a
            href={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/instructors/${user.uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M14 3h7v7M10 14 21 3M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
            </svg>
            View public profile
          </a>
        )}
      </div>

      {(user.state || user.city || user.expertise || user.experience || user.bio) && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-sans text-lg font-bold">Profile details</h2>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            {user.state && (
              <p>
                <span className="text-muted">Location: </span>
                {user.city ? `${user.city}, ` : ""}
                {user.state}
              </p>
            )}
            {user.expertise && (
              <p>
                <span className="text-muted">Expertise: </span>
                {user.expertise}
              </p>
            )}
            {user.experience && (
              <p>
                <span className="text-muted">Experience: </span>
                {user.experience}
              </p>
            )}
          </div>
          {user.bio && <p className="mt-3 text-sm text-muted">{user.bio}</p>}
        </div>
      )}

      {user.kyc && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-sans text-lg font-bold">Identity verification</h2>
            <Badge status={user.kyc.status} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {user.kyc.idType.replace(/_/g, " ")} · {user.kyc.idNumber} · submitted {formatDate(user.kyc.submittedAt)}
          </p>

          <div className="mt-4 flex gap-4">
            <KycDocThumb userUid={user.uid} docType="front" label="ID front" />
            <KycDocThumb userUid={user.uid} docType="back" label="ID back" />
            <KycDocThumb userUid={user.uid} docType="selfie" label="Selfie" />
          </div>

          {user.kyc.rejectionReason && (
            <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              {user.kyc.rejectionReason}
            </p>
          )}
          {user.kyc.infoRequestNote && (
            <p className="mt-4 rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-400">
              Requested from teacher: {user.kyc.infoRequestNote}
            </p>
          )}

          {(user.kyc.status === "pending" || user.kyc.status === "info_requested") && (
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={approveKyc}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setInfoOpen(true)}>
                Request more docs
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setRejectOpen(true)}>
                Reject
              </Button>
            </div>
          )}
        </div>
      )}

      {user.role === "teacher" &&
        contentSections.map(
          (section) =>
            section.rows.length > 0 && (
              <div key={section.label} className="mt-6 rounded-2xl border border-border bg-surface p-5">
                <h2 className="font-sans text-lg font-bold">{section.label}</h2>
                <div className="mt-3 divide-y divide-border">
                  {section.rows.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="font-medium">{row.title}</span>
                      <span className="flex items-center gap-3 text-xs text-muted">
                        {formatCurrency(Number(row.price))}
                        <Badge status={row.status} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ),
        )}

      {user.role === "teacher" && user.payouts.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-sans text-lg font-bold">Payouts</h2>
          <div className="mt-3 divide-y divide-border">
            {user.payouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="font-medium">{payout.periodLabel}</span>
                <span className="flex items-center gap-3 text-xs text-muted">
                  {formatCurrency(Number(payout.amount))} · {payout.method}
                  <Badge status={payout.status} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {user.role === "student" && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-sans text-lg font-bold">Enrollments</h2>
          {user.enrollments.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No enrollments yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-border">
              {user.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium">{enrollment.course.title}</span>
                  <span className="text-xs text-muted">Enrolled {formatDate(enrollment.enrolledAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {rejectOpen && (
        <ReasonModal
          title="Reject KYC"
          label="Reason (shown to the teacher)"
          confirmLabel="Confirm rejection"
          placeholder=""
          onSubmit={async (reason) => {
            await apiFetch(`/admin/kyc/${params.uid}/reject`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason }),
            });
          }}
          onClose={() => setRejectOpen(false)}
          onDone={() => {
            setRejectOpen(false);
            load();
          }}
        />
      )}

      {infoOpen && (
        <ReasonModal
          title="Request more documents"
          label="What do you need from them? (shown to the teacher)"
          confirmLabel="Send request"
          placeholder="e.g. Your ID photo is blurry — please re-upload a clearer front and back."
          onSubmit={async (note) => {
            await apiFetch(`/admin/kyc/${params.uid}/request-info`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ note }),
            });
          }}
          onClose={() => setInfoOpen(false)}
          onDone={() => {
            setInfoOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ReasonModal({
  title,
  label,
  confirmLabel,
  placeholder,
  onSubmit,
  onClose,
  onDone,
}: {
  title: string;
  label: string;
  confirmLabel: string;
  placeholder: string;
  onSubmit: (text: string) => Promise<void>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    await onSubmit(text);
    setSubmitting(false);
    onDone();
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="font-sans text-xl font-bold">{title}</h2>
      <div className="mt-5">
        <label htmlFor="reason-text" className="text-xs font-semibold text-muted">
          {label}
        </label>
        <textarea
          id="reason-text"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>
      <Button onClick={submit} loading={submitting} disabled={text.trim().length < 3} className="mt-6 w-full">
        {confirmLabel}
      </Button>
    </Modal>
  );
}
