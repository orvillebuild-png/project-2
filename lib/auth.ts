import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabase";

export async function getSessionUser() {
  const supabase = await createClientForServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentOrg() {
  const supabase = await createClientForServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("org_users")
    .select("role, orgs(id, name, slug, plan_status)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return data as {
    role: string;
    orgs: { id: string; name: string; slug: string; plan_status: string } | null;
  } | null;
}
