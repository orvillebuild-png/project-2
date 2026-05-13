import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return NextResponse.json({ contacts: [] }, { status: 401 });
  }

  const body = await request.json() as { emails?: string[] };
  const emails = Array.from(new Set((body.emails ?? []).map((email) => email.trim().toLowerCase()).filter(Boolean)));

  if (emails.length === 0) {
    return NextResponse.json({ contacts: [] });
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, email, first_name, last_name, phone, alternate_email, alternate_phone, organization_name")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .in("email", emails);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ contacts: data ?? [] });
}
