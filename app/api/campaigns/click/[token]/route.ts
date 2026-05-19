import { NextRequest, NextResponse } from "next/server";
import { createClientForServer } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const rawUrl = request.nextUrl.searchParams.get("url") ?? "/";
  const redirectUrl = safeRedirectUrl(rawUrl, request.nextUrl.origin);

  if (token) {
    try {
      const supabase = await createClientForServer();
      await supabase.rpc("record_campaign_click", { token });
    } catch {
      // Tracking must never block the recipient from reaching the link.
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
