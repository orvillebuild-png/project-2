import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "@/lib/env";

if (typeof window !== "undefined") {
  throw new Error("supabase.admin.ts must not be imported in browser environments");
}

export function createAdminClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false
      }
    }
  );
}
