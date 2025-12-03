// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { logger, LogLevel } from "./logger";

describe("Logger", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Mock console methods
    global.console.log = vi.fn();
    global.console.warn = vi.fn();
    global.console.error = vi.fn();
  });

  describe("debug", () => {
    it("should log debug messages in development", () => {
      logger.debug("Test debug message", { data: "test" });
      expect(console.log).toHaveBeenCalledWith("[DEBUG] Test debug message", {
        data: "test",
      });
    });

    it("should handle messages without data", () => {
      logger.debug("Test debug message");
      expect(console.log).toHaveBeenCalledWith(
        "[DEBUG] Test debug message",
        ""
      );
    });
  });

  describe("info", () => {
    it("should log info messages in development", () => {
      logger.info("Test info message", { data: "test" });
      expect(console.log).toHaveBeenCalledWith("[INFO] Test info message", {
        data: "test",
      });
    });
  });

  describe("warn", () => {
    it("should log warnings", () => {
      logger.warn("Test warning", { data: "test" });
      expect(console.warn).toHaveBeenCalledWith("[WARN] Test warning", {
        data: "test",
      });
    });
  });

  describe("error", () => {
    it("should log errors", () => {
      const testError = new Error("Test error");
      logger.error("Test error message", testError);
      expect(console.error).toHaveBeenCalledWith(
        "[ERROR] Test error message",
        testError
      );
    });

    it("should handle errors without error object", () => {
      logger.error("Test error message");
      expect(console.error).toHaveBeenCalledWith(
        "[ERROR] Test error message",
        ""
      );
    });
  });

  describe("LogLevel", () => {
    it("should export log levels", () => {
      expect(LogLevel.DEBUG).toBe("debug");
      expect(LogLevel.INFO).toBe("info");
      expect(LogLevel.WARN).toBe("warn");
      expect(LogLevel.ERROR).toBe("error");
    });
  });
});
