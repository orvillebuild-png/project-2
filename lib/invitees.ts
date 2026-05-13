import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ContactFilters, ContactListItem } from "@/lib/contacts";
import { listContacts } from "@/lib/contacts";
import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

export type EventInvitee = {
  contact_id: string;
  status: "invited" | "waitlisted" | "confirmed" | "attended" | "no_show";
  contacts: ContactListItem;
};

async function requireEvent(eventId: string) {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  const { data: event, error } = await supabase
    .from("events")
    .select("id, title")
    .eq("org_id", org.id)
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!event) {
    redirect("/events");
  }

  return { event, org, supabase };
}

export async function listEventInvitees(eventId: string) {
  const { supabase } = await requireEvent(eventId);
  const { data, error } = await supabase
    .from("attendance")
    .select("contact_id, status, contacts(id, salutation, first_name, last_name, email, phone, sex, age, source, organization_name, contact_type_id, email_status, created_at)")
    .eq("event_id", eventId)
    .order("status", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    contact_id: row.contact_id as string,
    status: row.status as EventInvitee["status"],
    contacts: Array.isArray(row.contacts) ? row.contacts[0] : row.contacts
  })).filter((row) => row.contacts) as EventInvitee[];
}

export async function listEventInviteeCount(eventId: string) {
  const { supabase } = await requireEvent(eventId);
  const { count, error } = await supabase
    .from("attendance")
    .select("contact_id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function listInviteeCandidates(filters: ContactFilters) {
  return listContacts({
    ...filters,
    limit: filters.limit ?? "20"
  });
}

export async function addEventInvitees(eventId: string, formData: FormData) {
  "use server";

  const { org, supabase } = await requireEvent(eventId);
  const contactIds = formData.getAll("contact_ids").map((value) => String(value)).filter(Boolean);

  if (contactIds.length === 0) {
    redirect(`/events/${eventId}/invitees?error=missing_selection`);
  }

  const { data: ownedContacts, error: contactError } = await supabase
    .from("contacts")
    .select("id")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .in("id", contactIds);

  if (contactError) {
    redirect(`/events/${eventId}/invitees?error=${encodeURIComponent(contactError.message)}`);
  }

  const ownedContactIds = (ownedContacts ?? []).map((contact) => contact.id as string);

  if (ownedContactIds.length === 0) {
    redirect(`/events/${eventId}/invitees?error=missing_selection`);
  }

  const { error } = await supabase
    .from("attendance")
    .upsert(
      ownedContactIds.map((contactId) => ({
        event_id: eventId,
        contact_id: contactId,
        status: "invited"
      })),
      { onConflict: "event_id,contact_id" }
    );

  if (error) {
    redirect(`/events/${eventId}/invitees?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/invitees`);
  redirect(`/events/${eventId}/invitees?added=${ownedContactIds.length}`);
}

export async function removeEventInvitees(eventId: string, formData: FormData) {
  "use server";

  const { supabase } = await requireEvent(eventId);
  const contactIds = formData.getAll("invitee_contact_ids").map((value) => String(value)).filter(Boolean);

  if (contactIds.length === 0) {
    redirect(`/events/${eventId}/invitees?error=missing_selection`);
  }

  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("event_id", eventId)
    .in("contact_id", contactIds);

  if (error) {
    redirect(`/events/${eventId}/invitees?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/invitees`);
  redirect(`/events/${eventId}/invitees?removed=${contactIds.length}`);
}
