export default function ContentTypeIcon({ type }: { type: "courses" | "ebooks" | "bootcamps" | "bundles" }) {
  switch (type) {
    case "courses":
      return (
        <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6 opacity-90">
          <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
        </svg>
      );
    case "ebooks":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 opacity-90">
          <path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2Z" />
          <path d="M12 6.5v14" />
        </svg>
      );
    case "bootcamps":
      return (
        <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6 opacity-90">
          <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" />
        </svg>
      );
    case "bundles":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 opacity-90">
          <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
          <path d="M3 12l9 4.5 9-4.5" />
          <path d="M3 16.5 12 21l9-4.5" />
        </svg>
      );
  }
}
