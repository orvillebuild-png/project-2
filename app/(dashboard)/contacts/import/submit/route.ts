import { NextRequest, NextResponse } from "next/server";
import { importMappedContactsFromFormData } from "@/lib/contact-import";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const result = await importMappedContactsFromFormData(formData);
  const redirectUrl = new URL("/contacts/import", request.url);

  if ("error" in result) {
    const error = result.error ?? "invalid_payload";

    if (error === "missing_org") {
      redirectUrl.pathname = "/onboarding/create-org";
      return NextResponse.redirect(redirectUrl);
    }

    redirectUrl.searchParams.set("error", error);
    return NextResponse.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set("imported", String(result.imported));
  redirectUrl.searchParams.set("skipped", String(result.skipped));
  redirectUrl.searchParams.set("duplicates", String(result.duplicates));
  redirectUrl.searchParams.set("blank", String(result.blank));

  return NextResponse.redirect(redirectUrl);
}
