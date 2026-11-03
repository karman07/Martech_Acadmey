"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  enquiryType: string;
  message: string;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  student: "Student enquiry",
  instructor: "Instructor enquiry",
  technical: "Technical issue",
  other: "Other",
};

export default function MessagesPage() {
  const { apiFetch } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    apiFetch("/admin/contact-messages")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const visible = filter === "all" ? messages : messages.filter((m) => m.enquiryType === filter);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-bold">Messages</h1>
          <p className="mt-1 text-sm text-muted">Enquiries sent from the Contact Us page, newest first.</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm"
        >
          <option value="all">All enquiries</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {loading && <div className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />}
        {!loading && visible.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
            No messages yet.
          </div>
        )}
        {visible.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {m.name} <span className="font-normal text-muted">· {m.email}</span>
              </p>
              <p className="text-xs text-muted">
                {TYPE_LABELS[m.enquiryType] ?? m.enquiryType} · {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{m.message}</p>
            <a href={`mailto:${m.email}`} className="mt-3 inline-block text-sm font-semibold text-accent">
              Reply by email
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
