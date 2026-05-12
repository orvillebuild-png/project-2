export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-semibold text-ink">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
