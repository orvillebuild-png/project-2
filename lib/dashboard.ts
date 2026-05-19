import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

export type DashboardEvent = {
  id: string;
  title: string;
  starts_at: string | null;
  status: string;
  locations?: {
    name: string;
    address: string | null;
  } | null;
};

export type DashboardStats = {
  contacts: number;
  validEmails: number;
  upcomingEvents: number;
  campaigns: number;
  upcoming: DashboardEvent[];
};

type RawDashboardEvent = Omit<DashboardEvent, "locations"> & {
  locations?: DashboardEvent["locations"] | DashboardEvent["locations"][];
};

function normalizeEvent(event: RawDashboardEvent): DashboardEvent {
  return {
    ...event,
    locations: Array.isArray(event.locations) ? event.locations[0] ?? null : event.locations ?? null
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return { contacts: 0, validEmails: 0, upcomingEvents: 0, campaigns: 0, upcoming: [] };
  }

  const supabase = await createClientForServer();
  const now = new Date().toISOString();
  const [contacts, validEmails, upcomingEvents, campaigns, upcoming] = await Promise.all([
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .is("deleted_at", null),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .is("deleted_at", null)
      .eq("email_status", "valid"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .is("parent_event_id", null)
      .gte("starts_at", now),
    supabase
      .from("send_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id),
    supabase
      .from("events")
      .select("id, title, starts_at, status, locations(name, address)")
      .eq("org_id", org.id)
      .is("parent_event_id", null)
      .gte("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(6)
  ]);

  for (const result of [contacts, validEmails, upcomingEvents, campaigns, upcoming]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    contacts: contacts.count ?? 0,
    validEmails: validEmails.count ?? 0,
    upcomingEvents: upcomingEvents.count ?? 0,
    campaigns: campaigns.count ?? 0,
    upcoming: (upcoming.data ?? []).map((event) => normalizeEvent(event as RawDashboardEvent))
  };
}
