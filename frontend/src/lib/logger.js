// @ts-nocheck
/**
 * Centralized logging utility
 * Logs to console in development, and to external services in production
 */

import { browser } from "$app/environment";

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

/**
 * Log levels
 */
export const LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

/**
 * Logger class for structured logging
 */
class Logger {
  /**
   * Log debug information (development only)
   * @param {string} message
   * @param {any} [data]
   */
  debug(message, data) {
    if (isDev && browser) {
      console.log(`[DEBUG] ${message}`, data !== undefined ? data : "");
    }
  }

  /**
   * Log informational messages (development only)
   * @param {string} message
   * @param {any} [data]
   */
  info(message, data) {
    if (isDev && browser) {
      console.log(`[INFO] ${message}`, data !== undefined ? data : "");
    }
  }

  /**
   * Log warnings (always logged)
   * @param {string} message
   * @param {any} [data]
   */
  warn(message, data) {
    if (browser) {
      console.warn(`[WARN] ${message}`, data !== undefined ? data : "");
    }
    // In production, send to monitoring service
    if (isProd) {
      this.sendToMonitoring("warn", message, data);
    }
  }

  /**
   * Log errors (always logged)
   * @param {string} message
   * @param {any} [error]
   */
  error(message, error) {
    if (browser) {
      console.error(`[ERROR] ${message}`, error !== undefined ? error : "");
    }
    // In production, send to monitoring service
    if (isProd) {
      this.sendToMonitoring("error", message, error);
    }
  }

  /**
   * Send logs to external monitoring service (Sentry, etc.)
   * @param {string} level
   * @param {string} message
   * @param {any} [data]
   */
  sendToMonitoring(level, message, data) {
    // Integrate with Sentry or other monitoring service
    // This will be called only in production
    if (typeof window !== "undefined" && window.Sentry) {
      if (level === "error") {
        window.Sentry.captureException(
          data instanceof Error ? data : new Error(message)
        );
      } else {
        window.Sentry.captureMessage(message, level);
      }
    }
  }
}

export const logger = new Logger();
export default logger;
