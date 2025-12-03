// @ts-nocheck
import { describe, it, expect } from "vitest";
import {
  ErrorCodes,
  createError,
  getErrorCode,
  getErrorMessage,
  isErrorType,
} from "./errors";

describe("Errors", () => {
  describe("ErrorCodes", () => {
    it("should have authentication error codes", () => {
      expect(ErrorCodes.AUTH_INVALID_CREDENTIALS).toBeDefined();
      expect(ErrorCodes.AUTH_INVALID_CREDENTIALS.code).toBe(1001);
    });

    it("should have study guide error codes", () => {
      expect(ErrorCodes.GUIDE_NOT_FOUND).toBeDefined();
      expect(ErrorCodes.GUIDE_NOT_FOUND.code).toBe(2001);
    });

    it("should have upload error codes", () => {
      expect(ErrorCodes.UPLOAD_FAILED).toBeDefined();
      expect(ErrorCodes.UPLOAD_FAILED.code).toBe(3001);
    });

    it("should have processing error codes", () => {
      expect(ErrorCodes.PROCESS_FAILED).toBeDefined();
      expect(ErrorCodes.PROCESS_FAILED.code).toBe(4001);
    });

    it("should have session error codes", () => {
      expect(ErrorCodes.SESSION_NOT_FOUND).toBeDefined();
      expect(ErrorCodes.SESSION_NOT_FOUND.code).toBe(5001);
    });
  });

  describe("createError", () => {
    it("should create error with code and message", () => {
      const error = createError("AUTH_INVALID_CREDENTIALS");
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(1001);
      expect(error.message).toContain("Invalid email or password");
    });

    it("should create error with additional info", () => {
      const error = createError("GUIDE_NOT_FOUND", "Guide ID: 123");
      expect(error.message).toContain("Guide ID: 123");
      expect(error.code).toBe(2001);
    });

    it("should fallback to unknown error for invalid key", () => {
      const error = createError("INVALID_KEY");
      expect(error.code).toBe(9999);
    });
  });

  describe("getErrorCode", () => {
    it("should extract error code from error object", () => {
      const error = createError("AUTH_INVALID_CREDENTIALS");
      expect(getErrorCode(error)).toBe(1001);
    });

    it("should return unknown error code for error without code", () => {
      const error = new Error("Test error");
      expect(getErrorCode(error)).toBe(9999);
    });

    it("should handle null/undefined", () => {
      expect(getErrorCode(null)).toBe(9999);
      expect(getErrorCode(undefined)).toBe(9999);
    });
  });

  describe("getErrorMessage", () => {
    it("should extract message from error object", () => {
      const error = new Error("Test error message");
      expect(getErrorMessage(error)).toBe("Test error message");
    });

    it("should handle string errors", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("should return default message for unknown errors", () => {
      expect(getErrorMessage(null)).toBe(
        "An unexpected error occurred. Please try again."
      );
    });
  });

  describe("isErrorType", () => {
    it("should identify error type correctly", () => {
      const error = createError("AUTH_INVALID_CREDENTIALS");
      expect(isErrorType(error, "AUTH_INVALID_CREDENTIALS")).toBe(true);
      expect(isErrorType(error, "GUIDE_NOT_FOUND")).toBe(false);
    });

    it("should return false for errors without code", () => {
      const error = new Error("Test");
      expect(isErrorType(error, "AUTH_INVALID_CREDENTIALS")).toBe(false);
    });
  });

  describe("error message structure", () => {
    it("should have meaningful error messages", () => {
      Object.values(ErrorCodes).forEach((errorDef) => {
        expect(errorDef.code).toBeGreaterThan(0);
        expect(errorDef.message).toBeTruthy();
        expect(errorDef.message.length).toBeGreaterThan(10);
      });
    });

    it("should have unique error codes", () => {
      const codes = Object.values(ErrorCodes).map((e) => e.code);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });
  });
});
