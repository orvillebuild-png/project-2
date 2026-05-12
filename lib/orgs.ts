import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function createWorkspace(formData: FormData) {
  "use server";

  const user = await requireUser();
  const orgName = formValue(formData, "org_name");
  const requestedSlug = formValue(formData, "org_slug");
  const orgSlug = slugify(requestedSlug || orgName);

  if (!orgName || !orgSlug) {
    redirect("/onboarding/create-org?error=missing_fields");
  }

  const supabase = await createClientForServer();
  const { data: org, error: orgError } = await supabase
    .from("orgs")
    .insert({
      name: orgName,
      slug: orgSlug,
      sender_name: orgName,
      reply_to_email: user.email,
      primary_color: "#39705f"
    })
    .select("id")
    .single();

  if (orgError || !org) {
    redirect(`/onboarding/create-org?error=${encodeURIComponent(orgError?.message ?? "org_failed")}`);
  }

  const { error: membershipError } = await supabase.from("org_users").insert({
    org_id: org.id,
    user_id: user.id,
    role: "admin"
  });

  if (membershipError) {
    redirect(`/onboarding/create-org?error=${encodeURIComponent(membershipError.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
