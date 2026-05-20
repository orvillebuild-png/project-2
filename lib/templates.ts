import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrg, getSessionUser } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";
import { bodyFromDesign, emailDesignDataFromForm, type EmailDesignData, normalizeEmailDesignData } from "@/lib/campaigns";

export type EmailTemplateLibraryItem = {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  html_body: string;
  design_data: EmailDesignData;
  updated_at: string | null;
  created_at: string;
};

export type EmailTemplateVersion = {
  id: string;
  template_id: string;
  org_id: string;
  version_number: number;
  name: string;
  description: string | null;
  subject: string;
  html_body: string;
  design_data: EmailDesignData;
  created_by: string | null;
  created_at: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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

function normalizeTemplate(row: Record<string, unknown>) {
  return {
    ...row,
    design_data: normalizeEmailDesignData(row.design_data)
  } as EmailTemplateLibraryItem;
}

function normalizeVersion(row: Record<string, unknown>) {
  return {
    ...row,
    design_data: normalizeEmailDesignData(row.design_data)
  } as EmailTemplateVersion;
}

async function getNextVersionNumber(templateId: string, supabase: Awaited<ReturnType<typeof createClientForServer>>) {
  const { data, error } = await supabase
    .from("email_template_versions")
    .select("version_number")
    .eq("template_id", templateId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Number(data?.version_number ?? 0) + 1;
}

async function snapshotTemplate(
  template: EmailTemplateLibraryItem,
  orgId: string,
  supabase: Awaited<ReturnType<typeof createClientForServer>>
) {
  const user = await getSessionUser();
  const nextVersion = await getNextVersionNumber(template.id, supabase);
  const { error } = await supabase
    .from("email_template_versions")
    .insert({
      template_id: template.id,
      org_id: orgId,
      version_number: nextVersion,
      name: template.name,
      description: template.description,
      subject: template.subject,
      html_body: template.html_body,
      design_data: template.design_data,
      created_by: user?.id ?? null
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listLibraryTemplates() {
  const { org, supabase } = await requireOrg();
  const { data, error } = await supabase
    .from("email_templates")
    .select("id, name, description, subject, html_body, design_data, updated_at, created_at")
    .eq("org_id", org.id)
    .eq("is_library_template", true)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeTemplate(row as Record<string, unknown>));
}

export async function getLibraryTemplate(templateId?: string | null) {
  if (!templateId) {
    return null;
  }

  const { org, supabase } = await requireOrg();
  const { data, error } = await supabase
    .from("email_templates")
    .select("id, name, description, subject, html_body, design_data, updated_at, created_at")
    .eq("org_id", org.id)
    .eq("id", templateId)
    .eq("is_library_template", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeTemplate(data as Record<string, unknown>) : null;
}

export async function listTemplateVersions(templateId: string) {
  const { org, supabase } = await requireOrg();
  const { data, error } = await supabase
    .from("email_template_versions")
    .select("id, template_id, org_id, version_number, name, description, subject, html_body, design_data, created_by, created_at")
    .eq("org_id", org.id)
    .eq("template_id", templateId)
    .order("version_number", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeVersion(row as Record<string, unknown>));
}

export async function createLibraryTemplate(formData: FormData) {
  "use server";

  const { org, supabase } = await requireOrg();
  const name = formValue(formData, "name");
  const subject = formValue(formData, "subject");
  const description = formValue(formData, "description");
  const designData = emailDesignDataFromForm(formData);
  const body = bodyFromDesign(formValue(formData, "body"), designData);

  if (!name || !subject || !body) {
    redirect("/templates/new?error=missing_fields");
  }

  const { error } = await supabase
    .from("email_templates")
    .insert({
      org_id: org.id,
      name,
      description: description || null,
      subject,
      html_body: body,
      design_data: designData,
      merge_tags: ["first_name", "event_title", "event_date", "venue", "rsvp_link"],
      is_library_template: true
    });

  if (error) {
    redirect(`/templates/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/templates");
  redirect("/templates?created=1");
}

export async function updateLibraryTemplate(templateId: string, formData: FormData) {
  "use server";

  const { org, supabase } = await requireOrg();
  const existing = await getLibraryTemplate(templateId);

  if (!existing) {
    redirect("/templates?error=Template%20not%20found");
  }

  const name = formValue(formData, "name");
  const subject = formValue(formData, "subject");
  const description = formValue(formData, "description");
  const designData = emailDesignDataFromForm(formData);
  const body = bodyFromDesign(formValue(formData, "body"), designData);

  if (!name || !subject || !body) {
    redirect(`/templates/${templateId}/edit?error=missing_fields`);
  }

  try {
    await snapshotTemplate(existing, org.id, supabase);
  } catch (error) {
    redirect(`/templates/${templateId}/edit?error=${encodeURIComponent(error instanceof Error ? error.message : "Version snapshot failed")}`);
  }

  const { error } = await supabase
    .from("email_templates")
    .update({
      name,
      description: description || null,
      subject,
      html_body: body,
      design_data: designData,
      updated_at: new Date().toISOString()
    })
    .eq("org_id", org.id)
    .eq("id", templateId)
    .eq("is_library_template", true);

  if (error) {
    redirect(`/templates/${templateId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}/edit`);
  redirect(`/templates/${templateId}/edit?saved=1`);
}

export async function restoreTemplateVersion(templateId: string, versionId: string) {
  "use server";

  const { org, supabase } = await requireOrg();
  const current = await getLibraryTemplate(templateId);

  if (!current) {
    redirect("/templates?error=Template%20not%20found");
  }

  const { data: version, error: versionError } = await supabase
    .from("email_template_versions")
    .select("id, template_id, org_id, version_number, name, description, subject, html_body, design_data, created_by, created_at")
    .eq("org_id", org.id)
    .eq("template_id", templateId)
    .eq("id", versionId)
    .maybeSingle();

  if (versionError || !version) {
    redirect(`/templates/${templateId}/edit?error=${encodeURIComponent(versionError?.message ?? "Version not found")}`);
  }

  const restored = normalizeVersion(version as Record<string, unknown>);

  try {
    await snapshotTemplate(current, org.id, supabase);
  } catch (error) {
    redirect(`/templates/${templateId}/edit?error=${encodeURIComponent(error instanceof Error ? error.message : "Version snapshot failed")}`);
  }

  const { error } = await supabase
    .from("email_templates")
    .update({
      name: restored.name,
      description: restored.description,
      subject: restored.subject,
      html_body: restored.html_body,
      design_data: restored.design_data,
      updated_at: new Date().toISOString()
    })
    .eq("org_id", org.id)
    .eq("id", templateId)
    .eq("is_library_template", true);

  if (error) {
    redirect(`/templates/${templateId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}/edit`);
  redirect(`/templates/${templateId}/edit?restored=1`);
}

export async function deleteLibraryTemplate(templateId: string) {
  "use server";

  const { org, supabase } = await requireOrg();
  const { error } = await supabase
    .from("email_templates")
    .delete()
    .eq("org_id", org.id)
    .eq("id", templateId)
    .eq("is_library_template", true);

  if (error) {
    redirect(`/templates?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/templates");
  redirect("/templates?deleted=1");
}
