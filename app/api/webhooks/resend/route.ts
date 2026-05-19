import { NextRequest, NextResponse } from "next/server";
import { parseResendWebhook, primaryRecipient, verifyResendWebhook } from "@/lib/resend-webhooks";
import { createAdminClient } from "@/lib/supabase.admin";

const handledEmailEvents = new Set([
  "email.delivered",
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.failed",
  "email.complained",
  "email.suppressed"
]);

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET is not configured" }, { status: 503 });
  }

  const payload = await request.text();
  let verified = false;

  try {
    verified = verifyResendWebhook({
      payload,
      secret,
      webhookId: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature")
    });
  } catch {
    verified = false;
  }

  if (!verified) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event;

  try {
    event = parseResendWebhook(payload);
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  if (!event.type || !handledEmailEvents.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("process_resend_email_event", {
    event_id: request.headers.get("svix-id") ?? "",
    event_type: event.type,
    email_id: event.data?.email_id ?? null,
    recipient_email: primaryRecipient(event),
    event_payload: event as Record<string, unknown>
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
