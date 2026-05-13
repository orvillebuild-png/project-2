import { notFound } from "next/navigation";
import { EventSessionForm } from "@/components/events/EventSessionForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { getEvent, getEventSession, listLocations, updateEventSession } from "@/lib/events";

const errorMessages: Record<string, string> = {
  invalid_time: "End time must be after start time.",
  session_missing_fields: "Session name and venue are required."
};

export default async function EditEventSessionPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string; sessionId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, sessionId } = await params;
  const { error } = await searchParams;
  const [parentEvent, session, locations] = await Promise.all([
    getEvent(id),
    getEventSession(id, sessionId),
    listLocations()
  ]);

  if (!parentEvent || !session) {
    notFound();
  }

  const action = updateEventSession.bind(null, parentEvent.id, session.id);

  return (
    <>
      <PageHeader
        description={`Update this session inside ${parentEvent.title}.`}
        eyebrow="Events"
        title={`Edit ${session.title}`}
      />
      <Card className="max-w-3xl p-5">
        {error ? (
          <p className="mb-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
            {errorMessages[error] ?? decodeURIComponent(error)}
          </p>
        ) : null}
        <EventSessionForm action={action} cancelHref={`/events/${parentEvent.id}`} locations={locations} session={session} />
      </Card>
    </>
  );
}
