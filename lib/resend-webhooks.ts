import crypto from "node:crypto";

export type ResendWebhookEvent = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    subject?: string;
    [key: string]: unknown;
  };
};

export function verifyResendWebhook({
  payload,
  secret,
  signature,
  timestamp,
  webhookId
}: {
  payload: string;
  secret: string;
  signature: string | null;
  timestamp: string | null;
  webhookId: string | null;
}) {
  if (!signature || !timestamp || !webhookId) {
    return false;
  }

  const timestampSeconds = Number(timestamp);

  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;

  if (Math.abs(nowSeconds - timestampSeconds) > fiveMinutes) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${webhookId}.${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", key)
    .update(signedContent)
    .digest("base64");

  return signature.split(" ").some((part) => {
    const candidate = part.includes(",") ? part.split(",")[1] : part;

    if (!candidate) {
      return false;
    }

    const expectedBuffer = Buffer.from(expected);
    const candidateBuffer = Buffer.from(candidate);

    return expectedBuffer.length === candidateBuffer.length && crypto.timingSafeEqual(expectedBuffer, candidateBuffer);
  });
}

export function parseResendWebhook(payload: string) {
  const parsed = JSON.parse(payload) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid webhook payload");
  }

  return parsed as ResendWebhookEvent;
}

export function primaryRecipient(event: ResendWebhookEvent) {
  return Array.isArray(event.data?.to) ? event.data?.to[0] ?? null : null;
}
