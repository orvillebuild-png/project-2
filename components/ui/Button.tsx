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
  primary: "bg-moss text-white shadow-sm hover:bg-[#315f51]",
  secondary: "border border-line bg-white text-ink hover:bg-field",
  ghost: "text-muted hover:bg-field hover:text-ink"
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
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition",
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
