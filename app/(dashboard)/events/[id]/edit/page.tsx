import { notFound } from "next/navigation";
import { EventForm } from "@/components/events/EventForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { getEvent, listLocations, updateEvent } from "@/lib/events";

const errorMessages: Record<string, string> = {
  missing_title: "Event title is required.",
  invalid_time: "End time must be after start time."
};

export default async function EditEventPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const [event, locations] = await Promise.all([getEvent(id), listLocations()]);

  if (!event) {
    notFound();
  }

  const action = updateEvent.bind(null, event.id);

  return (
    <>
      <PageHeader description="Update event details, schedule, venue, recurrence, and publication status." eyebrow="Events" title={`Edit ${event.title}`} />
      <Card className="max-w-3xl p-5">
        {error ? (
          <p className="mb-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
            {errorMessages[error] ?? decodeURIComponent(error)}
          </p>
        ) : null}
        <EventForm action={action} cancelHref={`/events/${event.id}`} event={event} locations={locations} />
      </Card>
    </>
  );
}
