"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth, avatarUrl } from "@/lib/auth/AuthProvider";
import { signOutUser } from "@/lib/firebase/auth";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M4 20V10M12 20V4M20 20v-6" />
      </svg>
    ),
  },
  {
    label: "Content Review",
    href: "/content",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    children: [
      { label: "Courses", href: "/content/courses" },
      { label: "Ebooks", href: "/content/ebooks" },
      { label: "Bootcamps", href: "/content/bootcamps" },
      { label: "Bundles", href: "/content/bundles" },
    ],
  },
  {
    label: "KYC Review",
    href: "/kyc",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="M15 9h3M15 13h3M6 17h12" />
      </svg>
    ),
  },
  {
    label: "Users",
    href: "/users",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
        <path d="M16 8.5a3.5 3.5 0 1 1 3.5 3.5" />
        <path d="M21.5 19a5.5 5.5 0 0 0-4-5.3" />
      </svg>
    ),
  },
  {
    label: "Payouts",
    href: "/payouts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <path d="M16 15h.01" />
      </svg>
    ),
  },
  {
    label: "Sales Team",
    href: "/sales-team",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </svg>
    ),
    children: [
      { label: "Sales reps", href: "/sales-team" },
      { label: "Enquiries", href: "/sales-team/enquiries" },
      { label: "Payouts", href: "/sales-team/payouts" },
    ],
  },
  {
    label: "Categories",
    href: "/categories",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/messages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M4 5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 3V6a1 1 0 0 1 1-1Z" />
      </svg>
    ),
  },
  {
    label: "Templates",
    href: "/templates",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M4 4h16v4H4z" />
        <path d="M4 12h7v8H4z" />
        <path d="M13 12h7v8h-7z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
];

/** Replaces the browser's default blue focus outline with one that matches the app's own accent color. */
const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background dark:focus-visible:ring-offset-surface";

/** Segment-safe match: `/sales-team` must not match `/sales-team-x`, only itself or a real sub-path. */
function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Among a group's children, several hrefs can legitimately match the same pathname at once — e.g. both
 * "Sales reps" (`/sales-team`) and "Payouts" (`/sales-team/payouts`) match `/sales-team/payouts`, since
 * the former is also the group's own index route. Only the most specific (longest) match should be
 * highlighted, otherwise two rows appear "active" simultaneously.
 */
function mostSpecificActiveHref(children: { href: string }[], pathname: string): string | null {
  const matches = children.filter((c) => matchesPath(pathname, c.href));
  if (matches.length === 0) return null;
  return matches.reduce((best, c) => (c.href.length > best.href.length ? c : best)).href;
}

function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem & { children: { label: string; href: string }[] };
  pathname: string;
  onNavigate?: () => void;
}) {
  const activeChildHref = mostSpecificActiveHref(item.children, pathname);
  const childActive = activeChildHref !== null;
  // Opened by default — collapsing is a manual per-session choice, never the starting state.
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-xl py-2 pl-2 pr-3 text-sm font-semibold ring-1 ring-inset transition-colors ${FOCUS_RING} ${
          childActive
            ? "bg-accent-soft text-accent ring-accent/15"
            : "text-foreground/70 ring-transparent hover:bg-background-soft hover:text-foreground"
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            childActive ? "bg-accent text-on-accent" : "bg-background-soft text-muted"
          }`}
        >
          {item.icon}
        </span>
        <span className="flex-1 text-left">{item.label}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="ml-[1.15rem] mt-1 flex flex-col gap-0.5 border-l border-border pl-[1.15rem]">
            {item.children.map((child) => {
              const isActive = child.href === activeChildHref;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${FOCUS_RING} ${
                    isActive ? "bg-accent-soft text-accent" : "text-foreground/60 hover:bg-background-soft hover:text-foreground"
                  }`}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-1">
      {navItems.map((item) => {
        if (item.children) {
          return (
            <NavGroup
              key={item.href}
              item={item as NavItem & { children: { label: string; href: string }[] }}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          );
        }

        const isActive = item.href === "/" ? pathname === "/" : matchesPath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-xl py-2 pl-2 pr-3 text-sm font-semibold ring-1 ring-inset transition-colors ${FOCUS_RING} ${
              isActive
                ? "bg-accent-soft text-accent ring-accent/15"
                : "text-foreground/70 ring-transparent hover:bg-background-soft hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                isActive ? "bg-accent text-on-accent" : "bg-background-soft text-muted"
              }`}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const name = profile?.name || "Admin";
  const initial = name.charAt(0).toUpperCase();
  const photo = avatarUrl(profile);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background lg:flex dark:bg-surface">
        <div className="halftone flex items-center justify-between gap-2.5 border-b border-border px-6 py-6">
          <Link href="/" className="flex items-center gap-2.5 font-sans text-xl font-bold">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-base text-on-accent">
              M
            </span>
            <span>
              Admin
              <span className="block text-xs font-medium text-muted">Dashboard</span>
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3.5 py-5">
          <NavLinks pathname={pathname} />
        </nav>
      </aside>

      {/* Mobile drawer — always mounted so the slide/fade can transition both ways */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`fixed inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`fixed inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-background shadow-2xl transition-transform duration-300 ease-out dark:bg-surface ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="halftone flex items-center justify-between border-b border-border px-6 py-6">
            <Link href="/" className="flex items-center gap-2.5 font-sans text-xl font-bold" onClick={() => setMobileOpen(false)}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-base text-on-accent">
                M
              </span>
              <span>
                Admin
                <span className="block text-xs font-medium text-muted">Dashboard</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-background-soft hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col overflow-y-auto px-3.5 py-5">
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </nav>
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/80 hover:bg-background-soft lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <p className="hidden text-sm font-medium text-muted lg:block">Platform Admin</p>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-bold text-on-accent">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:block">{name}</span>
            </div>
            <button
              onClick={() => signOutUser()}
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background-soft hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
