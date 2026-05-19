import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { getCurrentOrg, getSessionUser, requireUser } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";
import { slugify } from "@/lib/orgs";

export type OrganizationSettings = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  sender_name: string | null;
  sender_email: string | null;
  reply_to_email: string | null;
  timezone: string;
  website_url: string | null;
  address: string | null;
  plan_status: string;
};

export type SenderDomain = {
  id: string;
  domain: string;
  resend_domain_id: string | null;
  status: string;
  records: SenderDnsRecord[];
  last_checked_at: string | null;
  created_at: string;
};

export type SenderDnsRecord = {
  record?: string;
  type?: string;
  name?: string;
  value?: string;
  status?: string;
  priority?: number;
  ttl?: string;
};

export type TeamMember = {
  id: string;
  role: string;
  joined_at: string;
  users: {
    email: string;
    name: string | null;
  } | null;
};

export type TeamInvitation = {
  id: string;
  org_id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  orgs?: {
    name: string;
    slug: string;
  } | null;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function cleanDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` || "http://localhost:3000").replace(/\/$/, "");
}

function dnsRecords(value: unknown): SenderDnsRecord[] {
  return Array.isArray(value) ? value.filter((record) => typeof record === "object" && record !== null) as SenderDnsRecord[] : [];
}

async function requireOrg() {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  return { org, supabase };
}

async function requireAdmin() {
  const membership = await getCurrentOrg();

  if (!membership?.orgs) {
    redirect("/onboarding/create-org");
  }

  if (membership.role !== "admin") {
    redirect("/settings?error=admin_required");
  }

  const supabase = await createClientForServer();
  return { org: membership.orgs, supabase };
}

async function resendRequest(path: string, init: RequestInit = {}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Resend API key is not configured.");
  }

  const response = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) as Record<string, unknown> : {};

  if (!response.ok) {
    throw new Error(String(json.message ?? json.error ?? text ?? "Resend request failed."));
  }

  return json;
}

async function sendTeamInviteEmail({
  email,
  inviteUrl,
  orgName,
  role
}: {
  email: string;
  inviteUrl: string;
  orgName: string;
  role: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: `You're invited to ${orgName}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;color:#111;line-height:1.6">
          <h1 style="font-size:24px;margin:0 0 12px">Join ${orgName}</h1>
          <p>You have been invited as a ${role} in Project 2.</p>
          <p><a href="${inviteUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">Accept invitation</a></p>
          <p style="color:#666;font-size:13px">This link expires in 14 days. If you were not expecting this invitation, you can ignore this email.</p>
        </div>
      `
    })
  });
}

export async function getSettingsData() {
  const { org, supabase } = await requireOrg();
  const [orgResult, domainsResult, membersResult, invitationsResult] = await Promise.all([
    supabase
      .from("orgs")
      .select("id, name, slug, logo_url, primary_color, sender_name, sender_email, reply_to_email, timezone, website_url, address, plan_status")
      .eq("id", org.id)
      .single(),
    supabase
      .from("sender_domains")
      .select("id, domain, resend_domain_id, status, records, last_checked_at, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("org_users")
      .select("id, role, joined_at, users(email, name)")
      .eq("org_id", org.id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("team_invitations")
      .select("id, org_id, email, role, status, token, expires_at, accepted_at, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
  ]);

  for (const result of [orgResult, domainsResult, membersResult, invitationsResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    org: orgResult.data as OrganizationSettings,
    domains: (domainsResult.data ?? []).map((domain) => ({
      ...domain,
      records: dnsRecords(domain.records)
    })) as SenderDomain[],
    members: (membersResult.data ?? []).map((member) => ({
      ...member,
      users: Array.isArray(member.users) ? member.users[0] ?? null : member.users ?? null
    })) as TeamMember[],
    invitations: (invitationsResult.data ?? []) as TeamInvitation[]
  };
}

export async function updateOrganizationSettings(formData: FormData) {
  "use server";

  const { org, supabase } = await requireAdmin();
  const name = formValue(formData, "name");
  const slug = slugify(formValue(formData, "slug") || name);
  const senderEmail = cleanEmail(formValue(formData, "sender_email"));
  const replyToEmail = cleanEmail(formValue(formData, "reply_to_email"));

  if (!name || !slug) {
    redirect("/settings?error=missing_org_fields");
  }

  const { error } = await supabase
    .from("orgs")
    .update({
      name,
      slug,
      logo_url: formValue(formData, "logo_url") || null,
      primary_color: formValue(formData, "primary_color") || "#ffca3a",
      timezone: formValue(formData, "timezone") || "Asia/Manila",
      website_url: formValue(formData, "website_url") || null,
      address: formValue(formData, "address") || null,
      sender_name: formValue(formData, "sender_name") || name,
      sender_email: senderEmail || null,
      reply_to_email: replyToEmail || null
    })
    .eq("id", org.id);

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  redirect("/settings?saved=profile");
}

export async function inviteTeamMember(formData: FormData) {
  "use server";

  const { org, supabase } = await requireAdmin();
  const user = await getSessionUser();
  const email = cleanEmail(formValue(formData, "email"));
  const role = formValue(formData, "role") === "admin" ? "admin" : "member";
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  if (!email) {
    redirect("/settings?error=missing_invite_email");
  }

  const { error: inviteError } = await supabase
    .from("team_invitations")
    .upsert({
      org_id: org.id,
      email,
      role,
      status: "pending",
      token,
      expires_at: expiresAt,
      accepted_at: null,
      invited_by: user?.id ?? null
    }, { onConflict: "org_id,email" });

  if (inviteError) {
    redirect(`/settings?error=${encodeURIComponent(inviteError.message)}`);
  }

  try {
    await sendTeamInviteEmail({
      email,
      inviteUrl: `${appUrl()}/team/invite/${token}`,
      orgName: org.name,
      role
    });
  } catch {
    // The invitation link is still available in Settings if email delivery fails.
  }

  revalidatePath("/settings");
  redirect("/settings?saved=team");
}

export async function getTeamInvitation(token: string) {
  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("team_invitations")
    .select("id, org_id, email, role, status, token, expires_at, accepted_at, created_at, orgs(name, slug)")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    orgs: Array.isArray(data.orgs) ? data.orgs[0] ?? null : data.orgs ?? null
  } as TeamInvitation;
}

export async function acceptTeamInvitation(token: string) {
  "use server";

  const user = await requireUser();
  const supabase = await createClientForServer();
  const invitation = await getTeamInvitation(token);

  if (!invitation) {
    redirect(`/team/invite/${token}?error=not_found`);
  }

  if (invitation.status !== "pending") {
    redirect(`/team/invite/${token}?error=already_used`);
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    redirect(`/team/invite/${token}?error=expired`);
  }

  if (cleanEmail(user.email ?? "") !== cleanEmail(invitation.email)) {
    redirect(`/team/invite/${token}?error=email_mismatch`);
  }

  const { error: membershipError } = await supabase
    .from("org_users")
    .upsert({ org_id: invitation.org_id, user_id: user.id, role: invitation.role }, { onConflict: "org_id,user_id" });

  if (membershipError) {
    redirect(`/team/invite/${token}?error=${encodeURIComponent(membershipError.message)}`);
  }

  const { error: invitationError } = await supabase
    .from("team_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString()
    })
    .eq("id", invitation.id);

  if (invitationError) {
    redirect(`/team/invite/${token}?error=${encodeURIComponent(invitationError.message)}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  redirect("/dashboard?joined=1");
}

export async function createSenderDomain(formData: FormData) {
  "use server";

  const { org, supabase } = await requireAdmin();
  const domain = cleanDomain(formValue(formData, "domain"));

  if (!domain || !domain.includes(".")) {
    redirect("/settings?error=invalid_domain");
  }

  try {
    const created = await resendRequest("/domains", {
      method: "POST",
      body: JSON.stringify({ name: domain })
    });

    const { error } = await supabase
      .from("sender_domains")
      .upsert({
        org_id: org.id,
        domain,
        resend_domain_id: String(created.id ?? ""),
        status: String(created.status ?? "not_started"),
        records: created.records ?? [],
        last_checked_at: new Date().toISOString()
      }, { onConflict: "org_id,domain" });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    redirect(`/settings?error=${encodeURIComponent(error instanceof Error ? error.message : "Domain setup failed")}`);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=domain");
}

export async function verifySenderDomain(domainId: string) {
  "use server";

  const { org, supabase } = await requireAdmin();
  const { data: domain, error } = await supabase
    .from("sender_domains")
    .select("id, resend_domain_id")
    .eq("org_id", org.id)
    .eq("id", domainId)
    .maybeSingle();

  if (error || !domain?.resend_domain_id) {
    redirect(`/settings?error=${encodeURIComponent(error?.message ?? "Domain not found")}`);
  }

  try {
    const verified = await resendRequest(`/domains/${domain.resend_domain_id}/verify`, { method: "POST" });
    const fresh = await resendRequest(`/domains/${domain.resend_domain_id}`, { method: "GET" }).catch(() => verified);

    const { error: updateError } = await supabase
      .from("sender_domains")
      .update({
        status: String(fresh.status ?? verified.status ?? "pending"),
        records: fresh.records ?? verified.records ?? [],
        last_checked_at: new Date().toISOString()
      })
      .eq("id", domain.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (verifyError) {
    redirect(`/settings?error=${encodeURIComponent(verifyError instanceof Error ? verifyError.message : "Domain verification failed")}`);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=domain_checked");
}

export async function removeSenderDomain(domainId: string) {
  "use server";

  const { org, supabase } = await requireAdmin();
  const { error } = await supabase
    .from("sender_domains")
    .delete()
    .eq("org_id", org.id)
    .eq("id", domainId);

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  redirect("/settings?saved=domain_removed");
}

export async function isSenderDomainVerified(orgId: string, email: string) {
  const domain = email.split("@")[1]?.toLowerCase();

  if (!domain) {
    return false;
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("sender_domains")
    .select("id")
    .eq("org_id", orgId)
    .eq("domain", domain)
    .eq("status", "verified")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
