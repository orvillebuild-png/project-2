import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyLemonSqueezySignature } from "@/lib/lemon-squeezy";
import { createAdminClient } from "@/lib/supabase.admin";

const subscriptionEvents = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_failed",
  "subscription_payment_success"
]);

export async function POST(request: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "LEMONSQUEEZY_WEBHOOK_SECRET is not configured" }, { status: 503 });
  }

  const payload = await request.text();

  if (!payload || !verifyLemonSqueezySignature(payload, request.headers.get("x-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: LemonWebhookPayload;

  try {
    event = JSON.parse(payload) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const eventName = event.meta?.event_name;

  if (!eventName) {
    return NextResponse.json({ error: "Webhook event is missing event_name" }, { status: 400 });
  }

  const eventId = event.meta?.event_id ?? crypto.createHash("sha256").update(payload).digest("hex");
  const supabase = createAdminClient();
  const { error: insertError } = await supabase.from("billing_webhook_events").insert({
    id: eventId,
    event_name: eventName,
    payload: event as Record<string, unknown>
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }

    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (!subscriptionEvents.has(eventName)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const orgId = event.meta?.custom_data?.org_id;

  if (!orgId) {
    return NextResponse.json({ received: true, ignored: true, reason: "org_id_missing" });
  }

  const attributes = event.data?.attributes ?? {};
  const firstItem = attributes.first_subscription_item ?? {};
  const status = mapSubscriptionStatus(eventName, attributes.status);
  const emailItemId = pickSubscriptionItem(attributes, "email") ?? firstItem.id ?? null;
  const validationItemId = pickSubscriptionItem(attributes, "validation") ?? (emailItemId === firstItem.id ? null : firstItem.id ?? null);

  const update: Record<string, unknown> = {
    billing_provider: "lemonsqueezy",
    billing_customer_id: nullableString(attributes.customer_id),
    billing_subscription_id: nullableString(event.data?.id),
    plan_status: status
  };

  if (emailItemId) {
    update.billing_email_item_id = String(emailItemId);
  }

  if (validationItemId) {
    update.billing_validation_item_id = String(validationItemId);
  }

  const { error: updateError } = await supabase
    .from("orgs")
    .update(update)
    .eq("id", orgId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("audit_log").insert({
    org_id: orgId,
    actor_id: null,
    action: `billing.${eventName}`,
    entity_type: "billing_subscription",
    entity_id: null,
    diff: {
      provider: "lemonsqueezy",
      subscription_id: nullableString(event.data?.id),
      status
    }
  });

  return NextResponse.json({ received: true });
}

type LemonWebhookPayload = {
  meta?: {
    event_id?: string;
    event_name?: string;
    custom_data?: {
      org_id?: string;
      [key: string]: unknown;
    };
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      customer_id?: number | string | null;
      status?: string | null;
      first_subscription_item?: {
        id?: number | string | null;
        [key: string]: unknown;
      };
      urls?: {
        customer_portal?: string;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  };
};

function mapSubscriptionStatus(eventName: string, status: string | null | undefined) {
  if (eventName === "subscription_payment_failed") {
    return "past_due";
  }

  if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
    return "cancelled";
  }

  if (eventName === "subscription_paused") {
    return "paused";
  }

  const normalized = String(status ?? "").toLowerCase();

  if (["active", "trialing", "past_due", "paused", "cancelled"].includes(normalized)) {
    return normalized;
  }

  if (normalized === "expired") {
    return "cancelled";
  }

  if (normalized === "on_trial") {
    return "trialing";
  }

  return "active";
}

function nullableString(value: unknown) {
  return value === null || value === undefined || value === "" ? null : String(value);
}

function pickSubscriptionItem(attributes: Record<string, unknown>, needle: string) {
  const items = attributes.subscription_items;

  if (!Array.isArray(items)) {
    return null;
  }

  const item = items.find((entry) => {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const itemRecord = entry as Record<string, unknown>;
    const name = String(itemRecord.name ?? itemRecord.variant_name ?? itemRecord.product_name ?? "").toLowerCase();
    return name.includes(needle);
  }) as Record<string, unknown> | undefined;

  return item?.id ?? null;
}
