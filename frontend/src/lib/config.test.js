// @ts-nocheck
import { describe, it, expect, vi } from "vitest";
import { validateEnv, config, getConfig } from "./config";

// Mock logger
vi.mock("./logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Config", () => {
  describe("validateEnv", () => {
    it("should validate environment variables successfully", () => {
      expect(() => validateEnv()).not.toThrow();
    });

    it("should have all required config properties", () => {
      expect(config.supabase).toBeDefined();
      expect(config.api).toBeDefined();
      expect(config.app).toBeDefined();
      expect(config.sentry).toBeDefined();
    });
  });

  describe("getConfig", () => {
    it("should get nested config value", () => {
      const appName = getConfig("app.name");
      expect(appName).toBe("Study Helper");
    });

    it("should return undefined for invalid path", () => {
      const invalid = getConfig("invalid.path");
      expect(invalid).toBeUndefined();
    });

    it("should get top-level config", () => {
      const api = getConfig("api");
      expect(api).toBeDefined();
      expect(api.baseUrl).toBeDefined();
    });
  });

  describe("config structure", () => {
    it("should have correct supabase config", () => {
      expect(config.supabase.url).toBeDefined();
      expect(config.supabase.anonKey).toBeDefined();
    });

    it("should have correct app config", () => {
      expect(config.app.name).toBe("Study Helper");
      expect(typeof config.app.isDev).toBe("boolean");
      expect(typeof config.app.isProd).toBe("boolean");
    });

    it("should have API base URL", () => {
      expect(config.api.baseUrl).toBeDefined();
      expect(typeof config.api.baseUrl).toBe("string");
    });
  });
});
