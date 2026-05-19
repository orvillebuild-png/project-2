import { NextResponse } from "next/server";
import { createClientForServer } from "@/lib/supabase";

const transparentGif = Buffer.from("R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (token) {
    try {
      const supabase = await createClientForServer();
      await supabase.rpc("record_campaign_open", { token });
    } catch {
      // Tracking must never break the recipient's email client.
    }
  }

  return new NextResponse(transparentGif, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "image/gif"
    }
  });
}
