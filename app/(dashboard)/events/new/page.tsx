import { PageHeader } from "@/components/layout/PageHeader";
import { EventForm } from "@/components/events/EventForm";
import { Card } from "@/components/ui/Card";
import { createEvent, listLocations } from "@/lib/events";

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
  const locations = await listLocations();

  return (
    <>
      <PageHeader description="Create a parent event, then add invitees, sessions, and campaigns when the setup is ready." eyebrow="Events" title="New event" />
      <Card className="max-w-4xl p-4 sm:p-5">
        {error ? (
          <p className="mb-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
            {errorMessages[error] ?? decodeURIComponent(error)}
          </p>
        ) : null}
        <EventForm action={createEvent} locations={locations} />
      </Card>
    </>
  );
}
