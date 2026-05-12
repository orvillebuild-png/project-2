"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabase";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function signup(formData: FormData) {
  const name = formValue(formData, "name");
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");
  const orgName = formValue(formData, "org_name");
  const requestedSlug = formValue(formData, "org_slug");
  const orgSlug = slugify(requestedSlug || orgName);

  if (!name || !email || !password || !orgName || !orgSlug) {
    redirect("/signup?error=missing_fields");
  }

  const supabase = await createClientForServer();
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name
      }
    }
  });

  if (signUpError || !authData.user) {
    redirect(`/signup?error=${encodeURIComponent(signUpError?.message ?? "signup_failed")}`);
  }

  const { data: org, error: orgError } = await supabase
    .from("orgs")
    .insert({
      name: orgName,
      slug: orgSlug,
      sender_name: orgName,
      reply_to_email: email,
      primary_color: "#39705f"
    })
    .select("id")
    .single();

  if (orgError || !org) {
    redirect(`/signup?error=${encodeURIComponent(orgError?.message ?? "org_failed")}`);
  }

  const { error: membershipError } = await supabase.from("org_users").insert({
    org_id: org.id,
    user_id: authData.user.id,
    role: "admin"
  });

  if (membershipError) {
    redirect(`/signup?error=${encodeURIComponent(membershipError.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClientForServer();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
