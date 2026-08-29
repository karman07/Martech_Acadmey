import Link from "next/link";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "manga-border bg-accent text-on-accent hover:bg-accent-hover",
  secondary:
    "border border-border bg-surface text-foreground hover:border-accent hover:text-accent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-7 py-3.5 text-sm",
};

export function buttonClassNames({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `inline-flex items-center justify-center gap-1.5 rounded-full text-center font-semibold transition-all active:scale-95 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

export default function Button({
  href,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  loading = false,
  children,
}: {
  href?: string;
  type?: "button" | "submit";
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  const classes = buttonClassNames({ variant, size, className });

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${classes} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
