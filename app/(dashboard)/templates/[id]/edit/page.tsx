import { Clock3, RotateCcw } from "lucide-react";
import { EmailBuilderJsEditor } from "@/components/campaigns/EmailBuilderJsEditor";
import { EmailTemplateControls } from "@/components/campaigns/EmailTemplateControls";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { getCurrentOrg } from "@/lib/auth";
import {
  getLibraryTemplate,
  listTemplateVersions,
  restoreTemplateVersion,
  updateLibraryTemplate
} from "@/lib/templates";

export default async function EditTemplatePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; restored?: string; saved?: string }>;
}) {
  const [{ id }, query, membership] = await Promise.all([params, searchParams, getCurrentOrg()]);
  const [template, versions] = await Promise.all([
    getLibraryTemplate(id),
    listTemplateVersions(id)
  ]);

  if (!template) {
    return (
      <>
        <PageHeader
          action={<Button href="/templates" variant="secondary">Back to templates</Button>}
          description="This reusable template could not be found in the current workspace."
          eyebrow="Email"
          title="Template not found"
        />
        <Card className="p-5">
          <p className="text-sm leading-6 text-muted">Choose another template from the library.</p>
        </Card>
      </>
    );
  }

  const updateAction = updateLibraryTemplate.bind(null, template.id);

  return (
    <>
      <PageHeader
        action={<Button href="/templates" variant="secondary">Back to templates</Button>}
        description="Edit the reusable layout and restore prior versions when needed."
        eyebrow="Email"
        title={`Edit ${template.name}`}
      />

      {query.error ? <Notice tone="error">{query.error === "missing_fields" ? "Template name, subject, and body are required." : decodeURIComponent(query.error)}</Notice> : null}
      {query.saved ? <Notice>Template saved and previous version archived.</Notice> : null}
      {query.restored ? <Notice>Version restored. The replaced template was archived first.</Notice> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="overflow-hidden">
          <CardHeader
            description="Changes apply only to this reusable template. Existing campaigns keep their own copy."
            title="Template editor"
          />
          <form action={updateAction} className="grid gap-5 p-5">
            <section className="grid gap-4 rounded-2xl border border-line bg-field/70 p-4 md:grid-cols-2">
              <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
                Template name
                <input
                  className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                  defaultValue={template.name}
                  name="name"
                  required
                />
              </label>
              <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
                Subject
                <input
                  className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                  defaultValue={template.subject}
                  name="subject"
                  required
                />
              </label>
              <label className="grid gap-2 text-[0.78rem] font-semibold text-ink md:col-span-2">
                Description
                <textarea
                  className="min-h-20 rounded-xl border border-line bg-white/88 px-3 py-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                  defaultValue={template.description ?? ""}
                  name="description"
                />
              </label>
            </section>

            <EmailBuilderJsEditor
              defaultValue={template.design_data.email_builder_body || template.html_body}
              design={template.design_data}
              orgId={membership?.orgs?.id ?? ""}
            />
            <EmailTemplateControls design={template.design_data} />

            <div className="flex justify-end">
              <Button type="submit">Save template</Button>
            </div>
          </form>
        </Card>

        <Card className="h-fit overflow-hidden">
          <CardHeader
            description="Each save stores the previous template state before overwriting."
            title="Version history"
          />
          <div className="grid gap-3 p-4">
            {versions.length > 0 ? versions.map((version) => {
              const restoreAction = restoreTemplateVersion.bind(null, template.id, version.id);

              return (
                <article className="rounded-2xl border border-line bg-field/70 p-3" key={version.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">Version {version.version_number}</p>
                      <p className="mt-1 text-xs leading-5 text-muted">{formatDate(version.created_at)}</p>
                    </div>
                    <Badge tone="amber">Archived</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted">{version.subject}</p>
                  <form action={restoreAction} className="mt-3">
                    <Button className="h-9 w-full px-3" type="submit" variant="secondary">
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </Button>
                  </form>
                </article>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-line bg-field/70 p-4 text-sm leading-6 text-muted">
                <Clock3 className="mb-3 h-5 w-5 text-moss" />
                No archived versions yet. Save an edit to create the first rollback point.
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function Notice({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <p className={`mb-4 rounded-xl border px-3 py-2 text-sm ${tone === "error" ? "border-[#f3c2b8] bg-[#fff0ed] text-coral" : "border-[#d7e9d9] bg-[#edf7f0] text-moss"}`}>
      {children}
    </p>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
