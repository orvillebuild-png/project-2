import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

const variants = {
  primary: "bg-night text-white shadow-sm hover:bg-[#2a2925]",
  secondary: "border border-line bg-white/88 text-ink hover:border-ink/20 hover:bg-white",
  ghost: "text-muted hover:bg-white/70 hover:text-ink"
};

export function Button({
  children,
  disabled = false,
  href,
  variant = "primary",
  className,
  onClick,
  type = "button"
}: ButtonProps) {
  const classes = cn(
    "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-[0.82rem] font-semibold transition active:scale-[0.99]",
    variants[variant],
    disabled && "cursor-not-allowed opacity-55",
    className
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  );
}
