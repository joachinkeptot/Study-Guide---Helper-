// Supabase client configuration
// @ts-ignore
import { createClient } from "@supabase/supabase-js";
import { browser } from "$app/environment";
import { config } from "./config";
import { logger } from "./logger";

const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: browser ? window.localStorage : undefined,
  },
});
