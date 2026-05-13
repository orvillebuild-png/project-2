"use client";

import { useMemo, useState } from "react";
import { EventDateTimeFields } from "@/components/events/EventDateTimeFields";
import { Button } from "@/components/ui/Button";
import type { LocationOption } from "@/lib/events";

export function EventSessionForm({
  action,
  locations
}: {
  action: (formData: FormData) => void | Promise<void>;
  locations: LocationOption[];
}) {
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const locationLookup = useMemo(() => new Map(locations.map((location) => [location.name, location])), [locations]);

  function updateVenue(name: string) {
    setVenueName(name);
    const location = locationLookup.get(name);

    if (location) {
      setVenueAddress(location.address ?? "");
    }
  }

  return (
    <form action={action} className="mt-4 grid gap-4 rounded-lg border border-line bg-field p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Session name</span>
          <input className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none focus:border-moss" name="title" required placeholder="Morning session" />
        </label>
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Capacity</span>
          <input className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none focus:border-moss" min="0" name="capacity" type="number" />
        </label>
      </div>
      <EventDateTimeFields />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Venue name</span>
          <input
            className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none focus:border-moss"
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
            className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none focus:border-moss"
            name="location_address"
            onChange={(event) => setVenueAddress(event.target.value)}
            value={venueAddress}
          />
        </label>
      </div>
      <div>
        <Button type="submit">Add venue session</Button>
      </div>
    </form>
  );
}
