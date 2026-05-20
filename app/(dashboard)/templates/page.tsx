import { FileText, Plus } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { deleteLibraryTemplate, listLibraryTemplates } from "@/lib/templates";

export default async function TemplatesPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; deleted?: string; error?: string }>;
}) {
  const [{ created, deleted, error }, templates] = await Promise.all([
    searchParams,
    listLibraryTemplates()
  ]);

  return (
    <>
      <PageHeader
        action={
          <Button href="/templates/new">
            <Plus className="h-4 w-4" />
            New template
          </Button>
        }
        description="Reusable email layouts for invitations, updates, and RSVP campaigns."
        eyebrow="Email"
        title="Templates"
      />

      {error ? <Notice tone="error">{decodeURIComponent(error)}</Notice> : null}
      {created ? <Notice>Template created.</Notice> : null}
      {deleted ? <Notice>Template deleted.</Notice> : null}

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <Metric label="Reusable templates" value={templates.length} detail="Library items" />
        <Metric label="Merge fields" value={5} detail="Available tokens" />
        <Metric label="Editor" value={1} detail="Visual builder" />
      </section>

      <Card className="overflow-hidden">
        <CardHeader
          description="Start a campaign from a saved template, or keep refining reusable layouts here."
          title="Template library"
        />
        <div className="p-5">
          {templates.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => {
                const deleteAction = deleteLibraryTemplate.bind(null, template.id);

                return (
                  <article className="rounded-2xl border border-line bg-field/70 p-4" key={template.id}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-night text-amber">
                        <FileText className="h-4 w-4" />
                      </span>
                      <Badge tone="green">Reusable</Badge>
                    </div>
                    <h2 className="mt-4 text-base font-semibold text-ink">{template.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                      {template.description || template.subject}
                    </p>
                    <div className="mt-4 rounded-xl border border-line bg-white/70 px-3 py-3">
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted">Subject</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink">{template.subject}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button className="h-9 px-3" href={`/campaigns/new?template=${template.id}`}>
                        Use template
                      </Button>
                      <Button className="h-9 px-3" href={`/templates/${template.id}/edit`} variant="secondary">
                        Edit
                      </Button>
                      <form action={deleteAction}>
                        <Button className="h-9 px-3 text-coral" type="submit" variant="ghost">Delete</Button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              actionLabel="Create template"
              description="Save your first reusable campaign layout, then start future campaigns from it."
              href="/templates/new"
              title="No reusable templates yet"
            />
          )}
        </div>
      </Card>
    </>
  );
}

function Metric({ detail, label, value }: { detail: string; label: string; value: number }) {
  return (
    <div className="surface-in rounded-[1.4rem] border border-white/70 bg-white/74 p-4 shadow-soft ring-1 ring-ink/5">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-moss">{label}</p>
      <p className="mt-3 text-3xl font-semibold leading-none text-ink">{value}</p>
      <p className="mt-2 text-[0.78rem] text-muted">{detail}</p>
    </div>
  );
}

function Notice({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <p className={`mb-4 rounded-xl border px-3 py-2 text-sm ${tone === "error" ? "border-[#f3c2b8] bg-[#fff0ed] text-coral" : "border-[#d7e9d9] bg-[#edf7f0] text-moss"}`}>
      {children}
    </p>
  );
}
