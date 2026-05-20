import { redirect } from "next/navigation";
import { cache } from "react";
import { createClientForServer } from "@/lib/supabase";

export const getSessionUser = cache(async function getSessionUser() {
  const supabase = await createClientForServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
});

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export const getCurrentOrg = cache(async function getCurrentOrg() {
  const supabase = await createClientForServer();
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("org_users")
    .select("role, orgs(id, name, slug, logo_url, plan_status)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return data as {
    role: string;
    orgs: { id: string; name: string; slug: string; logo_url: string | null; plan_status: string } | null;
  } | null;
});
