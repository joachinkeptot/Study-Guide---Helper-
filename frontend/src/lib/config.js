// @ts-nocheck
/**
 * Application configuration and environment variable validation
 */

import { logger } from "./logger";

/**
 * Validate required environment variables
 * @throws {Error} If required environment variables are missing
 */
export function validateEnv() {
  const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(
      ", "
    )}`;
    logger.error(error);
    throw new Error(error);
  }

  logger.info("Environment variables validated successfully");
}

/**
 * Application configuration
 */
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001",
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || "Study Helper",
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  },
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    enabled: import.meta.env.VITE_SENTRY_ENABLED === "true",
  },
};

/**
 * Get configuration value safely
 * @param {string} path - Dot notation path (e.g., 'supabase.url')
 * @returns {any}
 */
export function getConfig(path) {
  return path.split(".").reduce((obj, key) => obj?.[key], config);
}

export default config;
