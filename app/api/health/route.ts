import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "project-2",
    billingProvider: "lemonsqueezy",
    region: process.env.VERCEL_REGION ?? "local"
  });
}
