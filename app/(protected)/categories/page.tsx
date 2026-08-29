"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

type Category = { slug: string; name: string; description: string };

export default function CategoriesPage() {
  const { apiFetch } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/categories")
      .then((res) => res.json())
      .then(setCategories)
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(slug: string) {
    if (!confirm(`Delete the "${slug}" category?`)) return;
    await apiFetch(`/admin/categories/${slug}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-muted">The taxonomy teachers pick from when publishing a course.</p>
        </div>
        <Button size="sm" onClick={() => setEditing("new")}>
          Add category
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background-soft text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Slug</th>
              <th className="px-5 py-3 font-semibold">Description</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted">
                  No categories yet.
                </td>
              </tr>
            )}
            {categories.map((cat) => (
              <tr key={cat.slug}>
                <td className="px-5 py-4 font-medium">{cat.name}</td>
                <td className="px-5 py-4 text-muted">{cat.slug}</td>
                <td className="max-w-[320px] truncate px-5 py-4 text-muted">{cat.description}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(cat)}>
                      Edit
                    </Button>
                    <button
                      onClick={() => remove(cat.slug)}
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

      {editing && (
        <CategoryModal
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CategoryModal({
  category,
  onClose,
  onDone,
}: {
  category: Category | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { apiFetch } = useAuth();
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = category
        ? await apiFetch(`/admin/categories/${category.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description }),
          })
        : await apiFetch("/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, name, description }),
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
      <h2 className="font-sans text-xl font-bold">{category ? "Edit category" : "Add category"}</h2>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3.5">
        {!category && (
          <div>
            <label className="text-xs font-semibold text-muted">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. marketing"
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <Button onClick={submit} loading={submitting} className="mt-6 w-full">
        Save
      </Button>
    </Modal>
  );
}
