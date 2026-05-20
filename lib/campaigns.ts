import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth";
import {
  defaultEmailBuilderDraft,
  isEmailBuilderDocument,
  type EmailBuilderDocument,
  type EmailBuilderFont
} from "@/lib/email-builder-document";
import { createClientForServer } from "@/lib/supabase";
import { isSenderDomainVerified } from "@/lib/settings";

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
  editor_mode: "visual" | "legacy" | "emailbuilder";
  unlayer_design: Record<string, unknown> | null;
  email_builder_document: EmailBuilderDocument | null;
  email_builder_body: string;
  email_builder_canvas_color: string;
  email_builder_font: EmailBuilderFont;
  headline: string;
  intro: string;
  button_label: string;
  footer: string;
  show_event_details: boolean;
  font_family: string;
  email_bg: string;
  header_bg: string;
  accent_color: string;
  headline_color: string;
  button_text_color: string;
  text_color: string;
  muted_color: string;
  image_url: string;
  image_alt: string;
  image_width: number;
  attachment_url: string;
  attachment_name: string;
  from_name: string;
  from_email: string;
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
  delivery_status: "pending" | "delivered" | "bounced" | "complained" | "suppressed";
  resend_email_id?: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  last_provider_event_at?: string | null;
  sent_at: string | null;
  contacts: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    email_status?: string;
  } | null;
  rsvp_responses: {
    response: "yes" | "no" | "maybe";
    responded_at: string;
  } | null;
};

export type CampaignRsvpSummary = {
  pending: number;
  yes: number;
  maybe: number;
  no: number;
  total: number;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function defaultDesignData(eventTitle = "{{event_title}}"): EmailDesignData {
  return {
    editor_mode: "visual",
    unlayer_design: null,
    email_builder_document: null,
    email_builder_body: defaultEmailBuilderDraft().bodyText,
    email_builder_canvas_color: "#ffffff",
    email_builder_font: "MODERN_SANS",
    headline: `You are invited to ${eventTitle}`,
    intro: "We would be glad to have you with us.",
    button_label: "RSVP now",
    footer: "Thank you.",
    show_event_details: true,
    font_family: "Inter, Arial, Helvetica, sans-serif",
    email_bg: "#f8f5eb",
    header_bg: "#161616",
    accent_color: "#ffca3a",
    headline_color: "#ffffff",
    button_text_color: "#161616",
    text_color: "#181713",
    muted_color: "#716f66",
    image_url: "",
    image_alt: "",
    image_width: 640,
    attachment_url: "",
    attachment_name: "",
    from_name: "Project 2",
    from_email: ""
  };
}

export function newCampaignDesignDefaults() {
  return defaultDesignData();
}

function hexValue(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

const allowedEmailFonts = new Set([
  "Inter, Arial, Helvetica, sans-serif",
  "Arial, Helvetica, sans-serif",
  "Helvetica, Arial, sans-serif",
  "Tahoma, Geneva, sans-serif",
  "Georgia, Times, serif",
  "Verdana, Geneva, sans-serif",
  "'Trebuchet MS', Arial, sans-serif",
  "'Times New Roman', Times, serif",
  "'Palatino Linotype', Palatino, serif",
  "'Courier New', Courier, monospace"
]);

function fontValue(value: string, fallback: string) {
  return allowedEmailFonts.has(value) ? value : fallback;
}

function numericValue(value: string, fallback: number, min: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function jsonRecordValue(value: string): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export function emailDesignDataFromForm(formData: FormData): EmailDesignData {
  const defaults = defaultDesignData();
  const rawEditorMode = formValue(formData, "editor_mode");
  const editorMode = rawEditorMode === "emailbuilder" || rawEditorMode === "visual" ? rawEditorMode : "legacy";
  const emailBuilderDocument = jsonRecordValue(formValue(formData, "email_builder_document"));
  const emailBuilderFont = formValue(formData, "email_builder_font") as EmailBuilderFont;

  return {
    editor_mode: editorMode,
    unlayer_design: jsonRecordValue(formValue(formData, "unlayer_design")),
    email_builder_document: isEmailBuilderDocument(emailBuilderDocument) ? emailBuilderDocument : defaults.email_builder_document,
    email_builder_body: formValue(formData, "email_builder_body") || defaults.email_builder_body,
    email_builder_canvas_color: hexValue(formValue(formData, "email_builder_canvas_color"), defaults.email_builder_canvas_color),
    email_builder_font: ["MODERN_SANS", "BOOK_SANS", "ORGANIC_SANS", "GEOMETRIC_SANS", "HEAVY_SANS", "ROUNDED_SANS", "MODERN_SERIF", "BOOK_SERIF", "MONOSPACE"].includes(emailBuilderFont)
      ? emailBuilderFont
      : defaults.email_builder_font,
    headline: formValue(formData, "headline") || defaults.headline,
    intro: formValue(formData, "intro") || defaults.intro,
    button_label: formValue(formData, "button_label") || defaults.button_label,
    footer: formValue(formData, "footer") || defaults.footer,
    show_event_details: checkboxValue(formData, "show_event_details"),
    font_family: fontValue(formValue(formData, "font_family"), defaults.font_family),
    email_bg: hexValue(formValue(formData, "email_bg"), defaults.email_bg),
    header_bg: hexValue(formValue(formData, "header_bg"), defaults.header_bg),
    accent_color: hexValue(formValue(formData, "accent_color"), defaults.accent_color),
    headline_color: hexValue(formValue(formData, "headline_color"), defaults.headline_color),
    button_text_color: hexValue(formValue(formData, "button_text_color"), defaults.button_text_color),
    text_color: hexValue(formValue(formData, "text_color"), defaults.text_color),
    muted_color: hexValue(formValue(formData, "muted_color"), defaults.muted_color),
    image_url: formValue(formData, "image_url"),
    image_alt: formValue(formData, "image_alt"),
    image_width: numericValue(formValue(formData, "image_width"), defaults.image_width, 180, 640),
    attachment_url: formValue(formData, "attachment_url"),
    attachment_name: formValue(formData, "attachment_name"),
    from_name: formValue(formData, "from_name") || defaults.from_name,
    from_email: formValue(formData, "from_email")
  };
}

export function normalizeEmailDesignData(value: unknown): EmailDesignData {
  const defaults = defaultDesignData();
  const data = typeof value === "object" && value !== null ? value as Partial<EmailDesignData> : {};

  return {
    editor_mode: data.editor_mode === "visual" || data.editor_mode === "legacy" || data.editor_mode === "emailbuilder" ? data.editor_mode : defaults.editor_mode,
    unlayer_design: typeof data.unlayer_design === "object" && data.unlayer_design !== null && !Array.isArray(data.unlayer_design)
      ? data.unlayer_design as Record<string, unknown>
      : defaults.unlayer_design,
    email_builder_document: isEmailBuilderDocument(data.email_builder_document) ? data.email_builder_document : defaults.email_builder_document,
    email_builder_body: typeof data.email_builder_body === "string" && data.email_builder_body.trim() ? data.email_builder_body : defaults.email_builder_body,
    email_builder_canvas_color: typeof data.email_builder_canvas_color === "string" ? hexValue(data.email_builder_canvas_color, defaults.email_builder_canvas_color) : defaults.email_builder_canvas_color,
    email_builder_font: typeof data.email_builder_font === "string" && ["MODERN_SANS", "BOOK_SANS", "ORGANIC_SANS", "GEOMETRIC_SANS", "HEAVY_SANS", "ROUNDED_SANS", "MODERN_SERIF", "BOOK_SERIF", "MONOSPACE"].includes(data.email_builder_font)
      ? data.email_builder_font as EmailBuilderFont
      : defaults.email_builder_font,
    headline: typeof data.headline === "string" && data.headline.trim() ? data.headline : defaults.headline,
    intro: typeof data.intro === "string" ? data.intro : defaults.intro,
    button_label: typeof data.button_label === "string" && data.button_label.trim() ? data.button_label : defaults.button_label,
    footer: typeof data.footer === "string" ? data.footer : defaults.footer,
    show_event_details: typeof data.show_event_details === "boolean" ? data.show_event_details : defaults.show_event_details,
    font_family: typeof data.font_family === "string" ? fontValue(data.font_family, defaults.font_family) : defaults.font_family,
    email_bg: typeof data.email_bg === "string" ? hexValue(data.email_bg, defaults.email_bg) : defaults.email_bg,
    header_bg: typeof data.header_bg === "string" ? hexValue(data.header_bg, defaults.header_bg) : defaults.header_bg,
    accent_color: typeof data.accent_color === "string" ? hexValue(data.accent_color, defaults.accent_color) : defaults.accent_color,
    headline_color: typeof data.headline_color === "string" ? hexValue(data.headline_color, defaults.headline_color) : defaults.headline_color,
    button_text_color: typeof data.button_text_color === "string" ? hexValue(data.button_text_color, defaults.button_text_color) : defaults.button_text_color,
    text_color: typeof data.text_color === "string" ? hexValue(data.text_color, defaults.text_color) : defaults.text_color,
    muted_color: typeof data.muted_color === "string" ? hexValue(data.muted_color, defaults.muted_color) : defaults.muted_color,
    image_url: typeof data.image_url === "string" ? data.image_url : defaults.image_url,
    image_alt: typeof data.image_alt === "string" ? data.image_alt : defaults.image_alt,
    image_width: typeof data.image_width === "number" ? numericValue(String(data.image_width), defaults.image_width, 180, 640) : defaults.image_width,
    attachment_url: typeof data.attachment_url === "string" ? data.attachment_url : defaults.attachment_url,
    attachment_name: typeof data.attachment_name === "string" ? data.attachment_name : defaults.attachment_name,
    from_name: typeof data.from_name === "string" && data.from_name.trim() ? data.from_name : defaults.from_name,
    from_email: typeof data.from_email === "string" ? data.from_email : defaults.from_email
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

function absoluteAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function encodeError(value: string) {
  return encodeURIComponent(value.slice(0, 420));
}

function senderFrom(design: EmailDesignData, fallback: string) {
  const email = design.from_email.trim();

  if (!email) {
    return fallback;
  }

  const name = design.from_name.trim() || "Project 2";
  return `${name.replace(/[<>]/g, "")} <${email.replace(/[<>]/g, "")}>`;
}

async function assertSenderAllowed(orgId: string, design: EmailDesignData) {
  const email = design.from_email.trim();

  if (!email) {
    return;
  }

  const verified = await isSenderDomainVerified(orgId, email);

  if (!verified) {
    throw new Error(`The sender domain for ${email} is not verified. Add and verify it in Settings before sending.`);
  }
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
          design_data: normalizeEmailDesignData(template.design_data)
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
      ...campaign.email_templates.design_data,
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
    .select("id, contact_id, rsvp_token, delivery_status, resend_email_id, opened_at, clicked_at, last_provider_event_at, sent_at, contacts(first_name, last_name, email, email_status), rsvp_responses(response, responded_at)")
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function inlineFormatHtml(value: string) {
  let output = escapeHtml(value);

  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" style="color:#1f6b5d;text-decoration:underline;">$1</a>');
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  output = output.replace(/_([^_]+)_/g, "<em>$1</em>");
  output = output.replace(/`([^`]+)`/g, '<span style="font-family:monospace;background:#f7f4eb;padding:1px 4px;border-radius:4px;">$1</span>');

  return output;
}

function paragraphHtml(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim() ? `<p style="margin:0 0 14px;color:inherit;line-height:1.6;">${inlineFormatHtml(line)}</p>` : `<div style="height:10px;"></div>`)
    .join("");
}

export function renderEmailBuilderDesignHtml(design: EmailDesignData) {
  if (design.editor_mode !== "emailbuilder") {
    return null;
  }

  const imageUrl = safeImageUrl(design.image_url);
  const attachmentUrl = safeImageUrl(design.attachment_url);
  const image = imageUrl
    ? `
      <div style="padding:4px 30px 20px;text-align:center;background:${design.email_builder_canvas_color};">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(design.image_alt)}" width="${design.image_width}" style="display:inline-block;width:100%;max-width:${design.image_width}px;height:auto;border:0;outline:none;text-decoration:none;vertical-align:middle;" />
      </div>
    `
    : "";
  const attachment = attachmentUrl
    ? `
      <div style="margin:4px 30px 26px;padding:14px 16px;border:1px solid #dfdccf;border-radius:12px;background:#fffdf4;">
        <p style="margin:0 0 6px;font-weight:700;color:${design.text_color};">Attachment</p>
        <a href="${escapeHtml(attachmentUrl)}" style="color:#1f6b5d;text-decoration:underline;font-weight:700;">${escapeHtml(design.attachment_name || "Open attached file")}</a>
      </div>
    `
    : "";

  return `<!DOCTYPE html><html><body>
    <div style="margin:0;padding:36px;background:${design.email_bg};font-family:${design.font_family};">
      <div style="max-width:640px;margin:0 auto;border:1px solid #dfdccf;border-radius:18px;overflow:hidden;background:${design.email_builder_canvas_color};color:${design.text_color};">
        <div style="padding:34px 30px 32px;background:${design.header_bg};">
          <p style="margin:0 0 14px;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${design.accent_color};">Invitation</p>
          <h1 style="margin:0;color:${design.headline_color};font-size:32px;line-height:1.18;font-weight:700;">${escapeHtml(design.headline)}</h1>
        </div>
        <div style="padding:28px 30px 16px;background:${design.email_builder_canvas_color};color:${design.text_color};font-size:15px;line-height:1.6;">
          ${paragraphHtml(design.email_builder_body)}
        </div>
        ${image}
        <div style="padding:8px 30px 28px;background:${design.email_builder_canvas_color};">
          <a href="{{rsvp_link}}" style="display:inline-block;border-radius:999px;background:${design.accent_color};color:${design.button_text_color};font-size:15px;font-weight:700;padding:12px 20px;text-decoration:none;">${escapeHtml(design.button_label)}</a>
        </div>
        ${attachment}
        <div style="padding:18px 30px 28px;background:${design.email_builder_canvas_color};color:${design.muted_color};font-size:12px;line-height:1.5;">
          ${paragraphHtml(design.footer)}
        </div>
      </div>
    </div>
  </body></html>`;
}

export function bodyFromDesign(rawBody: string, design: EmailDesignData) {
  return renderEmailBuilderDesignHtml(design) ?? rawBody;
}

type CampaignEmailPreview = NonNullable<Awaited<ReturnType<typeof getCampaignPreview>>>;

function buildPreviewFromContact(
  campaign: CampaignListItem,
  contact: { id: string; first_name: string | null; last_name: string | null; email: string },
  rsvpToken: string,
  appUrl = absoluteAppUrl()
): CampaignEmailPreview {
  if (!campaign.events || !campaign.email_templates) {
    throw new Error("Campaign is missing event or email template data.");
  }

  const firstName = contact.first_name || contact.email || "Friend";
  const venue = campaign.events.locations?.name ?? "the venue";
  const rsvpLink = `${appUrl}/rsvp/${rsvpToken}`;
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
      ...campaign.email_templates.design_data,
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
    sampleEmail: contact.email
  };
}

export function campaignRsvpSummary(recipients: CampaignRecipient[]): CampaignRsvpSummary {
  return recipients.reduce(
    (summary, recipient) => {
      const response = recipient.rsvp_responses?.response;

      if (response === "yes") {
        summary.yes += 1;
      } else if (response === "maybe") {
        summary.maybe += 1;
      } else if (response === "no") {
        summary.no += 1;
      } else {
        summary.pending += 1;
      }

      summary.total += 1;
      return summary;
    },
    { pending: 0, yes: 0, maybe: 0, no: 0, total: 0 }
  );
}

export function renderCampaignEmailHtml(preview: NonNullable<Awaited<ReturnType<typeof getCampaignPreview>>>) {
  if (preview.design.editor_mode === "visual" || preview.design.editor_mode === "emailbuilder") {
    return preview.body;
  }

  const imageUrl = safeImageUrl(preview.design.image_url);
  const attachmentUrl = safeImageUrl(preview.design.attachment_url);
  const image = imageUrl
    ? `
      <div style="margin:0 0 24px;text-align:center;">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(preview.design.image_alt)}" width="${preview.design.image_width}" style="display:block;width:100%;max-width:${preview.design.image_width}px;height:auto;margin:0 auto;border-radius:14px;border:1px solid #dfdccf;" />
      </div>
    `
    : "";
  const attachment = attachmentUrl
    ? `
      <div style="margin:24px 0;padding:14px 16px;border:1px solid #dfdccf;border-radius:12px;background:#fffdf4;">
        <p style="margin:0 0 6px;font-weight:700;color:${preview.design.text_color};">Attachment</p>
        <a href="${escapeHtml(attachmentUrl)}" style="color:#1f6b5d;text-decoration:underline;font-weight:700;">${escapeHtml(preview.design.attachment_name || "Open attached file")}</a>
      </div>
    `
    : "";
  const eventDetails = preview.design.show_event_details
    ? `
      <div style="margin:24px 0;padding:16px;border:1px solid #dfdccf;border-radius:12px;background:#f7f4eb;">
        <p style="margin:0 0 8px;font-weight:700;color:${preview.design.text_color};">${escapeHtml(preview.eventTitle)}</p>
        <p style="margin:0 0 6px;color:${preview.design.muted_color};">${escapeHtml(preview.eventDate)}</p>
        <p style="margin:0;color:${preview.design.muted_color};">${escapeHtml(preview.venue)}</p>
      </div>
    `
    : "";

  const cta = preview.rsvpLink.startsWith("http") || preview.rsvpLink.startsWith("/")
    ? `<a href="${escapeHtml(preview.rsvpLink)}" style="display:inline-block;margin-top:8px;padding:12px 18px;border-radius:999px;background:${preview.design.accent_color};color:${preview.design.button_text_color};text-decoration:none;font-weight:700;">${escapeHtml(preview.design.button_label)}</a>`
    : "";

  return `
    <div style="margin:0;padding:36px;background:${preview.design.email_bg};font-family:${preview.design.font_family};">
      <div style="max-width:640px;margin:0 auto;border:1px solid #dfdccf;border-radius:18px;overflow:hidden;background:#ffffff;">
        <div style="padding:30px 28px;background:${preview.design.header_bg};color:${preview.design.headline_color};">
          <p style="margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${preview.design.accent_color};">Invitation</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:700;">${escapeHtml(preview.design.headline)}</h1>
        </div>
        <div style="padding:28px;color:${preview.design.text_color};">
          ${image}
          ${preview.design.intro ? `<p style="margin:0 0 18px;color:${preview.design.muted_color};line-height:1.6;">${escapeHtml(preview.design.intro)}</p>` : ""}
          ${paragraphHtml(preview.body)}
          ${eventDetails}
          ${attachment}
          ${cta}
          ${preview.design.footer ? `<p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #dfdccf;color:${preview.design.muted_color};font-size:12px;line-height:1.5;">${escapeHtml(preview.design.footer)}</p>` : ""}
        </div>
      </div>
    </div>
  `;
}

export function addCampaignTracking(html: string, rsvpToken: string, appUrl = absoluteAppUrl()) {
  const baseUrl = appUrl.replace(/\/$/, "");
  const clickBase = `${baseUrl}/api/campaigns/click/${encodeURIComponent(rsvpToken)}`;
  const trackedHtml = html.replace(/href=(["'])(https?:\/\/[^"']+|\/[^"']+)\1/gi, (match, quote: string, rawUrl: string) => {
    const absoluteUrl = rawUrl.startsWith("/") ? `${baseUrl}${rawUrl}` : rawUrl;

    if (absoluteUrl.startsWith(`${baseUrl}/api/campaigns/`)) {
      return match;
    }

    return `href=${quote}${clickBase}?url=${encodeURIComponent(absoluteUrl)}${quote}`;
  });
  const pixel = `<img src="${baseUrl}/api/campaigns/open/${encodeURIComponent(rsvpToken)}" width="1" height="1" alt="" style="display:none!important;width:1px;height:1px;opacity:0;border:0;" />`;

  return trackedHtml.includes("</body>")
    ? trackedHtml.replace("</body>", `${pixel}</body>`)
    : `${trackedHtml}${pixel}`;
}

export function addUnsubscribeFooter(html: string, rsvpToken: string, appUrl = absoluteAppUrl()) {
  const unsubscribeUrl = `${appUrl.replace(/\/$/, "")}/unsubscribe/${encodeURIComponent(rsvpToken)}`;
  const footer = `
    <div style="margin:24px auto 0;max-width:640px;padding:18px 24px;text-align:center;color:#716f66;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">
      You are receiving this because you were invited to an event.
      <br />
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#1f6b5d;text-decoration:underline;">Unsubscribe from future campaign emails</a>
    </div>
  `;

  return html.includes("</body>")
    ? html.replace("</body>", `${footer}</body>`)
    : `${html}${footer}`;
}

async function sendResendEmail({
  attachment,
  apiKey,
  from,
  html,
  idempotencyKey,
  subject,
  to
}: {
  attachment?: { filename: string; path: string } | null;
  apiKey: string;
  from: string;
  html: string;
  idempotencyKey: string;
  subject: string;
  to: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({
      attachments: attachment ? [attachment] : undefined,
      from,
      to,
      subject,
      html
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to send email");
  }

  const payload = await response.json().catch(() => null) as { id?: string; data?: { id?: string } } | null;
  return payload?.id ?? payload?.data?.id ?? null;
}

export async function createCampaign(formData: FormData) {
  "use server";

  const { org, supabase } = await requireOrg();
  const eventId = formValue(formData, "event_id");
  const name = formValue(formData, "name");
  const subject = formValue(formData, "subject");
  const designData = emailDesignDataFromForm(formData);
  const body = bodyFromDesign(formValue(formData, "body"), designData);

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

async function saveCampaignDraft(campaignId: string, formData: FormData, redirectTo: string) {
  const campaign = await getCampaign(campaignId);

  if (!campaign?.email_templates) {
    redirect(`/campaigns/${campaignId}?error=not_found`);
  }

  const subject = formValue(formData, "subject");
  const name = formValue(formData, "name");
  const designData = emailDesignDataFromForm(formData);
  const body = bodyFromDesign(formValue(formData, "body"), designData);

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
  redirect(redirectTo);
}

export async function updateCampaignDraft(campaignId: string, formData: FormData) {
  "use server";

  await saveCampaignDraft(campaignId, formData, `/campaigns/${campaignId}?saved=1`);
}

export async function updateCampaignDraftAndPreview(campaignId: string, formData: FormData) {
  "use server";

  await saveCampaignDraft(campaignId, formData, `/campaigns/${campaignId}/preview`);
}

export async function sendCampaignTestEmail(campaignId: string, formData: FormData) {
  "use server";

  await getCampaign(campaignId);

  const to = formValue(formData, "test_to");
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = absoluteAppUrl();

  if (!to) {
    redirect(`/campaigns/${campaignId}?error=missing_test_email`);
  }

  if (!resendApiKey || !from) {
    redirect(`/campaigns/${campaignId}?error=email_not_configured`);
  }

  const [preview, orgContext] = await Promise.all([getCampaignPreview(campaignId), requireOrg()]);

  if (!preview) {
    redirect(`/campaigns/${campaignId}?error=no_preview`);
  }

  try {
    await assertSenderAllowed(orgContext.org.id, preview.design);
  } catch (senderError) {
    redirect(`/campaigns/${campaignId}?error=${encodeError(senderError instanceof Error ? senderError.message : "Sender domain is not verified")}`);
  }

  const html = renderCampaignEmailHtml({
    ...preview,
    rsvpLink: preview.rsvpLink.startsWith("/")
      ? `${appUrl.replace(/\/$/, "")}${preview.rsvpLink}`
      : preview.rsvpLink
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      attachments: preview.design.attachment_url ? [{
        filename: preview.design.attachment_name || "attachment",
        path: preview.design.attachment_url
      }] : undefined,
      from: senderFrom(preview.design, from),
      to,
      subject: `[Test] ${preview.subject}`,
      html
    })
  });

  if (!response.ok) {
    const message = await response.text();
    redirect(`/campaigns/${campaignId}?error=${encodeError(message || "Failed to send test email")}`);
  }

  revalidatePath(`/campaigns/${campaignId}`);
  redirect(`/campaigns/${campaignId}?test_sent=1`);
}

export async function sendCampaign(campaignId: string, formData: FormData) {
  "use server";

  const confirmed = formData.get("confirm_send") === "on";
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = absoluteAppUrl();
  const campaign = await getCampaign(campaignId);

  if (!campaign?.events || !campaign.email_templates) {
    redirect(`/campaigns/${campaignId}?error=not_found`);
  }

  if (campaign.status === "sending") {
    redirect(`/campaigns/${campaignId}?error=already_sending`);
  }

  if (!confirmed) {
    redirect(`/campaigns/${campaignId}?error=confirm_send`);
  }

  if (!resendApiKey || !from) {
    redirect(`/campaigns/${campaignId}?error=email_not_configured`);
  }

  const { org, supabase } = await requireOrg();
  const { data, error } = await supabase
    .from("send_log")
    .select("id, contact_id, rsvp_token, delivery_status, contacts(id, first_name, last_name, email, email_status)")
    .eq("campaign_id", campaignId)
    .eq("delivery_status", "pending")
    .order("id", { ascending: true });

  if (error) {
    redirect(`/campaigns/${campaignId}?error=${encodeError(error.message)}`);
  }

  const rows = (data ?? []).map((row) => {
    const contact = Array.isArray(row.contacts) ? row.contacts[0] ?? null : row.contacts ?? null;
    return {
      id: row.id as string,
      contact_id: row.contact_id as string,
      rsvp_token: row.rsvp_token as string,
      contact: contact as { id: string; first_name: string | null; last_name: string | null; email: string; email_status?: string } | null
    };
  }).filter((row) => row.contact?.email);

  if (rows.length === 0) {
    redirect(`/campaigns/${campaignId}?error=no_pending_recipients`);
  }

  const contactIds = rows.map((row) => row.contact_id);
  const { data: suppressions, error: suppressionsError } = await supabase
    .from("contact_suppressions")
    .select("contact_id")
    .eq("org_id", org.id)
    .in("contact_id", contactIds);

  if (suppressionsError) {
    redirect(`/campaigns/${campaignId}?error=${encodeError(suppressionsError.message)}`);
  }

  const suppressedContactIds = new Set((suppressions ?? []).map((row) => row.contact_id as string));
  const suppressedRows = rows.filter((row) => suppressedContactIds.has(row.contact_id));
  const sendableRows = rows.filter((row) => !suppressedContactIds.has(row.contact_id));

  if (suppressedRows.length > 0) {
    const { error: suppressedError } = await supabase
      .from("send_log")
      .update({ delivery_status: "suppressed" })
      .in("id", suppressedRows.map((row) => row.id));

    if (suppressedError) {
      redirect(`/campaigns/${campaignId}?error=${encodeError(suppressedError.message)}`);
    }
  }

  if (sendableRows.length === 0) {
    revalidatePath(`/campaigns/${campaignId}`);
    redirect(`/campaigns/${campaignId}?error=no_sendable_recipients`);
  }

  const blockedRows = sendableRows.filter((row) => row.contact?.email_status === "invalid" || row.contact?.email_status === "disposable");

  if (blockedRows.length > 0) {
    redirect(`/campaigns/${campaignId}?error=invalid_email_recipients`);
  }

  const { error: sendingError } = await supabase
    .from("send_campaigns")
    .update({ status: "sending" })
    .eq("id", campaignId);

  if (sendingError) {
    redirect(`/campaigns/${campaignId}?error=${encodeError(sendingError.message)}`);
  }

  try {
    for (const row of sendableRows) {
      if (!row.contact) {
        continue;
      }

      const preview = buildPreviewFromContact(campaign, row.contact, row.rsvp_token, appUrl);
      await assertSenderAllowed(org.id, preview.design);
      const html = addCampaignTracking(addUnsubscribeFooter(renderCampaignEmailHtml(preview), row.rsvp_token, appUrl), row.rsvp_token, appUrl);

      const resendEmailId = await sendResendEmail({
        attachment: preview.design.attachment_url ? {
          filename: preview.design.attachment_name || "attachment",
          path: preview.design.attachment_url
        } : null,
        apiKey: resendApiKey,
        from: senderFrom(preview.design, from),
        to: row.contact.email,
        subject: preview.subject,
        html,
        idempotencyKey: `campaign-${campaignId}-recipient-${row.id}`
      });

      const { error: logError } = await supabase
        .from("send_log")
        .update({
          delivery_status: "delivered",
          resend_email_id: resendEmailId,
          sent_at: new Date().toISOString()
        })
        .eq("id", row.id);

      if (logError) {
        throw new Error(logError.message);
      }
    }
  } catch (sendError) {
    await supabase
      .from("send_campaigns")
      .update({ status: "draft" })
      .eq("id", campaignId);

    redirect(`/campaigns/${campaignId}?error=${encodeError(sendError instanceof Error ? sendError.message : "Failed to send campaign")}`);
  }

  const { error: sentError } = await supabase
    .from("send_campaigns")
    .update({
      status: "sent",
      sent_at: new Date().toISOString()
    })
    .eq("id", campaignId);

  if (sentError) {
    redirect(`/campaigns/${campaignId}?error=${encodeError(sentError.message)}`);
  }

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  redirect(`/campaigns/${campaignId}?sent=${sendableRows.length}`);
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
