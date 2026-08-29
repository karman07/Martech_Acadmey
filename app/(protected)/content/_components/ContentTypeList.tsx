"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, publicFileUrl } from "@/lib/auth/AuthProvider";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ContentTypeIcon from "@/components/ContentTypeIcon";
import { formatCurrency } from "@/lib/format";

export type ContentType = "courses" | "ebooks" | "bootcamps" | "bundles";

export type CourseLesson = {
  id: string;
  title: string;
  type: "video" | "document" | "link" | "quiz";
  durationMin: number | null;
  order: number;
  quizQuestionCount: number | null;
};

export type CourseModule = {
  id: string;
  title: string;
  order: number;
  lessons: CourseLesson[];
};

export type ContentCounts = {
  lessons: number;
  assignments: number;
  activities: number;
  quizzes: number;
  libraryEbooks: number;
  liveClasses: number;
};

export type ContentItem = {
  id: string;
  contentType: ContentType;
  title: string;
  summary?: string;
  tagline?: string;
  category?: string;
  level?: string;
  format?: string;
  instructor: { uid: string; name: string };
  price: number;
  marginPercent: number;
  finalPrice: number;
  status: string;
  rejectionReason: string | null;
  coverTheme: { from: string; to: string };
  coverImagePath: string | null;
  // Courses only:
  studentsEnrolled?: number;
  reviewCount?: number;
  rating?: number;
  views?: number;
  modules?: CourseModule[];
  contentCounts?: ContentCounts;
};

const STATUS_TABS = ["pending_review", "draft", "published", "rejected"] as const;
export const TYPE_LABEL: Record<ContentType, string> = {
  courses: "Course",
  ebooks: "Ebook",
  bootcamps: "Bootcamp",
  bundles: "Bundle",
};

export default function ContentTypeList({ contentType }: { contentType: ContentType }) {
  const router = useRouter();
  const { apiFetch } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>("pending_review");
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<{ item: ContentItem; action: "approve" | "reject" | "margin" } | null>(
    null,
  );

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/admin/content?status=${status}`)
      .then((res) => res.json())
      .then((all: ContentItem[]) => setItems(all.filter((i) => i.contentType === contentType)))
      .finally(() => setLoading(false));
  }, [apiFetch, status, contentType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
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

      <div className="mt-6 flex flex-col gap-3">
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-14 text-center">
            <p className="font-sans text-lg font-bold">Nothing here</p>
            <p className="mt-1.5 text-sm text-muted">
              No {status.replace("_", " ")} {TYPE_LABEL[contentType].toLowerCase()}s match this filter.
            </p>
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-surface transition-colors hover:border-accent/30"
          >
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 sm:w-96 sm:shrink-0">
              <span
                className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cover bg-center ${item.coverImagePath ? "" : "halftone-on-accent"}`}
                style={
                  item.coverImagePath
                    ? { backgroundImage: `url(${publicFileUrl(item.coverImagePath)})` }
                    : { backgroundImage: `linear-gradient(135deg, ${item.coverTheme.from}, ${item.coverTheme.to})` }
                }
              >
                {!item.coverImagePath && <ContentTypeIcon type={item.contentType} />}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {TYPE_LABEL[item.contentType]}
                  {item.category ? ` · ${item.category}` : ""}
                  {item.level ? ` · ${item.level}` : ""}
                  {item.format ? ` · ${item.format}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge status={item.status} />
                  <span className="text-[11px] text-muted">{item.instructor?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 items-center gap-6 border-t border-border pt-4 sm:border-t-0 sm:pt-0">
              <div>
                <p className="font-sans text-lg font-bold">{formatCurrency(item.finalPrice)}</p>
                <p className="text-[11px] text-muted">Student pays</p>
              </div>
              <div>
                <p className="font-sans text-lg font-bold">{formatCurrency(item.price)}</p>
                <p className="text-[11px] text-muted">Teacher price</p>
              </div>
              <div>
                <p className="font-sans text-lg font-bold">{item.marginPercent}%</p>
                <p className="text-[11px] text-muted">Margin</p>
              </div>
              {item.contentType === "courses" && (
                <div>
                  <p className="font-sans text-lg font-bold">{item.studentsEnrolled ?? 0}</p>
                  <p className="text-[11px] text-muted">Enrolled</p>
                </div>
              )}
            </div>

            {item.rejectionReason && (
              <p className="max-w-xs rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                {item.rejectionReason}
              </p>
            )}

            <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4 sm:border-t-0 sm:pt-0">
              {item.contentType === "courses" && (
                <Button size="sm" variant="secondary" onClick={() => router.push(`/content/courses/${item.id}`)}>
                  View course
                </Button>
              )}
              {item.status === "pending_review" && (
                <>
                  <Button size="sm" onClick={() => setActionTarget({ item, action: "approve" })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setActionTarget({ item, action: "reject" })}>
                    Reject
                  </Button>
                </>
              )}
              {item.status === "published" && (
                <Button size="sm" variant="secondary" onClick={() => setActionTarget({ item, action: "margin" })}>
                  Adjust margin
                </Button>
              )}
            </div>
          </div>
          </div>
        ))}
      </div>

      {actionTarget && (
        <ActionModal
          target={actionTarget}
          onClose={() => setActionTarget(null)}
          onDone={() => {
            setActionTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export function ActionModal({
  target,
  onClose,
  onDone,
}: {
  target: { item: ContentItem; action: "approve" | "reject" | "margin" };
  onClose: () => void;
  onDone: () => void;
}) {
  const { apiFetch } = useAuth();
  const { item, action } = target;
  const [marginPercent, setMarginPercent] = useState(item.marginPercent || 0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const path = `/admin/${item.contentType}/${item.id}/${action === "margin" ? "margin" : action}`;
      const res = await apiFetch(path, {
        method: action === "margin" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "reject" ? { reason } : { marginPercent }),
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
      <h2 className="font-sans text-xl font-bold capitalize">
        {action === "margin" ? "Adjust margin" : action} — {item.title}
      </h2>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {(action === "approve" || action === "margin") && (
        <div className="mt-5">
          <label htmlFor="margin" className="text-xs font-semibold text-muted">
            Platform margin (%) — added on top of the teacher&apos;s price of {formatCurrency(item.price)}
          </label>
          <input
            id="margin"
            type="number"
            min={0}
            max={500}
            value={marginPercent}
            onChange={(e) => setMarginPercent(Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
          <p className="mt-1.5 text-xs text-muted">
            Student pays {formatCurrency(item.price * (1 + marginPercent / 100))}.
          </p>
        </div>
      )}

      {action === "reject" && (
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
      )}

      <Button
        onClick={submit}
        loading={submitting}
        disabled={action === "reject" && reason.trim().length < 3}
        className="mt-6 w-full"
      >
        Confirm
      </Button>
    </Modal>
  );
}
