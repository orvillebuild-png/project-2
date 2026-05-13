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

export async function importMappedContactsFromFormData(formData: FormData): Promise<ImportResult> {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    return { error: "missing_org" };
  }

  const file = formData.get("file");
  const rawMapping = formValue(formData, "csv_mapping");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "invalid_payload" };
  }

  const source = file.name;

  if (!source.toLowerCase().endsWith(".csv")) {
    return { error: "csv_only" };
  }

  let mapping: Record<string, string>;

  try {
    mapping = JSON.parse(rawMapping) as Record<string, string>;
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
  const supabase = await createClientForServer();
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
    .select("email")
    .eq("org_id", org.id)
    .is("deleted_at", null)
    .in("email", emails);

  if (existingError) {
    return { error: existingError.message };
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
      sex: mappedSex(row, mapping),
      age: mappedNumber(row, mapping, "age"),
      source,
      email_status: "pending",
      custom_fields: {}
    }];
  });

  if (contactsToInsert.length > 0) {
    const { error } = await supabase.from("contacts").insert(contactsToInsert);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/contacts");
  return {
    blank: blankEmailRows,
    duplicates: duplicateRows,
    imported: contactsToInsert.length,
    skipped: rows.length - contactsToInsert.length
  };
}
