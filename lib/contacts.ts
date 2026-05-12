import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

export type ContactListItem = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  source: string | null;
  email_status: string;
  created_at: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);
  return value || null;
}

export async function listContacts() {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return [];
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, source, email_status, created_at")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ContactListItem[];
}

export async function createContact(formData: FormData) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const firstName = nullableFormValue(formData, "first_name");
  const lastName = nullableFormValue(formData, "last_name");
  const email = formValue(formData, "email").toLowerCase();
  const phone = nullableFormValue(formData, "phone");
  const source = nullableFormValue(formData, "source");
  const sex = nullableFormValue(formData, "sex");
  const ageValue = nullableFormValue(formData, "age");
  const age = ageValue ? Number(ageValue) : null;

  if (!email) {
    redirect("/contacts/new?error=missing_email");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase.from("contacts").insert({
    org_id: org.id,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    source,
    sex,
    age: Number.isFinite(age) ? age : null,
    email_status: "pending",
    custom_fields: {}
  });

  if (error) {
    redirect(`/contacts/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  redirect("/contacts");
}

export function contactDisplayName(contact: Pick<ContactListItem, "first_name" | "last_name" | "email">) {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
  return name || contact.email;
}
