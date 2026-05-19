import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  source?: string;
  status?: string;
  sex?: string;
  age?: string;
  organization?: string;
  search?: string;
  limit?: string;
};

export type ContactHistoryItem = {
  id: string;
  action: string;
  source: string | null;
  changes: Record<string, unknown>;
  created_at: string;
};

export type ContactMetrics = {
  total: number;
  verified: number;
  organizations: number;
  suppressed: number;
};

export type ContactOrganization = {
  name: string;
  contact_count: number;
  verified_count: number;
  donor_count: number;
  latest_contact_at: string;
};

export type ContactSuppression = {
  id: string;
  contact_id: string;
  email: string;
  reason: "unsubscribe" | "bounce" | "complaint" | "manual";
  source_send_log_id: string | null;
  created_at: string;
  contacts: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    organization_name: string | null;
    email_status: string;
  } | null;
};

const CONTACT_LIST_LIMITS = [20, 30, 40, 50] as const;

function contactListLimit(value?: string) {
  const parsed = Number(value);
  return CONTACT_LIST_LIMITS.includes(parsed as (typeof CONTACT_LIST_LIMITS)[number]) ? parsed : 20;
}

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);
  return value || null;
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
    .select("id, salutation, first_name, last_name, email, phone, sex, age, source, organization_name, contact_type_id, email_status, created_at, contact_types(id, name, color), contact_tags(tags(id, name, color))")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(contactListLimit(filters.limit));

  if (filters.type) {
    query = query.eq("contact_type_id", filters.type);
  }

  if (filters.source) {
    query = query.eq("source", filters.source);
  }

  if (filters.status) {
    query = query.eq("email_status", filters.status);
  }

  if (filters.sex) {
    query = query.eq("sex", filters.sex);
  }

  if (filters.organization) {
    query = query.ilike("organization_name", `%${filters.organization}%`);
  }

  if (filters.age) {
    if (filters.age === "unknown") {
      query = query.is("age", null);
    } else {
      const ageRanges: Record<string, [number | null, number | null]> = {
        under_18: [null, 17],
        "18_24": [18, 24],
        "25_34": [25, 34],
        "35_44": [35, 44],
        "45_54": [45, 54],
        "55_64": [55, 64],
        "65_plus": [65, null]
      };
      const range = ageRanges[filters.age];

      if (range) {
        const [minimum, maximum] = range;
        if (minimum !== null) {
          query = query.gte("age", minimum);
        }
        if (maximum !== null) {
          query = query.lte("age", maximum);
        }
      }
    }
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

export async function listContactSources() {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return [];
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("contacts")
    .select("source")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .not("source", "is", null)
    .order("source", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(new Set((data ?? []).map((row) => row.source as string).filter(Boolean)));
}

export async function getContactMetrics(): Promise<ContactMetrics> {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return { total: 0, verified: 0, organizations: 0, suppressed: 0 };
  }

  const supabase = await createClientForServer();
  const [totalResult, verifiedResult, organizationResult, suppressedResult] = await Promise.all([
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .is("deleted_at", null),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .is("deleted_at", null)
      .eq("email_status", "valid"),
    supabase
      .from("contacts")
      .select("organization_name")
      .eq("org_id", org.id)
      .is("deleted_at", null)
      .not("organization_name", "is", null),
    supabase
      .from("contact_suppressions")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
  ]);

  if (totalResult.error) {
    throw new Error(totalResult.error.message);
  }

  if (verifiedResult.error) {
    throw new Error(verifiedResult.error.message);
  }

  if (organizationResult.error) {
    throw new Error(organizationResult.error.message);
  }

  if (suppressedResult.error) {
    throw new Error(suppressedResult.error.message);
  }

  const organizations = new Set(
    (organizationResult.data ?? [])
      .map((row) => String(row.organization_name ?? "").trim().toLowerCase())
      .filter(Boolean)
  ).size;

  return {
    total: totalResult.count ?? 0,
    verified: verifiedResult.count ?? 0,
    organizations,
    suppressed: suppressedResult.count ?? 0
  };
}

export async function listContactSuppressions(): Promise<ContactSuppression[]> {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return [];
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("contact_suppressions")
    .select("id, contact_id, email, reason, source_send_log_id, created_at, contacts(first_name, last_name, email, organization_name, email_status)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    ...row,
    contacts: Array.isArray(row.contacts) ? row.contacts[0] ?? null : row.contacts ?? null
  })) as ContactSuppression[];
}

export async function createManualSuppression(formData: FormData) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const email = formValue(formData, "email").toLowerCase();

  if (!email) {
    redirect("/contacts/suppressions?error=missing_email");
  }

  const supabase = await createClientForServer();
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, email")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .ilike("email", email)
    .maybeSingle();

  if (contactError || !contact) {
    redirect(`/contacts/suppressions?error=${encodeURIComponent(contactError?.message ?? "Contact email not found. Create or import the contact before suppressing it.")}`);
  }

  const { error } = await supabase
    .from("contact_suppressions")
    .upsert({
      org_id: org.id,
      contact_id: contact.id,
      email: contact.email,
      reason: "manual"
    }, { onConflict: "org_id,contact_id" });

  if (error) {
    redirect(`/contacts/suppressions?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  revalidatePath("/contacts/suppressions");
  redirect("/contacts/suppressions?created=1");
}

export async function removeContactSuppression(suppressionId: string) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase
    .from("contact_suppressions")
    .delete()
    .eq("org_id", org.id)
    .eq("id", suppressionId);

  if (error) {
    redirect(`/contacts/suppressions?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  revalidatePath("/contacts/suppressions");
  redirect("/contacts/suppressions?removed=1");
}

export async function listContactOrganizations(): Promise<ContactOrganization[]> {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return [];
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("contacts")
    .select("organization_name, email_status, created_at, contact_types(name)")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .not("organization_name", "is", null)
    .order("organization_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const organizations = new Map<string, ContactOrganization>();

  for (const row of data ?? []) {
    const name = String(row.organization_name ?? "").trim();

    if (!name) {
      continue;
    }

    const current = organizations.get(name) ?? {
      name,
      contact_count: 0,
      verified_count: 0,
      donor_count: 0,
      latest_contact_at: row.created_at as string
    };
    const contactType = row.contact_types as { name?: string } | { name?: string }[] | null;
    const type = Array.isArray(contactType) ? contactType[0]?.name : contactType?.name;

    current.contact_count += 1;
    current.verified_count += row.email_status === "valid" ? 1 : 0;
    current.donor_count += typeof type === "string" && type.toLowerCase().includes("donor") ? 1 : 0;
    current.latest_contact_at = new Date(row.created_at as string) > new Date(current.latest_contact_at)
      ? row.created_at as string
      : current.latest_contact_at;
    organizations.set(name, current);
  }

  return Array.from(organizations.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getContactHistory(contactId: string) {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .from("contact_history")
    .select("id, action, source, changes, created_at")
    .eq("org_id", org.id)
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ContactHistoryItem[];
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
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("email")
    .eq("org_id", org.id)
    .eq("id", contactId)
    .maybeSingle();
  const emailChanged = existingContact?.email !== email;
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
      age: Number.isFinite(age) ? age : null,
      ...(emailChanged ? { email_status: "pending", last_validated_at: null } : {})
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

export async function bulkTagContacts(formData: FormData) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const tagId = formValue(formData, "bulk_tag_id");
  const contactIds = formData.getAll("contact_ids").map((value) => String(value)).filter(Boolean);

  if (!tagId || contactIds.length === 0) {
    redirect("/contacts?error=missing_selection");
  }

  const supabase = await createClientForServer();
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .select("id")
    .eq("org_id", org.id)
    .eq("id", tagId)
    .maybeSingle();

  if (tagError || !tag) {
    redirect(`/contacts?error=${encodeURIComponent(tagError?.message ?? "Tag not found")}`);
  }

  const { data: ownedContacts, error: contactError } = await supabase
    .from("contacts")
    .select("id")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .in("id", contactIds);

  if (contactError) {
    redirect(`/contacts?error=${encodeURIComponent(contactError.message)}`);
  }

  const ownedContactIds = (ownedContacts ?? []).map((contact) => contact.id as string);

  if (ownedContactIds.length === 0) {
    redirect("/contacts?error=missing_selection");
  }

  const { data: userResult } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("contact_tags")
    .upsert(
      ownedContactIds.map((contactId) => ({
        contact_id: contactId,
        tag_id: tagId,
        applied_by: userResult.user?.id ?? null
      })),
      { onConflict: "contact_id,tag_id" }
    );

  if (error) {
    redirect(`/contacts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  redirect(`/contacts?tagged=${ownedContactIds.length}`);
}

export async function bulkDeleteContacts(formData: FormData) {
  "use server";

  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const contactIds = formData.getAll("contact_ids").map((value) => String(value)).filter(Boolean);

  if (contactIds.length === 0) {
    redirect("/contacts?error=missing_selection");
  }

  const supabase = await createClientForServer();
  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("org_id", org.id)
    .in("id", contactIds);

  if (error) {
    redirect(`/contacts?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/contacts");
  redirect(`/contacts?deleted=${contactIds.length}`);
}

export function contactDisplayName(contact: Pick<ContactListItem, "first_name" | "last_name" | "email">) {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
  return name || contact.email;
}
