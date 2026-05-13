import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClientForServer } from "@/lib/supabase";

export type RSVPDetails = {
  send_log_id: string;
  campaign_id: string;
  event_id: string;
  contact_id: string;
  contact_name: string | null;
  contact_email: string;
  event_title: string;
  starts_at: string | null;
  ends_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  response: "yes" | "no" | "maybe" | null;
  responded_at: string | null;
};

export async function getRSVPDetails(token: string) {
  const supabase = await createClientForServer();
  const { data, error } = await supabase
    .rpc("get_rsvp_by_token", { token })
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as RSVPDetails | null;
}

export async function submitRSVP(token: string, formData: FormData) {
  "use server";

  const answer = String(formData.get("answer") ?? "");

  if (!["yes", "no", "maybe"].includes(answer)) {
    redirect(`/rsvp/${token}?error=invalid_response`);
  }

  const supabase = await createClientForServer();
  const { error } = await supabase.rpc("submit_rsvp_response", {
    token,
    answer
  });

  if (error) {
    redirect(`/rsvp/${token}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/rsvp/${token}`);
  redirect(`/rsvp/${token}?submitted=${answer}`);
}
