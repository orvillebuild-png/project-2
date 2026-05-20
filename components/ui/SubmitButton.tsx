"use client";

import { useFormStatus } from "react-dom";
import { BouncingDots, PulseBlob } from "@/components/ui/Loader";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loadingLabel?: string;
  mode?: "auth" | "process";
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary: "bg-night text-white shadow-sm hover:bg-[#2a2925]",
  secondary: "border border-line bg-white/88 text-ink hover:border-ink/20 hover:bg-white",
  ghost: "text-muted hover:bg-white/70 hover:text-ink"
};

export function SubmitButton({
  children,
  className,
  disabled = false,
  loadingLabel = "Working",
  mode = "process",
  variant = "primary"
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-[0.82rem] font-semibold transition active:scale-[0.99]",
        variants[variant],
        (pending || disabled) && "cursor-not-allowed opacity-70",
        pending && "cursor-wait",
        className
      )}
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? (
        <>
          {mode === "auth" ? <BouncingDots className="[&>span]:bg-current" label={loadingLabel} /> : <PulseBlob label={loadingLabel} size="sm" />}
          <span>{loadingLabel}</span>
        </>
      ) : children}
    </button>
  );
}
