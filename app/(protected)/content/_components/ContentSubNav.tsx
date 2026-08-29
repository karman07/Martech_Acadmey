"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ContentTypeIcon from "@/components/ContentTypeIcon";
import type { ContentType } from "./ContentTypeList";

const SEGMENTS: { type: ContentType; label: string; href: string }[] = [
  { type: "courses", label: "Courses", href: "/content/courses" },
  { type: "ebooks", label: "Ebooks", href: "/content/ebooks" },
  { type: "bootcamps", label: "Bootcamps", href: "/content/bootcamps" },
  { type: "bundles", label: "Bundles", href: "/content/bundles" },
];

export default function ContentSubNav() {
  const pathname = usePathname();

  return (
    <div className="mt-6 flex flex-wrap gap-2 border-b border-border pb-4">
      {SEGMENTS.map((segment) => {
        const isActive = pathname.startsWith(segment.href);
        return (
          <Link
            key={segment.type}
            href={segment.href}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
              isActive ? "bg-accent text-on-accent" : "border border-border text-muted hover:text-foreground"
            }`}
          >
            <span
              className={`halftone-on-accent flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                isActive ? "bg-white/15" : "bg-accent"
              }`}
            >
              <span className="[&_svg]:h-4 [&_svg]:w-4">
                <ContentTypeIcon type={segment.type} />
              </span>
            </span>
            {segment.label}
          </Link>
        );
      })}
    </div>
  );
}
