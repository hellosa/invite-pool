import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

export const db = createClient(url, key, {
  auth: { persistSession: false },
});

export const CLAIM_TTL_MINUTES = Number(process.env.CLAIM_TTL_MINUTES ?? 30);
