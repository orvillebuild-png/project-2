import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  href
}: {
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white/70 px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {actionLabel && href ? (
        <Button className="mt-5" href={href}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
