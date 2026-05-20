import { EmailTemplateControls } from "@/components/campaigns/EmailTemplateControls";
import { EmailBuilderJsEditor } from "@/components/campaigns/EmailBuilderJsEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { getCurrentOrg } from "@/lib/auth";
import { newCampaignDesignDefaults } from "@/lib/campaigns";
import { createLibraryTemplate } from "@/lib/templates";

export default async function NewTemplatePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, membership] = await Promise.all([searchParams, getCurrentOrg()]);
  const designDefaults = newCampaignDesignDefaults();

  return (
    <>
      <PageHeader
        action={<Button href="/templates" variant="secondary">Back to templates</Button>}
        description="Create a reusable email layout that future campaigns can start from."
        eyebrow="Email"
        title="New template"
      />

      <Card className="max-w-5xl overflow-hidden">
        <div className="border-b border-line/80 bg-night px-5 py-5 text-white">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-amber">Template studio</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">Build once, reuse later.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
            Templates keep recurring invitation and update formats consistent without locking a campaign into a shared draft.
          </p>
        </div>
        <CardHeader
          description="Campaigns created from this template receive their own editable copy."
          title="Reusable email template"
        />
        <form action={createLibraryTemplate} className="grid gap-5 p-5">
          {error ? (
            <p className="rounded-xl border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
              {error === "missing_fields" ? "Template name, subject, and body are required." : decodeURIComponent(error)}
            </p>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-line bg-field/70 p-4 md:grid-cols-2">
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
              Template name
              <input
                className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                name="name"
                placeholder="Annual donor invitation"
                required
              />
            </label>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
              Subject
              <input
                className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue="You're invited to {{event_title}}"
                name="subject"
                required
              />
            </label>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink md:col-span-2">
              Description
              <textarea
                className="min-h-20 rounded-xl border border-line bg-white/88 px-3 py-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                name="description"
                placeholder="Use for donor events, volunteer drives, or general invitation campaigns."
              />
            </label>
          </section>

          <EmailBuilderJsEditor
            defaultValue={"Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nPlease RSVP here: {{rsvp_link}}\n\nThank you."}
            design={designDefaults}
            orgId={membership?.orgs?.id ?? ""}
          />
          <EmailTemplateControls design={designDefaults} />

          <div className="flex justify-end">
            <Button type="submit">Save template</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
