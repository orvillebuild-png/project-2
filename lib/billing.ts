import { redirect } from "next/navigation";
import { getCurrentOrg, getSessionUser } from "@/lib/auth";
import { createLemonSqueezyCheckout } from "@/lib/lemon-squeezy";
import { createClientForServer } from "@/lib/supabase";

export type UsageEventType = "email_sent" | "validation_run";

export type BillingProvider = "lemonsqueezy";

export type UsageRecord = {
  id: string;
  orgId: string;
  type: UsageEventType;
  quantity: number;
  idempotencyKey: string;
};

export async function reportUsage(record: UsageRecord) {
  if (process.env.BILLING_PROVIDER && process.env.BILLING_PROVIDER !== "lemonsqueezy") {
    throw new Error(`Unsupported billing provider: ${process.env.BILLING_PROVIDER}`);
  }

  const { reportLemonSqueezyUsage } = await import("@/lib/lemon-squeezy");
  return reportLemonSqueezyUsage(record);
}

export type BillingOverview = {
  org: {
    id: string;
    name: string;
    plan_status: string;
    billing_customer_id: string | null;
    billing_subscription_id: string | null;
    billing_email_item_id: string | null;
    billing_validation_item_id: string | null;
  };
  periodStart: string;
  periodEnd: string;
  emailsSent: number;
  validationsRun: number;
  unreportedEvents: number;
  estimatedCents: number;
  checkoutConfigured: boolean;
  portalUrl: string | null;
};

const emailUnitCents = Number(process.env.BILLING_EMAIL_UNIT_CENTS ?? "1");
const validationUnitCents = Number(process.env.BILLING_VALIDATION_UNIT_CENTS ?? "1");

export async function getBillingOverview(): Promise<BillingOverview> {
  const membership = await getCurrentOrg();

  if (!membership?.orgs) {
    redirect("/onboarding/create-org");
  }

  if (membership.role !== "admin") {
    redirect("/settings?error=admin_required");
  }

  const supabase = await createClientForServer();
  const start = startOfMonth(new Date());
  const end = startOfNextMonth(new Date());

  const { data: org, error: orgError } = await supabase
    .from("orgs")
    .select("id, name, plan_status, billing_customer_id, billing_subscription_id, billing_email_item_id, billing_validation_item_id")
    .eq("id", membership.orgs.id)
    .maybeSingle();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "Organization not found");
  }

  const { data: usage, error: usageError } = await supabase
    .from("usage_events")
    .select("event_type, quantity, billing_reported")
    .eq("org_id", org.id)
    .gte("occurred_at", start.toISOString())
    .lt("occurred_at", end.toISOString());

  if (usageError) {
    throw new Error(usageError.message);
  }

  const emailsSent = sumUsage(usage, "email_sent");
  const validationsRun = sumUsage(usage, "validation_run");
  const unreportedEvents = (usage ?? []).filter((event) => !event.billing_reported).length;
  const portalBase = process.env.LEMONSQUEEZY_STORE_DOMAIN?.replace(/\/$/, "");

  return {
    org: org as BillingOverview["org"],
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    emailsSent,
    validationsRun,
    unreportedEvents,
    estimatedCents: emailsSent * emailUnitCents + validationsRun * validationUnitCents,
    checkoutConfigured: Boolean(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID && (process.env.LEMONSQUEEZY_CHECKOUT_VARIANT_ID || process.env.LEMONSQUEEZY_EMAIL_VARIANT_ID)),
    portalUrl: portalBase && org.billing_customer_id ? `${portalBase}/billing` : null
  };
}

export async function startBillingCheckout() {
  "use server";

  const membership = await getCurrentOrg();
  const user = await getSessionUser();

  if (!membership?.orgs || !user?.email) {
    redirect("/login?next=/settings/billing");
  }

  if (membership.role !== "admin") {
    redirect("/settings/billing?error=admin_required");
  }

  let checkoutUrl: string;

  try {
    checkoutUrl = await createLemonSqueezyCheckout({
      email: user.email,
      name: user.user_metadata?.name ?? membership.orgs.name,
      orgId: membership.orgs.id,
      orgName: membership.orgs.name,
      redirectUrl: `${appBaseUrl()}/settings/billing?checkout=success`
    });
  } catch (error) {
    redirect(`/settings/billing?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to start checkout")}`);
  }

  redirect(checkoutUrl);
}

function sumUsage(usage: { event_type: string; quantity: number }[] | null, type: UsageEventType) {
  return (usage ?? [])
    .filter((event) => event.event_type === type)
    .reduce((total, event) => total + Number(event.quantity ?? 0), 0);
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
}

function startOfNextMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0));
}

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || "http://localhost:3000").replace(/\/$/, "");
}
