import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { createCampaign, listCampaignEventOptions } from "@/lib/campaigns";

export default async function NewCampaignPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, events] = await Promise.all([searchParams, listCampaignEventOptions()]);
  const defaultEvent = events.find((event) => event.invitee_count > 0) ?? events[0];

  return (
    <>
      <PageHeader
        action={<Button href="/campaigns" variant="secondary">Back to campaigns</Button>}
        description="Create an invitation draft from an event’s selected invitees. Nothing is sent from this screen."
        eyebrow="Campaigns"
        title="New campaign"
      />
      <Card className="max-w-5xl">
        <CardHeader
          description="Use merge fields: {{first_name}}, {{event_title}}, {{event_date}}, {{venue}}, {{rsvp_link}}."
          title="Draft invitation"
        />
        <form action={createCampaign} className="grid gap-5 p-5">
          {error ? (
            <p className="rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
              {error === "missing_fields" ? "Choose an event, campaign name, subject, and message." : decodeURIComponent(error)}
            </p>
          ) : null}
          <label className="grid gap-2 text-sm font-medium text-ink">
            Event
            <select
              className="h-11 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
              defaultValue={defaultEvent?.id ?? ""}
              name="event_id"
              required
            >
              <option value="">Choose event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} · {event.invitee_count} invitee{event.invitee_count === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Campaign name
            <input
              className="h-11 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
              defaultValue={defaultEvent ? `${defaultEvent.title} invitation campaign` : ""}
              name="name"
              placeholder="May donor dinner invite"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Subject
            <input
              className="h-11 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
              defaultValue="You're invited to {{event_title}}"
              name="subject"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-ink">
            Message
            <textarea
              className="min-h-72 rounded-md border border-line bg-field px-3 py-3 text-sm leading-6 outline-none focus:border-moss"
              defaultValue={"Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nPlease RSVP here: {{rsvp_link}}\n\nThank you."}
              name="body"
              required
            />
          </label>
          <div className="flex justify-end">
            <Button type="submit">Save draft</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
