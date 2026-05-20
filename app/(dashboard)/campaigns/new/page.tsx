import { EmailTemplateControls } from "@/components/campaigns/EmailTemplateControls";
import { EmailBuilderJsEditor } from "@/components/campaigns/EmailBuilderJsEditor";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { createCampaign, listCampaignEventOptions, newCampaignDesignDefaults } from "@/lib/campaigns";
import { getCurrentOrg } from "@/lib/auth";
import { getLibraryTemplate, listLibraryTemplates } from "@/lib/templates";

export default async function NewCampaignPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; template?: string }>;
}) {
  const params = await searchParams;
  const [{ error, template: templateId }, events, membership, templates] = await Promise.all([
    Promise.resolve(params),
    listCampaignEventOptions(),
    getCurrentOrg(),
    listLibraryTemplates()
  ]);
  const selectedTemplate = await getLibraryTemplate(templateId);
  const defaultEvent = events.find((event) => event.invitee_count > 0) ?? events[0];
  const designDefaults = selectedTemplate?.design_data ?? newCampaignDesignDefaults();
  const defaultBody = selectedTemplate?.html_body ?? "Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nPlease RSVP here: {{rsvp_link}}\n\nThank you.";

  return (
    <>
      <PageHeader
        action={<Button href="/campaigns" variant="secondary">Back to campaigns</Button>}
        description="Create an invitation draft from an event's selected invitees. Nothing is sent from this screen."
        eyebrow="Campaigns"
        title="New campaign"
      />
      <Card className="overflow-hidden">
        <div className="border-b border-line/80 bg-night px-5 py-5 text-white">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-amber">Campaign studio</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">Start with the audience and message.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
            Choose an event, name the campaign internally, then build the first invitation draft with merge fields ready.
          </p>
        </div>
        <CardHeader
          description="The draft stays editable after creation; sending is handled on the campaign detail screen."
          title="Draft invitation"
        />
        <form action={createCampaign} className="grid gap-5 p-5">
          {error ? (
            <p className="rounded-xl border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
              {error === "missing_fields" ? "Choose an event, campaign name, subject, and message." : decodeURIComponent(error)}
            </p>
          ) : null}
          <section className="grid gap-4 rounded-2xl border border-line bg-field/70 p-4 md:grid-cols-2">
            {templates.length > 0 ? (
              <label className="grid gap-2 text-[0.78rem] font-semibold text-ink md:col-span-2">
                Start from template
                <select
                  className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                  defaultValue={selectedTemplate?.id ?? ""}
                  name="template_picker"
                >
                  <option value="">Default invitation</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-normal text-muted">
                  To load a different template, use the Template Library Use template action.
                </span>
              </label>
            ) : null}
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink md:col-span-2">
              Event
              <select
                className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue={defaultEvent?.id ?? ""}
                name="event_id"
                required
              >
                <option value="">Choose event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {event.invitee_count} invitee{event.invitee_count === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
              Campaign name
              <input
                className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue={selectedTemplate?.name ? `${selectedTemplate.name} campaign` : defaultEvent ? `${defaultEvent.title} invitation campaign` : ""}
                name="name"
                placeholder="May donor dinner invite"
                required
              />
            </label>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
              Subject
              <input
                className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue={selectedTemplate?.subject ?? "You're invited to {{event_title}}"}
                name="subject"
                required
              />
            </label>
          </section>
          <EmailBuilderJsEditor
            defaultValue={defaultBody}
            design={designDefaults}
            orgId={membership?.orgs?.id ?? ""}
          />
          <EmailTemplateControls design={designDefaults} />
          <div className="flex justify-end">
            <Button type="submit">Save draft</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
