import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase.admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const rawUrl = request.nextUrl.searchParams.get("url") ?? "/";
  const redirectUrl = safeRedirectUrl(rawUrl, request.nextUrl.origin);

  if (token) {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("send_log")
      .select("id, opened_at, clicked_at")
      .eq("rsvp_token", token)
      .maybeSingle();

    if (data?.id) {
      await supabase
        .from("send_log")
        .update({
          opened_at: data.opened_at ?? now,
          clicked_at: data.clicked_at ?? now
        })
        .eq("id", data.id);
    }
  }

  return NextResponse.redirect(redirectUrl, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

function safeRedirectUrl(value: string, origin: string) {
  try {
    const url = value.startsWith("/") ? new URL(value, origin) : new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : new URL("/", origin);
  } catch {
    return new URL("/", origin);
  }
}
