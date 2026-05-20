import crypto from "node:crypto";
import type { UsageRecord } from "@/lib/billing";
import { getRequiredEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase.admin";

export function verifyLemonSqueezySignature(payload: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const secret = getRequiredEnv("LEMONSQUEEZY_WEBHOOK_SECRET");
  const digest = Buffer.from(crypto.createHmac("sha256", secret).update(payload).digest("hex"), "hex");
  const received = Buffer.from(signature, "hex");

  return received.length === digest.length && crypto.timingSafeEqual(digest, received);
}

export async function reportLemonSqueezyUsage(record: UsageRecord) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;

  if (!apiKey) {
    return {
      provider: "lemonsqueezy" as const,
      skipped: true,
      reason: "api_key_missing",
      usageId: record.id,
      idempotencyKey: record.idempotencyKey
    };
  }

  const supabase = createAdminClient();
  const { data: org, error } = await supabase
    .from("orgs")
    .select("billing_email_item_id, billing_validation_item_id")
    .eq("id", record.orgId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const subscriptionItemId = record.type === "email_sent"
    ? org?.billing_email_item_id
    : org?.billing_validation_item_id;

  if (!subscriptionItemId) {
    return {
      provider: "lemonsqueezy" as const,
      skipped: true,
      reason: "subscription_item_missing",
      usageId: record.id,
      idempotencyKey: record.idempotencyKey
    };
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/usage-records", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json"
    },
    body: JSON.stringify({
      data: {
        type: "usage-records",
        attributes: {
          quantity: record.quantity,
          action: "increment"
        },
        relationships: {
          "subscription-item": {
            data: {
              type: "subscription-items",
              id: String(subscriptionItemId)
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to report Lemon Squeezy usage");
  }

  return {
    provider: "lemonsqueezy" as const,
    skipped: false,
    usageId: record.id,
    idempotencyKey: record.idempotencyKey
  };
}

export async function createLemonSqueezyCheckout({
  email,
  name,
  orgId,
  orgName,
  redirectUrl
}: {
  email: string;
  name: string;
  orgId: string;
  orgName: string;
  redirectUrl: string;
}) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_CHECKOUT_VARIANT_ID ?? process.env.LEMONSQUEEZY_EMAIL_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    throw new Error("Lemon Squeezy checkout is not configured. Add API key, store ID, and checkout variant ID.");
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/vnd.api+json"
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            redirect_url: redirectUrl,
            receipt_button_text: "Return to Project 2",
            receipt_link_url: redirectUrl
          },
          checkout_options: {
            button_color: "#111111",
            button_text_color: "#ffffff",
            media: true,
            logo: true,
            subscription_preview: true
          },
          checkout_data: {
            email,
            name,
            custom: {
              org_id: orgId,
              org_name: orgName
            }
          }
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(storeId)
            }
          },
          variant: {
            data: {
              type: "variants",
              id: String(variantId)
            }
          }
        }
      }
    })
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.errors?.[0]?.detail ?? json?.message ?? "Failed to create Lemon Squeezy checkout");
  }

  const url = json?.data?.attributes?.url;

  if (!url) {
    throw new Error("Lemon Squeezy did not return a checkout URL");
  }

  return url as string;
}
