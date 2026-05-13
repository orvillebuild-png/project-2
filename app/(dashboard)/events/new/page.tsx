import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createEvent } from "@/lib/events";

const errorMessages: Record<string, string> = {
  missing_title: "Event title is required.",
  invalid_time: "End time must be after start time."
};

export default async function NewEventPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <PageHeader description="Create a single event with venue, timing, capacity, and RSVP-ready status." eyebrow="Events" title="New event" />
      <Card className="max-w-3xl p-5">
        {error ? (
          <p className="mb-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
            {errorMessages[error] ?? decodeURIComponent(error)}
          </p>
        ) : null}
        <form action={createEvent} className="grid gap-4">
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Title</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="title" required placeholder="Fundraising gala" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Description</span>
            <textarea className="min-h-28 w-full rounded-md border border-line bg-field px-3 py-3 outline-none focus:border-moss" name="description" placeholder="Private notes or public event summary" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Starts at</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="starts_at" type="datetime-local" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Ends at</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="ends_at" type="datetime-local" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Venue name</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="location_name" placeholder="Main hall" />
            </label>
            <label className="space-y-2 text-sm font-medium text-ink">
              <span>Capacity</span>
              <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" min="0" name="capacity" type="number" />
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Venue address</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="location_address" placeholder="Street, city, country" />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Status</span>
            <select className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="submit">Save event</Button>
            <Button href="/events" variant="secondary">Cancel</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
