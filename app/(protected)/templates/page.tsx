"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Button from "@/components/Button";

type PageTemplate = {
  id: string;
  key: string;
  name: string;
  description: string;
  isActive: boolean;
  updatedAt: string;
};

export default function TemplatesPage() {
  const { apiFetch } = useAuth();
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/admin/page-templates")
      .then((res) => res.json())
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string, name: string) {
    if (!confirm(`Delete the "${name}" template? Any teacher using it will fall back to a plain profile page.`)) return;
    await apiFetch(`/admin/page-templates/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-bold">Instructor profile templates</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Custom HTML + Tailwind templates teachers can pick for their public instructor profile page,
            alongside the built-in Signature, Editorial, and Minimal templates.
          </p>
        </div>
        <Button href="/templates/new" size="sm">
          New template
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background-soft text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Key</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Updated</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!loading && templates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  No templates yet — create one to give teachers another look to choose from.
                </td>
              </tr>
            )}
            {templates.map((t) => (
              <tr key={t.id}>
                <td className="px-5 py-4 font-medium">{t.name}</td>
                <td className="px-5 py-4 text-muted">{t.key}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      t.isActive
                        ? "bg-accent-soft text-accent"
                        : "bg-background-soft text-muted"
                    }`}
                  >
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted">{new Date(t.updatedAt).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" href={`/templates/${t.id}`}>
                      Edit
                    </Button>
                    <button
                      onClick={() => remove(t.id, t.name)}
                      className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:border-red-500/40 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
