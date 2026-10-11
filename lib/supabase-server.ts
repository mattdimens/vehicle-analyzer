import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let _serverClient: ReturnType<typeof createClient<Database>> | null = null;

export function getServiceRoleClient() {
  if (!_serverClient) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Background logging will fail.");
    }
    _serverClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy_key_to_prevent_crash_at_build"
    );
  }
  return _serverClient;
}
