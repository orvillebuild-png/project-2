import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

export type EventListItem = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "cancelled";
  type: "single" | "recurring" | "multi_location";
  starts_at: string | null;
  ends_at: string | null;
  capacity: number | null;
  created_at: string;
  locations?: {
    id: string;
    name: string;
    address: string | null;
  } | null;
};

export type LocationOption = {
  id: string;
  name: string;
  address: string | null;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);
  return value || null;
}

function dateTimeValue(formData: FormData, key: string) {
  const value = nullableFormValue(formData, key);
  return value ? new Date(value).toISOString() : null;
}

function eventTypeValue(value: string) {
  return ["single", "recurring", "multi_location"].includes(value)
    ? value
    : "single";
}

export async function listEvents() {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return [];
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, status, type, starts_at, ends_at, capacity, created_at, locations(id, name, address)")
    .eq("org_id", org.id)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((event) => ({
    ...event,
    locations: Array.isArray(event.locations)
      ? event.locations[0] ?? null
      : event.locations ?? null
  })) as EventListItem[];
}

export async function getEvent(eventId: string) {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, status, type, starts_at, ends_at, capacity, created_at, locations(id, name, address)")
    .eq("org_id", org.id)
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    locations: Array.isArray(data.locations)
      ? data.locations[0] ?? null
      : data.locations ?? null
  } as EventListItem;
}

export async function listLocations() {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return [];
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("locations")
    .select("id, name, address")
    .eq("org_id", org.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as LocationOption[];
}

export async function createEvent(formData: FormData) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const title = formValue(formData, "title");
  const description = nullableFormValue(formData, "description");
  const locationName = nullableFormValue(formData, "location_name");
  const locationAddress = nullableFormValue(formData, "location_address");
  const startsAt = dateTimeValue(formData, "starts_at");
  const endsAt = dateTimeValue(formData, "ends_at");
  const capacityValue = nullableFormValue(formData, "capacity");
  const capacity = capacityValue ? Number(capacityValue) : null;
  const status = formValue(formData, "status") || "draft";
  const type = eventTypeValue(formValue(formData, "type"));
  const recurrenceRule = type === "recurring" ? nullableFormValue(formData, "recurrence_rule") : null;

  if (!title) {
    redirect("/events/new?error=missing_title");
  }

  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    redirect("/events/new?error=invalid_time");
  }

  const supabase = await createClientForServer();
  let locationId: string | null = null;

  if (locationName) {
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .insert({
        org_id: org.id,
        name: locationName,
        address: locationAddress
      })
      .select("id")
      .single();

    if (locationError) {
      redirect(`/events/new?error=${encodeURIComponent(locationError.message)}`);
    }

    locationId = location.id as string;
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      org_id: org.id,
      location_id: locationId,
      title,
      description,
      type,
      status: status === "published" ? "published" : "draft",
      starts_at: startsAt,
      ends_at: endsAt,
      recurrence_rule: recurrenceRule,
      capacity: Number.isFinite(capacity) ? capacity : null
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/events/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  redirect(`/events?created=${event.id}`);
}

export async function publishEvent(eventId: string) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase
    .from("events")
    .update({ status: "published" })
    .eq("org_id", org.id)
    .eq("id", eventId);

  if (error) {
    redirect(`/events/${eventId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}?published=1`);
}
