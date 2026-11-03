"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Handlebars from "handlebars";
import { useAuth } from "@/lib/auth/AuthProvider";
import Button from "@/components/Button";

type PageTemplate = {
  id: string;
  key: string;
  name: string;
  description: string;
  htmlSource: string;
  isActive: boolean;
};

/** A fixed, representative instructor bundle used only for the live preview — real
 * rendering for actual visitors always uses the real instructor's data server-side. */
const MOCK_DATA = {
  instructor: {
    uid: "preview-uid",
    name: "Ayesha Khan",
    title: "Performance Marketing Lead",
    bio: "Ayesha has run paid acquisition for three venture-backed startups and now teaches practical, budget-aware performance marketing.",
    rating: 4.9,
    students: 5800,
  },
  courses: [
    { id: "c1", slug: "performance-marketing-fundamentals", title: "Performance Marketing Fundamentals", summary: "Plan, launch, and optimize paid campaigns without wasting budget.", level: "Beginner", listPrice: 49, finalPrice: 49 },
    { id: "c2", slug: "growth-hacking-for-startups", title: "Growth Hacking for Startups", summary: "Run structured growth experiments instead of random tactics.", level: "Advanced", listPrice: 79, finalPrice: 63 },
  ],
  ebooks: [
    { id: "e1", slug: "paid-acquisition-playbook", title: "The Paid Acquisition Playbook", description: "The exact campaign structures and pacing models used to scale budgets into eight figures.", pages: 148, listPrice: 19, finalPrice: 19 },
  ],
  bootcamps: [
    { id: "b1", slug: "performance-marketing-accelerator", title: "Performance Marketing Accelerator", tagline: "Eight weeks to run paid campaigns like a senior media buyer.", durationWeeks: 8, listPrice: 899, finalPrice: 899 },
  ],
  facts: [
    { id: "f1", label: "Years teaching", value: "8" },
    { id: "f2", label: "Students taught", value: "5,800+" },
    { id: "f3", label: "Courses published", value: "4" },
  ],
  blogPosts: [
    { id: "p1", title: "How I structure a first campaign brief", slug: "first-campaign-brief", excerpt: "The exact template I use before a single dollar gets spent.", createdAt: new Date().toISOString() },
  ],
};

const TOKEN_GROUPS: { title: string; tokens: string[] }[] = [
  { title: "Instructor", tokens: ["{{instructor.name}}", "{{instructor.title}}", "{{instructor.bio}}", "{{instructor.rating}}", "{{instructor.students}}"] },
  { title: "Courses (loop)", tokens: ["{{#each courses}}", "{{this.title}}", "{{this.summary}}", "{{this.level}}", "{{this.finalPrice}}", "{{/each}}"] },
  { title: "Ebooks (loop)", tokens: ["{{#each ebooks}}", "{{this.title}}", "{{this.description}}", "{{this.pages}}", "{{this.finalPrice}}", "{{/each}}"] },
  { title: "Bootcamps (loop)", tokens: ["{{#each bootcamps}}", "{{this.title}}", "{{this.tagline}}", "{{this.durationWeeks}}", "{{this.finalPrice}}", "{{/each}}"] },
  { title: "Highlights (loop)", tokens: ["{{#each facts}}", "{{this.label}}", "{{this.value}}", "{{/each}}"] },
  { title: "Blog (loop)", tokens: ["{{#each blogPosts}}", "{{this.title}}", "{{this.excerpt}}", "{{/each}}"] },
];

const STARTER_HTML = `<div class="max-w-4xl mx-auto px-6 py-16">
  <h1 class="text-3xl font-bold">{{instructor.name}}</h1>
  <p class="text-muted">{{instructor.title}}</p>
  <p class="mt-4">{{instructor.bio}}</p>

  <h2 class="mt-10 text-xl font-bold">Courses</h2>
  <div class="mt-4 grid gap-4 sm:grid-cols-2">
    {{#each courses}}
    <div class="rounded-xl border border-border p-4">
      <p class="font-semibold">{{this.title}}</p>
      <p class="text-sm text-muted">{{this.summary}}</p>
    </div>
    {{/each}}
  </div>
</div>`;

export default function TemplateEditorPage() {
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";
  const router = useRouter();
  const { apiFetch } = useAuth();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [htmlSource, setHtmlSource] = useState(STARTER_HTML);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isNew) return;
    apiFetch(`/admin/page-templates/${params.id}`)
      .then((res) => res.json())
      .then((t: PageTemplate) => {
        setName(t.name);
        setKey(t.key);
        setKeyTouched(true);
        setDescription(t.description);
        setHtmlSource(t.htmlSource);
        setIsActive(t.isActive);
      })
      .finally(() => setLoading(false));
  }, [isNew, params.id, apiFetch]);

  function slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!keyTouched) setKey(slugify(value));
  }

  function handleTab(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
    setHtmlSource(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 2;
    });
  }

  const previewHtml = useMemo(() => {
    try {
      const compiled = Handlebars.compile(htmlSource, { strict: false })(MOCK_DATA);
      return `<!doctype html><html><head><meta charset="utf-8" /><script src="https://cdn.tailwindcss.com"></script></head><body style="background:#fff;color:#111;font-family:sans-serif;">${compiled}</body></html>`;
    } catch {
      return `<!doctype html><body style="font-family:sans-serif;padding:2rem;color:#b91c1c;">This template has a syntax error and can't be previewed.</body>`;
    }
  }, [htmlSource]);

  async function save(publish?: boolean) {
    setSaving(true);
    setError(null);
    try {
      const body = { name, key, description, htmlSource, ...(publish !== undefined ? { isActive: publish } : {}) };
      const res = isNew
        ? await apiFetch("/admin/page-templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await apiFetch(`/admin/page-templates/${params.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? "Something went wrong. Please try again.");
      }
      router.push("/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-3xl font-bold">{isNew ? "New template" : "Edit template"}</h1>
          <p className="mt-1 text-sm text-muted">
            Raw HTML + Tailwind classes, with Handlebars placeholders for real instructor data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.push("/templates")}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => save(isActive)} loading={saving}>
            {isNew ? "Create" : "Save"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs font-semibold text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Bold Portfolio"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Key</label>
          <input
            value={key}
            onChange={(e) => {
              setKeyTouched(true);
              setKey(slugify(e.target.value));
            }}
            placeholder="bold-portfolio"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-mono outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Shown to teachers picking a template"
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      {!isNew && (
        <label className="mt-4 flex w-fit items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          Active — selectable by teachers
        </label>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px_1fr]">
        <div>
          <label className="text-xs font-semibold text-muted">HTML source</label>
          <textarea
            ref={textareaRef}
            value={htmlSource}
            onChange={(e) => setHtmlSource(e.target.value)}
            onKeyDown={handleTab}
            spellCheck={false}
            className="mt-1.5 h-[600px] w-full resize-none rounded-xl border border-border bg-background p-3.5 font-mono text-xs leading-relaxed outline-none focus:border-accent"
          />
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Placeholders</p>
          <div className="mt-3 space-y-4">
            {TOKEN_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold">{group.title}</p>
                <div className="mt-1.5 space-y-1">
                  {group.tokens.map((token) => (
                    <code key={token} className="block truncate rounded bg-background-soft px-1.5 py-1 text-[11px]">
                      {token}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted">Live preview (sample data)</label>
          <div className="mt-1.5 h-[600px] overflow-hidden rounded-xl border border-border bg-white">
            <iframe title="Template preview" srcDoc={previewHtml} sandbox="allow-same-origin" className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
