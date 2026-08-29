"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { formatDate } from "@/lib/format";

type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  interest: string | null;
  notes: string | null;
  status: "open" | "done";
  createdAt: string;
  doneAt: string | null;
  salesRep: { name: string; email: string | null };
};

const STATUS_TABS = ["open", "done"] as const;

export default function SalesEnquiriesPage() {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>("open");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/admin/enquiries?status=${status}`)
      .then((res) => res.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [apiFetch, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function markDone(id: string) {
    await apiFetch(`/admin/enquiries/${id}/done`, { method: "PATCH" });
    load();
  }

  return (
    <div>
      <h1 className="font-sans text-3xl font-bold">Enquiries</h1>
      <p className="mt-1 text-sm text-muted">Leads logged by the sales team, across every rep.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              status === s ? "bg-accent text-on-accent" : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-14 text-center">
            <p className="font-sans text-lg font-bold">Nothing here</p>
            <p className="mt-1.5 text-sm text-muted">No {status} enquiries.</p>
          </div>
        )}

        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {item.phone}
                  {item.email ? ` · ${item.email}` : ""}
                </p>
                {item.interest && <p className="mt-1.5 text-sm text-foreground/80">Interested in: {item.interest}</p>}
                {item.notes && <p className="mt-1.5 text-sm text-muted">{item.notes}</p>}
                <p className="mt-2 text-[11px] text-muted">
                  Logged by <span className="font-semibold">{item.salesRep.name}</span> · {formatDate(item.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge status={item.status} />
                {item.status === "open" && (
                  <Button size="sm" onClick={() => markDone(item.id)}>
                    Mark done
                  </Button>
                )}
                {item.status === "done" && item.doneAt && (
                  <span className="text-[11px] text-muted">Done {formatDate(item.doneAt)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
