// @ts-nocheck
/**
 * DEPRECATED: Ollama support has been removed.
 * This module is kept to avoid breaking imports but will throw if used.
 * Please use `supabase.functions.invoke('call-claude')` via `$lib/supabase-api.js` instead.
 */

export async function callOllama() {
  throw new Error("Ollama is no longer supported. Use Claude API instead.");
}

export async function checkOllamaStatus() {
  return false;
}

export async function listOllamaModels() {
  return [];
}
