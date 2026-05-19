import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";
import { emailDesignDataFromForm, type EmailDesignData, normalizeEmailDesignData } from "@/lib/campaigns";

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

export async function createLibraryTemplate(formData: FormData) {
  "use server";

  const { org, supabase } = await requireOrg();
  const name = formValue(formData, "name");
  const subject = formValue(formData, "subject");
  const body = formValue(formData, "body");
  const description = formValue(formData, "description");
  const designData = emailDesignDataFromForm(formData);

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
