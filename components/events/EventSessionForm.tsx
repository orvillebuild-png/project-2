"use client";

import { useMemo, useState } from "react";
import { EventDateTimeFields } from "@/components/events/EventDateTimeFields";
import { Button } from "@/components/ui/Button";
import type { LocationOption } from "@/lib/events";

export function EventSessionForm({
  action,
  cancelHref,
  collapsed = false,
  session,
  locations
}: {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  collapsed?: boolean;
  session?: {
    title: string;
    starts_at: string | null;
    ends_at: string | null;
    capacity: number | null;
    locations?: {
      name: string;
      address: string | null;
    } | null;
  };
  locations: LocationOption[];
}) {
  const [venueName, setVenueName] = useState(session?.locations?.name ?? "");
  const [venueAddress, setVenueAddress] = useState(session?.locations?.address ?? "");
  const [isOpen, setIsOpen] = useState(!collapsed);
  const locationLookup = useMemo(() => new Map(locations.map((location) => [location.name, location])), [locations]);

  function updateVenue(name: string) {
    setVenueName(name);
    const location = locationLookup.get(name);

    if (location) {
      setVenueAddress(location.address ?? "");
    }
  }

  if (!isOpen) {
    return (
      <div className="mt-4">
        <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>Add session</Button>
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 grid gap-4 rounded-2xl border border-line/90 bg-[#fff8dc]/60 p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Session name</span>
          <input className="h-11 w-full rounded-xl border border-line bg-white px-3 outline-none focus:border-moss focus:ring-2 focus:ring-moss/10" defaultValue={session?.title ?? ""} name="title" required placeholder="Morning session" />
        </label>
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Capacity</span>
          <input className="h-11 w-full rounded-xl border border-line bg-white px-3 outline-none focus:border-moss focus:ring-2 focus:ring-moss/10" defaultValue={session?.capacity ?? ""} min="0" name="capacity" type="number" />
        </label>
      </div>
      <EventDateTimeFields defaultEndsAt={session?.ends_at} defaultStartsAt={session?.starts_at} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Venue name</span>
          <input
            className="h-11 w-full rounded-xl border border-line bg-white px-3 outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
            list="event-session-location-options"
            name="location_name"
            onChange={(event) => updateVenue(event.target.value)}
            required
            value={venueName}
          />
          <datalist id="event-session-location-options">
            {locations.map((location) => (
              <option key={location.id} value={location.name} />
            ))}
          </datalist>
        </label>
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Venue address</span>
          <input
            className="h-11 w-full rounded-xl border border-line bg-white px-3 outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
            name="location_address"
            onChange={(event) => setVenueAddress(event.target.value)}
            value={venueAddress}
          />
        </label>
      </div>
      <div>
        <Button type="submit">{session ? "Save session" : "Confirm session"}</Button>
        {session && cancelHref ? (
          <Button className="ml-2" href={cancelHref} variant="secondary">Cancel</Button>
        ) : null}
        {!session ? (
          <Button className="ml-2" type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
        ) : null}
      </div>
    </form>
  );
}
