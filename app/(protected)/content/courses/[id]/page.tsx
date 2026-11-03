"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, publicFileUrl } from "@/lib/auth/AuthProvider";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import ContentTypeIcon from "@/components/ContentTypeIcon";
import { formatCurrency } from "@/lib/format";
import { ActionModal, type CourseLesson, type CourseModule, type ContentCounts } from "../../_components/ContentTypeList";

type CourseDetail = {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  categoryName: string;
  level: string;
  instructor: { uid: string; name: string; title: string | null; bio: string | null };
  price: number;
  marginPercent: number;
  listPrice: number;
  finalPrice: number;
  status: string;
  rejectionReason: string | null;
  coverTheme: { from: string; to: string };
  coverImagePath: string | null;
  courseTemplate: "classic" | "editorial" | "minimal";
  playerTemplate: "classic" | "editorial" | "minimal";
  hideLessonNavbar: boolean;
  courseAccent: string;
  rating: number;
  reviewCount: number;
  studentsEnrolled: number;
  views: number;
  modules: CourseModule[];
  assignments: { id: string; title: string; description: string; tags: string[]; dueInDays: number }[];
  activities: { id: string; title: string; description: string; tags: string[] }[];
  quizzes: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    questions: { id: string; prompt: string; options: string[]; correctOptionIndex: number }[];
  }[];
  contentCounts: ContentCounts;
  createdAt: string;
};

const LESSON_TYPE_LABEL: Record<CourseLesson["type"], string> = {
  video: "Video",
  document: "Document",
  link: "Link",
  quiz: "Quiz",
};

const LESSON_TYPE_CLASSES: Record<CourseLesson["type"], string> = {
  video: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  document: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  link: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  quiz: "bg-accent-soft text-accent",
};

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { apiFetch } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<"approve" | "reject" | "margin" | "unpublish" | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/admin/courses/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setCourse)
      .finally(() => setLoading(false));
  }, [apiFetch, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted">Loading...</p>;
  }

  if (!course) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-14 text-center">
        <p className="font-sans text-lg font-bold">Course not found</p>
        <Button href="/content/courses" variant="secondary" size="sm" className="mt-4">
          Back to courses
        </Button>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push("/content/courses")}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to courses
        </button>
        <a
          href={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/course-preview/${course.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold transition-colors hover:border-accent/40 hover:text-accent"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View full course page
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6M10 14 21 3" />
          </svg>
        </a>
      </div>

      {/* Hero */}
      <div
        className={`manga-border relative mt-4 overflow-hidden rounded-2xl bg-cover bg-center p-8 text-white ${course.coverImagePath ? "" : "halftone-on-accent"}`}
        style={
          course.coverImagePath
            ? { backgroundImage: `url(${publicFileUrl(course.coverImagePath)})` }
            : { backgroundImage: `linear-gradient(135deg, ${course.coverTheme.from}, ${course.coverTheme.to})` }
        }
      >
        {course.coverImagePath && <div className="absolute inset-0 bg-black/55" />}
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status={course.status} />
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">{course.categoryName}</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">{course.level}</span>
            </div>
            <h1 className="mt-3 font-sans text-3xl font-bold sm:text-4xl">{course.title}</h1>
            <p className="mt-2 text-sm text-white/85">{course.summary}</p>
            <p className="mt-4 text-sm font-semibold text-white/90">
              By {course.instructor.name}
              {course.instructor.title ? ` · ${course.instructor.title}` : ""}
            </p>
            <p className="mt-1 text-xs text-white/70">
              Page layout: <span className="font-semibold capitalize">{course.courseTemplate === "classic" ? "Signature" : course.courseTemplate}</span>
              {" · "}Lesson player: <span className="font-semibold capitalize">{course.playerTemplate === "classic" ? "Signature" : course.playerTemplate}</span>
              {" · "}Accent: <span className="font-semibold capitalize">{course.courseAccent}</span>
            </p>
          </div>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <ContentTypeIcon type="courses" />
          </span>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/20 pt-5 text-sm">
          <span>
            <span className="font-bold">{course.rating}</span> rating ({course.reviewCount} reviews)
          </span>
          <span>
            <span className="font-bold">{course.studentsEnrolled}</span> enrolled
          </span>
          <span>
            <span className="font-bold">{course.views.toLocaleString()}</span> views
          </span>
          <span>
            <span className="font-bold">{totalLessons}</span> lessons across {course.modules.length} modules
          </span>
        </div>
      </div>

      {course.rejectionReason && (
        <p className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {course.rejectionReason}
        </p>
      )}

      {/* Pricing + actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap gap-8">
          <div>
            <p className="font-sans text-xl font-bold">{formatCurrency(course.finalPrice)}</p>
            <p className="text-[11px] text-muted">Student pays</p>
          </div>
          <div>
            <p className="font-sans text-xl font-bold">{formatCurrency(course.price)}</p>
            <p className="text-[11px] text-muted">Teacher price</p>
          </div>
          <div>
            <p className="font-sans text-xl font-bold">{course.marginPercent}%</p>
            <p className="text-[11px] text-muted">Platform margin</p>
          </div>
        </div>
        <div className="flex gap-2">
          {course.status === "pending_review" && (
            <>
              <Button size="sm" onClick={() => setActionTarget("approve")}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setActionTarget("reject")}>
                Reject
              </Button>
            </>
          )}
          {course.status === "published" && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setActionTarget("margin")}>
                Adjust margin
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setActionTarget("unpublish")}>
                Unpublish
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content library attachments */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-border bg-surface px-5 py-4 text-xs text-muted">
        <span>
          <span className="font-bold text-foreground">{course.contentCounts.quizzes}</span> attached quizzes
        </span>
        <span>
          <span className="font-bold text-foreground">{course.contentCounts.assignments}</span> assignments
        </span>
        <span>
          <span className="font-bold text-foreground">{course.contentCounts.activities}</span> activities
        </span>
        <span>
          <span className="font-bold text-foreground">{course.contentCounts.libraryEbooks}</span> library ebooks
        </span>
        <span>
          <span className="font-bold text-foreground">{course.contentCounts.liveClasses}</span> live classes
        </span>
      </div>

      {/* Assignments */}
      {course.assignments.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-sans text-lg font-bold">Assignments</h2>
          <div className="mt-4 space-y-3">
            {course.assignments.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-background-soft/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">{a.title}</p>
                  <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                    Due in {a.dueInDays} {a.dueInDays === 1 ? "day" : "days"}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted">{a.description}</p>
                {a.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {a.tags.map((t) => (
                      <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      {course.activities.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-sans text-lg font-bold">Activities</h2>
          <div className="mt-4 space-y-3">
            {course.activities.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-background-soft/50 p-4">
                <p className="text-sm font-bold">{a.title}</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted">{a.description}</p>
                {a.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {a.tags.map((t) => (
                      <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quizzes */}
      {course.quizzes.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-sans text-lg font-bold">Quizzes</h2>
          <div className="mt-4 space-y-5">
            {course.quizzes.map((q) => (
              <div key={q.id} className="rounded-xl border border-border bg-background-soft/50 p-4">
                <p className="text-sm font-bold">{q.title}</p>
                <p className="mt-1.5 text-sm text-muted">{q.description}</p>
                <div className="mt-3 space-y-2.5">
                  {q.questions.map((question, qi) => (
                    <div key={question.id} className="rounded-lg border border-border bg-surface p-3">
                      <p className="text-xs font-semibold">
                        {qi + 1}. {question.prompt}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {question.options.map((option, oi) => (
                          <li
                            key={oi}
                            className={`flex items-center gap-1.5 text-xs ${
                              oi === question.correctOptionIndex ? "font-semibold text-accent" : "text-muted"
                            }`}
                          >
                            {oi === question.correctOptionIndex ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            ) : (
                              <span className="h-3 w-3 shrink-0" />
                            )}
                            {option}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-sans text-lg font-bold">About this course</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{course.description}</p>
      </div>

      {/* Curriculum */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-sans text-lg font-bold">Curriculum</h2>

        {course.modules.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No modules yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {course.modules.map((courseModule, index) => (
              <div key={courseModule.id} className="rounded-xl border border-border bg-background-soft/50 p-4">
                <p className="text-sm font-bold">
                  Module {index + 1} · {courseModule.title}
                </p>
                <div className="mt-2.5 space-y-1.5">
                  {courseModule.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${LESSON_TYPE_CLASSES[lesson.type]}`}
                        >
                          {LESSON_TYPE_LABEL[lesson.type]}
                        </span>
                        <span className="truncate">{lesson.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {lesson.type === "quiz"
                          ? `${lesson.quizQuestionCount ?? 0} question${lesson.quizQuestionCount === 1 ? "" : "s"}`
                          : lesson.durationMin != null
                            ? `${lesson.durationMin} min`
                            : ""}
                      </span>
                    </div>
                  ))}
                  {courseModule.lessons.length === 0 && (
                    <p className="px-3 py-1.5 text-xs text-muted">No lessons in this module yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {actionTarget && course && (
        <ActionModal
          target={{
            item: {
              id: course.id,
              contentType: "courses",
              title: course.title,
              price: course.price,
              marginPercent: course.marginPercent,
              finalPrice: course.finalPrice,
              status: course.status,
              rejectionReason: course.rejectionReason,
              coverTheme: course.coverTheme,
              coverImagePath: course.coverImagePath,
              instructor: course.instructor,
            },
            action: actionTarget,
          }}
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
