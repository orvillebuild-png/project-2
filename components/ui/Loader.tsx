import { cn } from "@/lib/utils";

export function BouncingDots({ className = "", label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span aria-label={label} className={cn("loader-dots", className)} role="status">
      <span />
      <span />
      <span />
    </span>
  );
}

export function PulseBlob({ className = "", label = "Loading" }: { className?: string; label?: string }) {
  return <span aria-label={label} className={cn("loader-blob inline-block", className)} role="status" />;
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={cn("skeleton-shimmer block rounded-full", className)} />;
}

export function LoadingCard({ title = "Loading workspace" }: { title?: string }) {
  return (
    <div className="surface-in rounded-[1.5rem] border border-white/70 bg-white/78 p-5 shadow-soft ring-1 ring-ink/5">
      <div className="flex items-center gap-4">
        <PulseBlob />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <div className="mt-2">
            <BouncingDots label={title} />
          </div>
        </div>
      </div>
    </div>
  );
}
