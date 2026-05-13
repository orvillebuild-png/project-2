import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

export type CampaignListItem = {
  id: string;
  name: string | null;
  status: "draft" | "scheduled" | "sending" | "sent";
  recipient_count: number;
  created_at?: string;
  events: {
    id: string;
    title: string;
    starts_at: string | null;
    locations?: {
      name: string;
      address: string | null;
    } | null;
  } | null;
  email_templates: {
    id: string;
    name: string;
    subject: string;
    html_body: string;
    design_data: EmailDesignData;
  } | null;
};

export type EmailDesignData = {
  headline: string;
  intro: string;
  button_label: string;
  footer: string;
  show_event_details: boolean;
};

export type CampaignEventOption = {
  id: string;
  title: string;
  starts_at: string | null;
  invitee_count: number;
};

export type CampaignRecipient = {
  id: string;
  contact_id: string;
  rsvp_token: string;
  delivery_status: "pending" | "delivered" | "bounced" | "complained";
  contacts: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  rsvp_responses: {
    response: "yes" | "no" | "maybe";
    responded_at: string;
  } | null;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function defaultDesignData(eventTitle = "{{event_title}}"): EmailDesignData {
  return {
    headline: `You are invited to ${eventTitle}`,
    intro: "We would be glad to have you with us.",
    button_label: "RSVP now",
    footer: "Thank you.",
    show_event_details: true
  };
}

function designDataFromForm(formData: FormData): EmailDesignData {
  const defaults = defaultDesignData();

  return {
    headline: formValue(formData, "headline") || defaults.headline,
    intro: formValue(formData, "intro") || defaults.intro,
    button_label: formValue(formData, "button_label") || defaults.button_label,
    footer: formValue(formData, "footer") || defaults.footer,
    show_event_details: checkboxValue(formData, "show_event_details")
  };
}

function normalizeDesignData(value: unknown): EmailDesignData {
  const defaults = defaultDesignData();
  const data = typeof value === "object" && value !== null ? value as Partial<EmailDesignData> : {};

  return {
    headline: typeof data.headline === "string" && data.headline.trim() ? data.headline : defaults.headline,
    intro: typeof data.intro === "string" ? data.intro : defaults.intro,
    button_label: typeof data.button_label === "string" && data.button_label.trim() ? data.button_label : defaults.button_label,
    footer: typeof data.footer === "string" ? data.footer : defaults.footer,
    show_event_details: typeof data.show_event_details === "boolean" ? data.show_event_details : defaults.show_event_details
  };
}

function eventDate(value?: string | null) {
  if (!value) {
    return "event date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

async function requireOrg() {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  return { org, supabase };
}

type RawCampaignEvent = Omit<NonNullable<CampaignListItem["events"]>, "locations"> & {
  locations?: NonNullable<NonNullable<CampaignListItem["events"]>["locations"]> | NonNullable<NonNullable<CampaignListItem["events"]>["locations"]>[];
};

type RawCampaignRow = Omit<CampaignListItem, "events" | "email_templates"> & {
  events?: RawCampaignEvent | RawCampaignEvent[];
  email_templates?: CampaignListItem["email_templates"] | CampaignListItem["email_templates"][];
};

function normalizeCampaign(row: RawCampaignRow) {
  const event = Array.isArray(row.events) ? row.events[0] ?? null : row.events ?? null;
  const template = Array.isArray(row.email_templates)
    ? row.email_templates[0] ?? null
    : row.email_templates ?? null;

  return {
    ...row,
    events: event
      ? {
          ...event,
          locations: Array.isArray(event.locations) ? event.locations[0] ?? null : event.locations ?? null
        }
      : null,
    email_templates: template
      ? {
          ...template,
          design_data: normalizeDesignData(template.design_data)
        }
      : null
  } as CampaignListItem;
}

export async function listCampaigns() {
  const { org, supabase } = await requireOrg();
  const { data, error } = await supabase
    .from("send_campaigns")
    .select("id, name, status, recipient_count, scheduled_at, sent_at, events(id, title, starts_at, locations(name, address)), email_templates(id, name, subject, html_body, design_data)")
    .eq("org_id", org.id)
    .order("scheduled_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(normalizeCampaign);
}

export async function listCampaignEventOptions() {
  const { org, supabase } = await requireOrg();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("org_id", org.id)
    .is("parent_event_id", null)
    .order("starts_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const eventIds = (events ?? []).map((event) => event.id as string);
  let inviteeCounts = new Map<string, number>();

  if (eventIds.length > 0) {
    const { data: attendanceRows, error: attendanceError } = await supabase
      .from("attendance")
      .select("event_id")
      .in("event_id", eventIds);

    if (attendanceError) {
      throw new Error(attendanceError.message);
    }

    inviteeCounts = (attendanceRows ?? []).reduce((counts, row) => {
      const eventId = row.event_id as string;
      counts.set(eventId, (counts.get(eventId) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());
  }

  return (events ?? []).map((event) => ({
    id: event.id as string,
    title: event.title as string,
    starts_at: event.starts_at as string | null,
    invitee_count: inviteeCounts.get(event.id as string) ?? 0
  })) as CampaignEventOption[];
}

export async function getCampaign(campaignId: string) {
  const { org, supabase } = await requireOrg();
  const { data, error } = await supabase
    .from("send_campaigns")
    .select("id, name, status, recipient_count, filter_snapshot, scheduled_at, sent_at, events(id, title, starts_at, locations(name, address)), email_templates(id, name, subject, html_body, design_data)")
    .eq("org_id", org.id)
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeCampaign(data) : null;
}

export async function getCampaignPreview(campaignId: string) {
  const campaign = await getCampaign(campaignId);

  if (!campaign?.events || !campaign.email_templates) {
    return null;
  }

  const { supabase } = await requireOrg();
  const { data: invitee } = await supabase
    .from("attendance")
    .select("contacts(id, first_name, last_name, email)")
    .eq("event_id", campaign.events.id)
    .limit(1)
    .maybeSingle();

  const contact = Array.isArray(invitee?.contacts) ? invitee?.contacts[0] : invitee?.contacts;
  const firstName = contact?.first_name || contact?.email || "Friend";
  const venue = campaign.events.locations?.name ?? "the venue";
  const { data: sendLog } = contact?.id
    ? await supabase
        .from("send_log")
        .select("rsvp_token")
        .eq("campaign_id", campaignId)
        .eq("contact_id", contact.id)
        .maybeSingle()
    : { data: null };
  const rsvpLink = sendLog?.rsvp_token ? `/rsvp/${sendLog.rsvp_token}` : "Prepare recipient log to generate RSVP link";
  const values: Record<string, string> = {
    first_name: firstName,
    event_title: campaign.events.title,
    event_date: eventDate(campaign.events.starts_at),
    rsvp_link: rsvpLink,
    venue
  };

  return {
    subject: renderMergeFields(campaign.email_templates.subject, values),
    body: renderMergeFields(campaign.email_templates.html_body, values),
    design: {
      headline: renderMergeFields(campaign.email_templates.design_data.headline, values),
      intro: renderMergeFields(campaign.email_templates.design_data.intro, values),
      button_label: renderMergeFields(campaign.email_templates.design_data.button_label, values),
      footer: renderMergeFields(campaign.email_templates.design_data.footer, values),
      show_event_details: campaign.email_templates.design_data.show_event_details
    },
    eventTitle: campaign.events.title,
    eventDate: eventDate(campaign.events.starts_at),
    venue,
    rsvpLink,
    sampleEmail: contact?.email ?? "No invitee selected yet"
  };
}

export async function getCampaignSendLogCount(campaignId: string) {
  const { supabase } = await requireOrg();
  const { count, error } = await supabase
    .from("send_log")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

type RawCampaignRecipient = Omit<CampaignRecipient, "contacts" | "rsvp_responses"> & {
  contacts?: CampaignRecipient["contacts"] | CampaignRecipient["contacts"][];
  rsvp_responses?: CampaignRecipient["rsvp_responses"] | CampaignRecipient["rsvp_responses"][];
};

export async function listCampaignRecipients(campaignId: string) {
  await getCampaign(campaignId);

  const { supabase } = await requireOrg();
  const { data, error } = await supabase
    .from("send_log")
    .select("id, contact_id, rsvp_token, delivery_status, contacts(first_name, last_name, email), rsvp_responses(response, responded_at)")
    .eq("campaign_id", campaignId)
    .order("sent_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const recipient = row as RawCampaignRecipient;
    return {
      ...recipient,
      contacts: Array.isArray(recipient.contacts) ? recipient.contacts[0] ?? null : recipient.contacts ?? null,
      rsvp_responses: Array.isArray(recipient.rsvp_responses)
        ? recipient.rsvp_responses[0] ?? null
        : recipient.rsvp_responses ?? null
    };
  }) as CampaignRecipient[];
}

function renderMergeFields(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*(first_name|event_title|event_date|venue|rsvp_link)\s*\}\}/g, (_, key: string) => values[key] ?? "");
}

export async function createCampaign(formData: FormData) {
  "use server";

  const { org, supabase } = await requireOrg();
  const eventId = formValue(formData, "event_id");
  const name = formValue(formData, "name");
  const subject = formValue(formData, "subject");
  const body = formValue(formData, "body");
  const designData = designDataFromForm(formData);

  if (!eventId || !name || !subject || !body) {
    redirect("/campaigns/new?error=missing_fields");
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title")
    .eq("org_id", org.id)
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) {
    redirect(`/campaigns/new?error=${encodeURIComponent(eventError?.message ?? "Event not found")}`);
  }

  const { count: recipientCount, error: countError } = await supabase
    .from("attendance")
    .select("contact_id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (countError) {
    redirect(`/campaigns/new?error=${encodeURIComponent(countError.message)}`);
  }

  const { data: template, error: templateError } = await supabase
    .from("email_templates")
    .insert({
      org_id: org.id,
      name: `${event.title} invitation`,
      subject,
      html_body: body,
      design_data: designData,
      merge_tags: ["first_name", "event_title", "event_date", "venue", "rsvp_link"]
    })
    .select("id")
    .single();

  if (templateError) {
    redirect(`/campaigns/new?error=${encodeURIComponent(templateError.message)}`);
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("send_campaigns")
    .insert({
      org_id: org.id,
      event_id: eventId,
      template_id: template.id,
      name,
      status: "draft",
      filter_snapshot: {
        source: "event_invitees",
        event_id: eventId
      },
      recipient_count: recipientCount ?? 0
    })
    .select("id")
    .single();

  if (campaignError) {
    redirect(`/campaigns/new?error=${encodeURIComponent(campaignError.message)}`);
  }

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}?created=1`);
}

export async function updateCampaignDraft(campaignId: string, formData: FormData) {
  "use server";

  const campaign = await getCampaign(campaignId);

  if (!campaign?.email_templates) {
    redirect(`/campaigns/${campaignId}?error=not_found`);
  }

  const subject = formValue(formData, "subject");
  const name = formValue(formData, "name");
  const body = formValue(formData, "body");
  const designData = designDataFromForm(formData);

  if (!name || !subject || !body) {
    redirect(`/campaigns/${campaignId}?error=missing_fields`);
  }

  const { supabase } = await requireOrg();
  const { error: campaignError } = await supabase
    .from("send_campaigns")
    .update({ name })
    .eq("id", campaignId);

  if (campaignError) {
    redirect(`/campaigns/${campaignId}?error=${encodeURIComponent(campaignError.message)}`);
  }

  const { error } = await supabase
    .from("email_templates")
    .update({
      subject,
      html_body: body,
      design_data: designData,
      updated_at: new Date().toISOString()
    })
    .eq("id", campaign.email_templates.id);

  if (error) {
    redirect(`/campaigns/${campaignId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  redirect(`/campaigns/${campaignId}?saved=1`);
}

export async function prepareCampaignRecipients(campaignId: string) {
  "use server";

  const campaign = await getCampaign(campaignId);

  if (!campaign?.events) {
    redirect(`/campaigns/${campaignId}?error=not_found`);
  }

  const { supabase } = await requireOrg();
  const { data: invitees, error: inviteesError } = await supabase
    .from("attendance")
    .select("contact_id")
    .eq("event_id", campaign.events.id);

  if (inviteesError) {
    redirect(`/campaigns/${campaignId}?error=${encodeURIComponent(inviteesError.message)}`);
  }

  const contactIds = (invitees ?? []).map((invitee) => invitee.contact_id as string);

  if (contactIds.length === 0) {
    redirect(`/campaigns/${campaignId}?error=no_recipients`);
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("send_log")
    .select("contact_id")
    .eq("campaign_id", campaignId);

  if (existingError) {
    redirect(`/campaigns/${campaignId}?error=${encodeURIComponent(existingError.message)}`);
  }

  const existing = new Set((existingRows ?? []).map((row) => row.contact_id as string));
  const missingContactIds = contactIds.filter((contactId) => !existing.has(contactId));

  if (missingContactIds.length > 0) {
    const { error } = await supabase.from("send_log").insert(
      missingContactIds.map((contactId) => ({
        campaign_id: campaignId,
        contact_id: contactId,
        rsvp_token: randomBytes(18).toString("hex"),
        delivery_status: "pending"
      }))
    );

    if (error) {
      redirect(`/campaigns/${campaignId}?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath(`/campaigns/${campaignId}`);
  redirect(`/campaigns/${campaignId}?prepared=${missingContactIds.length}`);
}
