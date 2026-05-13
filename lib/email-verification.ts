import { randomUUID } from "node:crypto";
import { resolveMx } from "node:dns/promises";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

export type EmailVerificationStatus = "valid" | "invalid" | "disposable" | "risky" | "unknown";

type VerificationResult = {
  status: EmailVerificationStatus;
  subStatus: string | null;
  isDisposable: boolean | null;
  mxFound: boolean | null;
  provider: string;
};

function formContactIds(formData: FormData) {
  return formData.getAll("contact_ids").map((value) => String(value)).filter(Boolean);
}

function reacherEndpoint() {
  const raw = process.env.REACHER_API_URL?.trim();

  if (!raw) {
    return null;
  }

  return raw.endsWith("/check_email") ? raw : `${raw.replace(/\/$/, "")}/v1/check_email`;
}

function mapReacherStatus(value: unknown, disposable: boolean | null): EmailVerificationStatus {
  if (disposable) {
    return "disposable";
  }

  if (value === "safe") {
    return "valid";
  }

  if (value === "invalid") {
    return "invalid";
  }

  if (value === "risky") {
    return "risky";
  }

  return "unknown";
}

function mapDisifyStatus(data: {
  confidence?: number;
  disposable?: boolean;
  dns?: boolean;
  format?: boolean;
}): EmailVerificationStatus {
  if (data.format === false || data.dns === false) {
    return "invalid";
  }

  if (data.disposable) {
    return "disposable";
  }

  if (typeof data.confidence === "number" && data.confidence >= 50) {
    return "risky";
  }

  if (data.format && data.dns) {
    return "valid";
  }

  return "unknown";
}

async function verifyWithDisify(email: string): Promise<VerificationResult | null> {
  const endpoint = `https://disify.com/api/email/${encodeURIComponent(email.trim())}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        ...(process.env.DISIFY_API_KEY ? { Authorization: `Bearer ${process.env.DISIFY_API_KEY}` } : {})
      },
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as {
      confidence?: number;
      disposable?: boolean;
      dns?: boolean;
      error?: string;
      format?: boolean;
      mx_info?: string[];
      role?: boolean;
      signals?: string[];
    };

    if (data.error) {
      return null;
    }

    const signals = Array.isArray(data.signals) && data.signals.length > 0
      ? `signals:${data.signals.slice(0, 4).join(",")}`
      : null;
    const confidence = typeof data.confidence === "number" ? `confidence:${data.confidence}` : null;
    const role = data.role ? "role" : null;

    return {
      status: mapDisifyStatus(data),
      subStatus: [confidence, signals, role].filter(Boolean).join(";") || null,
      isDisposable: typeof data.disposable === "boolean" ? data.disposable : null,
      mxFound: typeof data.dns === "boolean"
        ? data.dns
        : Array.isArray(data.mx_info)
          ? data.mx_info.length > 0
          : null,
      provider: "disify"
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyWithReacher(email: string): Promise<VerificationResult | null> {
  const endpoint = reacherEndpoint();

  if (!endpoint) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(endpoint, {
      body: JSON.stringify({ to_email: email }),
      headers: {
        "Content-Type": "application/json",
        ...(process.env.REACHER_API_KEY ? { Authorization: process.env.REACHER_API_KEY } : {})
      },
      method: "POST",
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        status: "unknown",
        subStatus: `reacher_http_${response.status}`,
        isDisposable: null,
        mxFound: null,
        provider: "reacher"
      };
    }

    const data = await response.json() as {
      is_reachable?: string;
      misc?: { is_disposable?: boolean; is_role_account?: boolean };
      mx?: { accepts_mail?: boolean; records?: unknown[] };
      syntax?: { is_valid_syntax?: boolean };
    };
    const isDisposable = typeof data.misc?.is_disposable === "boolean" ? data.misc.is_disposable : null;
    const mxFound = typeof data.mx?.accepts_mail === "boolean"
      ? data.mx.accepts_mail
      : Array.isArray(data.mx?.records)
        ? data.mx.records.length > 0
        : null;

    return {
      status: mapReacherStatus(data.is_reachable, isDisposable),
      subStatus: data.is_reachable ?? null,
      isDisposable,
      mxFound,
      provider: "reacher"
    };
  } catch (error) {
    return {
      status: "unknown",
      subStatus: error instanceof Error ? error.name : "reacher_error",
      isDisposable: null,
      mxFound: null,
      provider: "reacher"
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyWithDns(email: string): Promise<VerificationResult> {
  const normalized = email.trim().toLowerCase();
  const validSyntax = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);

  if (!validSyntax) {
    return {
      status: "invalid",
      subStatus: "invalid_syntax",
      isDisposable: null,
      mxFound: false,
      provider: "syntax_mx"
    };
  }

  const domain = normalized.split("@")[1];

  try {
    const records = await resolveMx(domain);

    return {
      status: records.length > 0 ? "unknown" : "invalid",
      subStatus: records.length > 0 ? "mx_found_provider_not_configured" : "mx_missing",
      isDisposable: null,
      mxFound: records.length > 0,
      provider: "syntax_mx"
    };
  } catch {
    return {
      status: "invalid",
      subStatus: "mx_lookup_failed",
      isDisposable: null,
      mxFound: false,
      provider: "syntax_mx"
    };
  }
}

export async function verifyEmailAddress(email: string) {
  return await verifyWithDisify(email) ?? await verifyWithReacher(email) ?? await verifyWithDns(email);
}

async function writeVerification(contactId: string, orgId: string, result: VerificationResult) {
  const supabase = await createClientForServer();
  const now = new Date().toISOString();
  const { error: validationError } = await supabase.from("email_validations").insert({
    contact_id: contactId,
    status: result.status,
    sub_status: result.subStatus,
    is_disposable: result.isDisposable,
    mx_found: result.mxFound,
    provider: result.provider,
    validated_at: now
  });

  if (validationError) {
    throw new Error(validationError.message);
  }

  const { error: contactError } = await supabase
    .from("contacts")
    .update({
      email_status: result.status,
      last_validated_at: now
    })
    .eq("org_id", orgId)
    .eq("id", contactId);

  if (contactError) {
    throw new Error(contactError.message);
  }

  await supabase.from("usage_events").insert({
    org_id: orgId,
    event_type: "validation_run",
    quantity: 1,
    metadata: {
      contact_id: contactId,
      provider: result.provider,
      status: result.status
    },
    billing_idempotency_key: `validation-${contactId}-${randomUUID()}`
  });
}

async function verifyContacts(contactIds: string[]) {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  if (contactIds.length === 0) {
    redirect("/contacts?error=missing_selection");
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, email")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .in("id", contactIds);

  if (error) {
    throw new Error(error.message);
  }

  const contacts = data ?? [];

  for (const contact of contacts) {
    const result = await verifyEmailAddress(contact.email as string);
    await writeVerification(contact.id as string, org.id, result);
  }

  revalidatePath("/contacts");
  return contacts.length;
}

export async function verifySelectedContacts(formData: FormData) {
  "use server";

  const count = await verifyContacts(formContactIds(formData));
  redirect(`/contacts?verified=${count}`);
}

export async function verifyContact(contactId: string) {
  "use server";

  const count = await verifyContacts([contactId]);
  redirect(`/contacts/${contactId}?verified=${count}`);
}
