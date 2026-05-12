import crypto from "node:crypto";
import type { UsageRecord } from "@/lib/billing";
import { getRequiredEnv } from "@/lib/env";

export function verifyLemonSqueezySignature(payload: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const secret = getRequiredEnv("LEMONSQUEEZY_WEBHOOK_SECRET");
  const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function reportLemonSqueezyUsage(record: UsageRecord) {
  const apiKey = getRequiredEnv("LEMONSQUEEZY_API_KEY");

  return {
    provider: "lemonsqueezy" as const,
    apiKeyConfigured: Boolean(apiKey),
    usageId: record.id,
    idempotencyKey: record.idempotencyKey
  };
}
