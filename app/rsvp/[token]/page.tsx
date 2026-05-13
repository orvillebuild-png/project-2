import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getRSVPDetails, submitRSVP } from "@/lib/rsvp";

function eventDate(value: string | null) {
  if (!value) {
    return "Date to be announced";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function responseLabel(response: string | null) {
  if (response === "yes") {
    return "You are attending";
  }
  if (response === "maybe") {
    return "You might attend";
  }
  if (response === "no") {
    return "You declined";
  }
  return null;
}

export default async function RSVPPage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  const { token } = await params;
  const { error, submitted } = await searchParams;
  const details = await getRSVPDetails(token);

  if (!details) {
    notFound();
  }

  const action = submitRSVP.bind(null, token);
  const visibleResponse = submitted ?? details.response;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12">
      <section className="w-full rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">RSVP</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">{details.event_title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {details.contact_name || details.contact_email}, please let us know if you can attend.
            </p>
          </div>
          {visibleResponse ? <Badge tone={visibleResponse === "no" ? "coral" : visibleResponse === "maybe" ? "amber" : "green"}>{responseLabel(visibleResponse)}</Badge> : null}
        </div>

        {error ? (
          <p className="mt-5 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
            {error === "invalid_response" ? "Choose Yes, Maybe, or No." : decodeURIComponent(error)}
          </p>
        ) : null}
        {submitted ? (
          <p className="mt-5 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
            RSVP saved.
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-field p-4">
            <CalendarDays className="h-5 w-5 text-moss" />
            <h2 className="mt-3 text-sm font-semibold text-ink">Schedule</h2>
            <p className="mt-2 text-sm text-muted">{eventDate(details.starts_at)}</p>
          </div>
          <div className="rounded-lg border border-line bg-field p-4">
            <MapPin className="h-5 w-5 text-moss" />
            <h2 className="mt-3 text-sm font-semibold text-ink">Venue</h2>
            <p className="mt-2 text-sm text-muted">{details.venue_name ?? "Venue to be announced"}</p>
            {details.venue_address ? <p className="mt-1 text-sm text-muted">{details.venue_address}</p> : null}
          </div>
        </div>

        <form action={action} className="mt-6 grid gap-3 sm:grid-cols-3">
          <button className="inline-flex h-10 items-center justify-center rounded-md bg-moss px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#315f51]" name="answer" type="submit" value="yes">
            Yes
          </button>
          <button className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:bg-field" name="answer" type="submit" value="maybe">
            Maybe
          </button>
          <button className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:bg-field" name="answer" type="submit" value="no">
            No
          </button>
        </form>
      </section>
    </main>
  );
}
