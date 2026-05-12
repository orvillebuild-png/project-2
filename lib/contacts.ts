import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Papa from "papaparse";
import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

export type ContactListItem = {
  id: string;
  salutation?: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  sex?: string | null;
  age?: number | null;
  source: string | null;
  organization_name?: string | null;
  contact_type_id?: string | null;
  alternate_email?: string | null;
  alternate_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  email_status: string;
  created_at: string;
  contact_types?: ContactType | null;
  contact_tags?: ContactTag[];
};

export type ContactType = {
  id: string;
  name: string;
  color: string | null;
};

export type ContactTag = {
  id: string;
  name: string;
  color: string | null;
};

export type ContactFilters = {
  tag?: string;
  type?: string;
  search?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);
  return value || null;
}

function mappedValue(row: Record<string, string>, mapping: Record<string, string>, field: string) {
  const header = mapping[field];
  const value = header ? row[header]?.trim() : "";
  return value || null;
}

function mappedNumber(row: Record<string, string>, mapping: Record<string, string>, field: string) {
  const value = mappedValue(row, mapping, field);
  const number = value ? Number(value) : null;
  return Number.isFinite(number) ? number : null;
}

export async function listContacts(filters: ContactFilters = {}) {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return [];
  }

  const supabase = await createClientForServer();
  let taggedContactIds: string[] | null = null;

  if (filters.tag) {
    const { data: taggedRows, error: tagError } = await supabase
      .from("contact_tags")
      .select("contact_id")
      .eq("tag_id", filters.tag);

    if (tagError) {
      throw new Error(tagError.message);
    }

    taggedContactIds = (taggedRows ?? []).map((row) => row.contact_id as string);

    if (taggedContactIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("contacts")
    .select("id, salutation, first_name, last_name, email, phone, source, organization_name, contact_type_id, email_status, created_at, contact_types(id, name, color), contact_tags(tags(id, name, color))")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (filters.type) {
    query = query.eq("contact_type_id", filters.type);
  }

  if (filters.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,organization_name.ilike.%${filters.search}%`);
  }

  if (taggedContactIds) {
    query = query.in("id", taggedContactIds);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((contact) => ({
    ...contact,
    contact_types: Array.isArray(contact.contact_types)
      ? contact.contact_types[0] ?? null
      : contact.contact_types ?? null,
    contact_tags: (contact.contact_tags ?? [])
      .map((row: { tags?: ContactTag[] | ContactTag | null }) => Array.isArray(row.tags) ? row.tags[0] : row.tags)
      .filter(Boolean)
  })) as ContactListItem[];
}

export async function listContactTypes() {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return [];
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("contact_types")
    .select("id, name, color")
    .eq("org_id", org.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ContactType[];
}

export async function listTags() {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return [];
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, color")
    .eq("org_id", org.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ContactTag[];
}

export async function createContactType(formData: FormData) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const name = formValue(formData, "name");
  const color = nullableFormValue(formData, "color") ?? "#39705f";

  if (!name) {
    redirect("/contacts/types?error=missing_fields");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase.from("contact_types").insert({
    org_id: org.id,
    name,
    color
  });

  if (error) {
    redirect(`/contacts/types?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  revalidatePath("/contacts/new");
  revalidatePath("/contacts/types");
  redirect("/contacts/types");
}

export async function createTag(formData: FormData) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const name = formValue(formData, "name");
  const color = nullableFormValue(formData, "color") ?? "#39705f";

  if (!name) {
    redirect("/contacts/tags?error=missing_fields");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase.from("tags").insert({
    org_id: org.id,
    name,
    color
  });

  if (error) {
    redirect(`/contacts/tags?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  revalidatePath("/contacts/tags");
  redirect("/contacts/tags");
}

export async function deleteTag(tagId: string) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("org_id", org.id)
    .eq("id", tagId);

  if (error) {
    redirect(`/contacts/tags?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  revalidatePath("/contacts/tags");
  redirect("/contacts/tags");
}

export async function deleteContactType(typeId: string) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase
    .from("contact_types")
    .delete()
    .eq("org_id", org.id)
    .eq("id", typeId);

  if (error) {
    redirect(`/contacts/types?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  revalidatePath("/contacts/new");
  revalidatePath("/contacts/types");
  redirect("/contacts/types");
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
  const alternateEmail = nullableFormValue(formData, "alternate_email");
  const alternatePhone = nullableFormValue(formData, "alternate_phone");
  const source = nullableFormValue(formData, "source") ?? "Manual Entry";
  const salutation = nullableFormValue(formData, "salutation");
  const organizationName = nullableFormValue(formData, "organization_name");
  const contactTypeId = nullableFormValue(formData, "contact_type_id");
  const addressLine1 = nullableFormValue(formData, "address_line1");
  const addressLine2 = nullableFormValue(formData, "address_line2");
  const city = nullableFormValue(formData, "city");
  const stateProvince = nullableFormValue(formData, "state_province");
  const postalCode = nullableFormValue(formData, "postal_code");
  const country = nullableFormValue(formData, "country");
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
    alternate_email: alternateEmail,
    alternate_phone: alternatePhone,
    source,
    salutation,
    organization_name: organizationName,
    contact_type_id: contactTypeId,
    address_line1: addressLine1,
    address_line2: addressLine2,
    city,
    state_province: stateProvince,
    postal_code: postalCode,
    country,
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

export async function getContact(contactId: string) {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, salutation, first_name, last_name, email, phone, alternate_email, alternate_phone, sex, age, source, organization_name, contact_type_id, address_line1, address_line2, city, state_province, postal_code, country, email_status, created_at, contact_types(id, name, color), contact_tags(tags(id, name, color))")
    .eq("org_id", org.id)
    .eq("id", contactId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    contact_types: Array.isArray(data.contact_types)
      ? data.contact_types[0] ?? null
      : data.contact_types ?? null,
    contact_tags: (data.contact_tags ?? [])
      .map((row: { tags?: ContactTag[] | ContactTag | null }) => Array.isArray(row.tags) ? row.tags[0] : row.tags)
      .filter(Boolean)
  } as ContactListItem;
}

export async function updateContact(contactId: string, formData: FormData) {
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
  const alternateEmail = nullableFormValue(formData, "alternate_email");
  const alternatePhone = nullableFormValue(formData, "alternate_phone");
  const source = nullableFormValue(formData, "source") ?? "Manual Entry";
  const salutation = nullableFormValue(formData, "salutation");
  const organizationName = nullableFormValue(formData, "organization_name");
  const contactTypeId = nullableFormValue(formData, "contact_type_id");
  const addressLine1 = nullableFormValue(formData, "address_line1");
  const addressLine2 = nullableFormValue(formData, "address_line2");
  const city = nullableFormValue(formData, "city");
  const stateProvince = nullableFormValue(formData, "state_province");
  const postalCode = nullableFormValue(formData, "postal_code");
  const country = nullableFormValue(formData, "country");
  const sex = nullableFormValue(formData, "sex");
  const ageValue = nullableFormValue(formData, "age");
  const age = ageValue ? Number(ageValue) : null;

  if (!email) {
    redirect(`/contacts/${contactId}?error=missing_email`);
  }

  const supabase = await createClientForServer();
  const { error } = await supabase
    .from("contacts")
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      alternate_email: alternateEmail,
      alternate_phone: alternatePhone,
      source,
      salutation,
      organization_name: organizationName,
      contact_type_id: contactTypeId,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city,
      state_province: stateProvince,
      postal_code: postalCode,
      country,
      sex,
      age: Number.isFinite(age) ? age : null
    })
    .eq("org_id", org.id)
    .eq("id", contactId);

  if (error) {
    redirect(`/contacts/${contactId}?error=${encodeURIComponent(error.message)}`);
  }

  const tagIds = formData.getAll("tag_ids").map((value) => String(value));
  const { error: deleteTagsError } = await supabase
    .from("contact_tags")
    .delete()
    .eq("contact_id", contactId);

  if (deleteTagsError) {
    redirect(`/contacts/${contactId}?error=${encodeURIComponent(deleteTagsError.message)}`);
  }

  if (tagIds.length > 0) {
    const { error: insertTagsError } = await supabase.from("contact_tags").insert(
      tagIds.map((tagId) => ({
        contact_id: contactId,
        tag_id: tagId
      }))
    );

    if (insertTagsError) {
      redirect(`/contacts/${contactId}?error=${encodeURIComponent(insertTagsError.message)}`);
    }
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  redirect(`/contacts/${contactId}?saved=1`);
}

export async function softDeleteContact(contactId: string) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase
    .from("contacts")
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq("org_id", org.id)
    .eq("id", contactId);

  if (error) {
    redirect(`/contacts/${contactId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function importMappedContacts(formData: FormData) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const file = formData.get("file");
  const rawMapping = formValue(formData, "csv_mapping");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/contacts/import?error=invalid_payload");
  }

  const source = file.name;

  if (!source.toLowerCase().endsWith(".csv")) {
    redirect("/contacts/import?error=csv_only");
  }

  let mapping: Record<string, string>;

  try {
    mapping = JSON.parse(rawMapping) as Record<string, string>;
  } catch {
    redirect("/contacts/import?error=invalid_payload");
  }

  if (!mapping.email) {
    redirect("/contacts/import?error=mapping_required");
  }

  const parsed = Papa.parse<Record<string, string>>(await file.text(), {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length > 0) {
    redirect(`/contacts/import?error=${encodeURIComponent(parsed.errors[0]?.message ?? "parse_failed")}`);
  }

  const rows = parsed.data;

  const supabase = await createClientForServer();
  const contactTypes = await listContactTypes();
  const typeLookup = new Map(contactTypes.map((type) => [type.name.trim().toLowerCase(), type.id]));
  const emails = rows
    .map((row) => mappedValue(row, mapping, "email")?.toLowerCase())
    .filter((email): email is string => Boolean(email));

  if (emails.length === 0) {
    redirect("/contacts/import?error=no_email_rows");
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("contacts")
    .select("email")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .in("email", emails);

  if (existingError) {
    redirect(`/contacts/import?error=${encodeURIComponent(existingError.message)}`);
  }

  const existingEmails = new Set((existingRows ?? []).map((row) => String(row.email).toLowerCase()));
  const seenEmails = new Set<string>();
  let duplicateRows = 0;
  let blankEmailRows = 0;
  const contactsToInsert = rows.flatMap((row) => {
    const email = mappedValue(row, mapping, "email")?.toLowerCase();

    if (!email) {
      blankEmailRows += 1;
      return [];
    }

    if (existingEmails.has(email) || seenEmails.has(email)) {
      duplicateRows += 1;
      return [];
    }

    seenEmails.add(email);
    const typeName = mappedValue(row, mapping, "contact_type");

    return [{
      org_id: org.id,
      salutation: mappedValue(row, mapping, "salutation"),
      first_name: mappedValue(row, mapping, "first_name"),
      last_name: mappedValue(row, mapping, "last_name"),
      email,
      phone: mappedValue(row, mapping, "phone"),
      alternate_email: mappedValue(row, mapping, "alternate_email"),
      alternate_phone: mappedValue(row, mapping, "alternate_phone"),
      organization_name: mappedValue(row, mapping, "organization_name"),
      contact_type_id: typeName ? typeLookup.get(typeName.trim().toLowerCase()) ?? null : null,
      address_line1: mappedValue(row, mapping, "address_line1"),
      address_line2: mappedValue(row, mapping, "address_line2"),
      city: mappedValue(row, mapping, "city"),
      state_province: mappedValue(row, mapping, "state_province"),
      postal_code: mappedValue(row, mapping, "postal_code"),
      country: mappedValue(row, mapping, "country"),
      sex: mappedValue(row, mapping, "sex"),
      age: mappedNumber(row, mapping, "age"),
      source,
      email_status: "pending",
      custom_fields: {}
    }];
  });

  if (contactsToInsert.length > 0) {
    const { error } = await supabase.from("contacts").insert(contactsToInsert);

    if (error) {
      redirect(`/contacts/import?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/contacts");
  redirect(`/contacts/import?imported=${contactsToInsert.length}&skipped=${rows.length - contactsToInsert.length}&duplicates=${duplicateRows}&blank=${blankEmailRows}`);
}

export function contactDisplayName(contact: Pick<ContactListItem, "first_name" | "last_name" | "email">) {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
  return name || contact.email;
}
