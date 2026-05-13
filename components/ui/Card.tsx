import { cn } from "@/lib/utils";

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-in rounded-2xl border border-white/70 bg-white/82 shadow-soft ring-1 ring-ink/5 backdrop-blur", className)}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-[0.95rem] font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-[0.8rem] leading-5 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
