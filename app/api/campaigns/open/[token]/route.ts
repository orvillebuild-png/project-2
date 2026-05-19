import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase.admin";

const transparentGif = Buffer.from("R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (token) {
    const supabase = createAdminClient();
    await supabase
      .from("send_log")
      .update({ opened_at: new Date().toISOString() })
      .eq("rsvp_token", token)
      .is("opened_at", null);
  }

  return new NextResponse(transparentGif, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "image/gif"
    }
  });
}
