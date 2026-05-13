import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

type ImportResult =
  | {
      blank: number;
      duplicates: number;
      imported: number;
      skipped: number;
      updated: number;
    }
  | {
      error: string;
    };

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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

function mappedSex(row: Record<string, string>, mapping: Record<string, string>) {
  const value = mappedValue(row, mapping, "sex")?.toLowerCase();

  if (!value) {
    return null;
  }

  if (["m", "male", "man"].includes(value)) {
    return "male";
  }

  if (["f", "female", "woman"].includes(value)) {
    return "female";
  }

  if (["o", "other", "nonbinary", "non_binary", "non-binary"].includes(value)) {
    return "other";
  }

  return null;
}

const duplicateUpdateFields = [
  "first_name",
  "last_name",
  "phone",
  "alternate_email",
  "alternate_phone",
  "organization_name"
] as const;

type DuplicateUpdateField = (typeof duplicateUpdateFields)[number];

function isDuplicateUpdateField(value: string): value is DuplicateUpdateField {
  return duplicateUpdateFields.includes(value as DuplicateUpdateField);
}

export async function importMappedContactsFromFormData(formData: FormData): Promise<ImportResult> {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;
  const supabase = await createClientForServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!org) {
    return { error: "missing_org" };
  }

  const file = formData.get("file");
  const rawMapping = formValue(formData, "csv_mapping");
  const rawDuplicateResolutions = formValue(formData, "duplicate_resolutions");
  const tagIds = formData.getAll("tag_ids").map((value) => String(value)).filter(Boolean);

  if (!(file instanceof File) || file.size === 0) {
    return { error: "invalid_payload" };
  }

  const source = file.name;

  if (!source.toLowerCase().endsWith(".csv")) {
    return { error: "csv_only" };
  }

  let mapping: Record<string, string>;
  let duplicateResolutions: Record<string, string[]>;

  try {
    mapping = JSON.parse(rawMapping) as Record<string, string>;
    duplicateResolutions = rawDuplicateResolutions
      ? JSON.parse(rawDuplicateResolutions) as Record<string, string[]>
      : {};
  } catch {
    return { error: "invalid_payload" };
  }

  if (!mapping.email) {
    return { error: "mapping_required" };
  }

  const parsed = Papa.parse<Record<string, string>>(await file.text(), {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length > 0) {
    return { error: parsed.errors[0]?.message ?? "parse_failed" };
  }

  const rows = parsed.data;
  const { data: contactTypes, error: typeError } = await supabase
    .from("contact_types")
    .select("id, name")
    .eq("org_id", org.id);

  if (typeError) {
    return { error: typeError.message };
  }

  const typeLookup = new Map((contactTypes ?? []).map((type) => [String(type.name).trim().toLowerCase(), String(type.id)]));
  const emails = rows
    .map((row) => mappedValue(row, mapping, "email")?.toLowerCase())
    .filter((email): email is string => Boolean(email));

  if (emails.length === 0) {
    return { error: "no_email_rows" };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("contacts")
    .select("id, email, first_name, last_name, phone, alternate_email, alternate_phone, organization_name")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .in("email", emails);

  if (existingError) {
    return { error: existingError.message };
  }

  const existingEmails = new Set((existingRows ?? []).map((row) => String(row.email).toLowerCase()));
  const existingByEmail = new Map((existingRows ?? []).map((row) => [String(row.email).toLowerCase(), row]));
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
      sex: mappedSex(row, mapping),
      age: mappedNumber(row, mapping, "age"),
      source,
      email_status: "pending",
      custom_fields: {}
    }];
  });

  let updatedRows = 0;
  const historyRows: Array<{
    org_id: string;
    contact_id: string;
    actor_user_id: string | null;
    action: string;
    source: string;
    changes: Record<string, unknown>;
  }> = [];

  for (const row of rows) {
    const email = mappedValue(row, mapping, "email")?.toLowerCase();
    const existingContact = email ? existingByEmail.get(email) : null;
    const selectedFields = email ? duplicateResolutions[email] ?? [] : [];

    if (!email || !existingContact || selectedFields.length === 0) {
      continue;
    }

    const updates: Record<string, string | null> = {};
    const changes: Record<string, { from: string | null; to: string | null }> = {};

    for (const field of selectedFields) {
      if (!isDuplicateUpdateField(field)) {
        continue;
      }

      const nextValue = mappedValue(row, mapping, field);
      const currentValue = String(existingContact[field] ?? "") || null;

      if (nextValue !== currentValue) {
        updates[field] = nextValue;
        changes[field] = {
          from: currentValue,
          to: nextValue
        };
      }
    }

    if (Object.keys(updates).length === 0) {
      continue;
    }

    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("org_id", org.id)
      .eq("id", existingContact.id);

    if (error) {
      return { error: error.message };
    }

    updatedRows += 1;
    historyRows.push({
      org_id: org.id,
      contact_id: String(existingContact.id),
      actor_user_id: user?.id ?? null,
      action: "import_updated",
      source,
      changes
    });
  }

  if (contactsToInsert.length > 0) {
    const { data: insertedRows, error } = await supabase
      .from("contacts")
      .insert(contactsToInsert)
      .select("id");

    if (error) {
      return { error: error.message };
    }

    if (tagIds.length > 0 && insertedRows) {
      const { error: tagError } = await supabase.from("contact_tags").upsert(
        insertedRows.flatMap((contact) => tagIds.map((tagId) => ({
          contact_id: contact.id,
          tag_id: tagId,
          applied_by: user?.id ?? null
        }))),
        { onConflict: "contact_id,tag_id" }
      );

      if (tagError) {
        return { error: tagError.message };
      }
    }

    historyRows.push(...(insertedRows ?? []).map((contact) => ({
      org_id: org.id,
      contact_id: String(contact.id),
      actor_user_id: user?.id ?? null,
      action: "import_created",
      source,
      changes: { source, tag_ids: tagIds }
    })));
  }

  if (historyRows.length > 0) {
    const { error } = await supabase.from("contact_history").insert(historyRows);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/contacts");
  return {
    blank: blankEmailRows,
    duplicates: duplicateRows,
    imported: contactsToInsert.length,
    skipped: rows.length - contactsToInsert.length - updatedRows,
    updated: updatedRows
  };
}
