// @ts-nocheck
import { describe, it, expect } from "vitest";
import {
  validate,
  getErrorMessage,
  validateFileUpload,
  authSchemas,
  studyGuideSchemas,
  topicSchemas,
  practiceSchemas,
} from "./validation";

describe("Validation", () => {
  describe("authSchemas", () => {
    it("should validate correct login data", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
      };
      const result = validate(authSchemas.login, data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("should reject invalid email", () => {
      const data = {
        email: "invalid-email",
        password: "password123",
      };
      const result = validate(authSchemas.login, data);
      expect(result.success).toBe(false);
    });

    it("should validate registration with matching passwords", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      };
      const result = validate(authSchemas.register, data);
      expect(result.success).toBe(true);
    });

    it("should reject registration with mismatched passwords", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different",
      };
      const result = validate(authSchemas.register, data);
      expect(result.success).toBe(false);
    });
  });

  describe("studyGuideSchemas", () => {
    it("should validate study guide creation", () => {
      const data = {
        title: "My Study Guide",
        originalFilename: "test.txt",
      };
      const result = validate(studyGuideSchemas.create, data);
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const data = {
        title: "",
      };
      const result = validate(studyGuideSchemas.create, data);
      expect(result.success).toBe(false);
    });

    it("should reject title that is too long", () => {
      const data = {
        title: "a".repeat(201),
      };
      const result = validate(studyGuideSchemas.create, data);
      expect(result.success).toBe(false);
    });
  });

  describe("topicSchemas", () => {
    it("should validate topic creation", () => {
      const data = {
        name: "Test Topic",
        description: "A test topic description",
        orderIndex: 0,
      };
      const result = validate(topicSchemas.create, data);
      expect(result.success).toBe(true);
    });

    it("should reject negative order index", () => {
      const data = {
        name: "Test Topic",
        orderIndex: -1,
      };
      const result = validate(topicSchemas.create, data);
      expect(result.success).toBe(false);
    });
  });

  describe("practiceSchemas", () => {
    it("should validate answer submission", () => {
      const data = {
        problemId: 1,
        userAnswer: "Test answer",
        confidenceRating: 2,
      };
      const result = validate(practiceSchemas.submitAnswer, data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid confidence rating", () => {
      const data = {
        problemId: 1,
        userAnswer: "Test answer",
        confidenceRating: 5,
      };
      const result = validate(practiceSchemas.submitAnswer, data);
      expect(result.success).toBe(false);
    });
  });

  describe("validateFileUpload", () => {
    it("should validate correct file", () => {
      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject file that is too large", () => {
      const largeContent = "a".repeat(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], "large.txt", {
        type: "text/plain",
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("exceeds");
    });

    it("should reject unsupported file type", () => {
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not supported");
    });

    it("should reject missing file", () => {
      const result = validateFileUpload(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("No file provided");
    });
  });

  describe("getErrorMessage", () => {
    it("should extract first error message", () => {
      const data = { email: "invalid" };
      const result = validate(authSchemas.login, data);
      if (!result.success) {
        const message = getErrorMessage(result.errors);
        expect(message).toBeTruthy();
        expect(typeof message).toBe("string");
      }
    });
  });
});
