"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/80 transition-colors hover:border-accent hover:text-accent cursor-pointer"
    >
      <svg
        className={`absolute h-4.5 w-4.5 transition-all duration-300 ${isDark ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg
        className={`absolute h-4.5 w-4.5 transition-all duration-300 ${isDark ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90"}`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
      </svg>
    </button>
  );
}
