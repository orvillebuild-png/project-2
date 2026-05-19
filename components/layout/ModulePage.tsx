import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

export function ModulePage({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  rows
}: {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  rows: Array<{ label: string; status: string; tone?: "green" | "amber" | "coral" | "gray" }>;
}) {
  return (
    <>
      <PageHeader
        action={ctaLabel && ctaHref ? <Button href={ctaHref}>{ctaLabel}</Button> : undefined}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      <Card>
        <CardHeader description="Workspace controls and operational status." title={`${title} workspace`} />
        <div className="grid gap-3 p-5 md:grid-cols-2">
          {rows.map((row) => (
            <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-field p-4" key={row.label}>
              <span className="text-sm font-medium text-ink">{row.label}</span>
              <Badge tone={row.tone}>{row.status}</Badge>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <EmptyState
            description="No records match this workspace yet."
            title="Nothing to show"
          />
        </div>
      </Card>
    </>
  );
}
