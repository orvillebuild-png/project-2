"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { authErrorCode } from "@/lib/auth-messages";
import { slugify } from "@/lib/orgs";
import { createClientForServer } from "@/lib/supabase";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signup(formData: FormData) {
  const name = formValue(formData, "name");
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");
  const inviteToken = formValue(formData, "invite_token");
  const orgName = formValue(formData, "org_name");
  const requestedSlug = formValue(formData, "org_slug");
  const orgSlug = slugify(requestedSlug || orgName);
  const next = formValue(formData, "next") || (inviteToken ? `/team/invite/${inviteToken}` : "/dashboard");

  if (!name || !email || !password || (!inviteToken && (!orgName || !orgSlug))) {
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
    redirect(`/signup?error=${authErrorCode(signUpError?.message ?? "signup_failed")}`);
  }

  if (inviteToken) {
    if (!authData.session) {
      redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
    }

    revalidatePath("/", "layout");
    redirect(next);
  }

  if (!authData.session) {
    redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
  }

  const orgId = crypto.randomUUID();
  const { error: orgError } = await supabase
    .from("orgs")
    .insert({
      id: orgId,
      name: orgName,
      slug: orgSlug,
      sender_name: orgName,
      reply_to_email: email,
      primary_color: "#39705f"
    });

  if (orgError) {
    redirect(`/signup?error=${authErrorCode(orgError.message)}`);
  }

  const { error: membershipError } = await supabase.from("org_users").insert({
    org_id: orgId,
    user_id: authData.user.id,
    role: "admin"
  });

  if (membershipError) {
    redirect(`/signup?error=${authErrorCode(membershipError.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
}

export async function login(formData: FormData) {
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");
  const next = formValue(formData, "next") || "/dashboard";

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    const code = authErrorCode(error.message);
    const emailQuery = code === "email_not_confirmed" ? `&email=${encodeURIComponent(email)}` : "";
    redirect(`/login?error=${code}${emailQuery}`);
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logout() {
  const supabase = await createClientForServer();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resendConfirmation(formData: FormData) {
  const email = formValue(formData, "email");

  if (!email) {
    redirect("/login?error=missing_fields");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email
  });

  if (error) {
    redirect(`/login?error=resend_failed&email=${encodeURIComponent(email)}`);
  }

  redirect(`/signup/check-email?email=${encodeURIComponent(email)}&status=confirmation_sent`);
}
