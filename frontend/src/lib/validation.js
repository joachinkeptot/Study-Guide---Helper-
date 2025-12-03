// @ts-nocheck
/**
 * Validation schemas using Zod
 */

import { z } from "zod";

/**
 * Auth validation schemas
 */
export const authSchemas = {
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),

  login: z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
  }),

  register: z
    .object({
      email: z.string().email("Please enter a valid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),
};

/**
 * Study guide validation schemas
 */
export const studyGuideSchemas = {
  create: z.object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    originalFilename: z.string().optional(),
    parsedContent: z.any().optional(),
  }),

  update: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title is too long")
      .optional(),
    parsedContent: z.any().optional(),
  }),
};

/**
 * Topic validation schemas
 */
export const topicSchemas = {
  create: z.object({
    name: z
      .string()
      .min(1, "Topic name is required")
      .max(200, "Name is too long"),
    description: z.string().max(1000, "Description is too long").optional(),
    orderIndex: z.number().int().min(0).optional(),
  }),

  update: z.object({
    name: z
      .string()
      .min(1, "Topic name is required")
      .max(200, "Name is too long")
      .optional(),
    description: z.string().max(1000, "Description is too long").optional(),
    orderIndex: z.number().int().min(0).optional(),
  }),
};

/**
 * File upload validation
 */
export const fileSchemas = {
  upload: z.object({
    file: z.custom((val) => val instanceof File, "File is required"),
    maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
    allowedTypes: z
      .array(z.string())
      .default([
        "text/plain",
        "text/markdown",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]),
  }),
};

/**
 * Practice session validation
 */
export const practiceSchemas = {
  submitAnswer: z.object({
    problemId: z.number().int().positive(),
    userAnswer: z.string().min(1, "Answer is required"),
    confidenceRating: z.number().int().min(1).max(3).optional(),
    hintsUsed: z.array(z.string()).optional(),
  }),

  confidenceRating: z.number().int().min(1).max(3),
};

/**
 * Validate data against a schema
 * @template T
 * @param {z.ZodSchema<T>} schema
 * @param {any} data
 * @returns {{ success: true, data: T } | { success: false, errors: z.ZodError }}
 */
export function validate(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Get user-friendly error message from Zod error
 * @param {z.ZodError} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (!error || !error.errors || error.errors.length === 0) {
    return "Validation failed";
  }
  const firstError = error.errors[0];
  return firstError?.message || "Validation failed";
}

/**
 * Validate file upload
 * @param {File} file
 * @param {number} [maxSize] - Max file size in bytes
 * @param {string[]} [allowedTypes] - Allowed MIME types
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFileUpload(
  file,
  maxSize = 10 * 1024 * 1024,
  allowedTypes = [
    "text/plain",
    "text/markdown",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]
) {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        "File type not supported. Please upload TXT, MD, PDF, or DOCX files.",
    };
  }

  return { valid: true };
}
