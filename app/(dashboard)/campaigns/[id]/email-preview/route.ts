import { NextResponse } from "next/server";
import { getCampaignPreview, renderCampaignEmailHtml } from "@/lib/campaigns";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const preview = await getCampaignPreview(id);

  if (!preview) {
    return new NextResponse("No campaign preview available.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      status: 404
    });
  }

  const html = renderCampaignEmailHtml(preview);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
