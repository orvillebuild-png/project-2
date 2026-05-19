import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabase";

export type UnsubscribeDetails = {
  send_log_id: string;
  org_name: string;
  contact_email: string;
  contact_name: string | null;
  already_unsubscribed: boolean;
};

type RawUnsubscribeDetails = UnsubscribeDetails | UnsubscribeDetails[];

function firstRow<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function getUnsubscribeDetails(token: string) {
  const supabase = await createClientForServer();
  const { data, error } = await supabase.rpc("get_unsubscribe_by_token", { token });

  if (error) {
    return null;
  }

  return firstRow(data as RawUnsubscribeDetails | null);
}

export async function unsubscribeByToken(token: string) {
  "use server";

  const supabase = await createClientForServer();
  const { error } = await supabase.rpc("unsubscribe_by_token", { token });

  if (error) {
    redirect(`/unsubscribe/${token}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/unsubscribe/${token}`);
  redirect(`/unsubscribe/${token}?unsubscribed=1`);
}
