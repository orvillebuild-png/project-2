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
    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-moss">{eyebrow}</p> : null}
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-ink md:text-[1.7rem]">{title}</h1>
        {description ? <p className="mt-2 max-w-xl text-[0.86rem] leading-6 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
