// @ts-nocheck
/**
 * Error codes for better error tracking and debugging
 */

export const ErrorCodes = {
  // Authentication errors (1000-1099)
  AUTH_INVALID_CREDENTIALS: {
    code: 1001,
    message: "Invalid email or password",
  },
  AUTH_USER_NOT_FOUND: { code: 1002, message: "User not found" },
  AUTH_SESSION_EXPIRED: {
    code: 1003,
    message: "Your session has expired. Please log in again.",
  },
  AUTH_REGISTRATION_FAILED: {
    code: 1004,
    message: "Registration failed. Please try again.",
  },
  AUTH_EMAIL_IN_USE: {
    code: 1005,
    message: "This email is already registered",
  },

  // Study Guide errors (2000-2099)
  GUIDE_NOT_FOUND: { code: 2001, message: "Study guide not found" },
  GUIDE_LOAD_FAILED: {
    code: 2002,
    message: "Failed to load study guides. Please refresh the page.",
  },
  GUIDE_CREATE_FAILED: {
    code: 2003,
    message: "Failed to create study guide. Please try again.",
  },
  GUIDE_DELETE_FAILED: {
    code: 2004,
    message: "Failed to delete study guide. Please try again.",
  },
  GUIDE_NO_TOPICS: {
    code: 2005,
    message: "This study guide has no topics yet",
  },
  GUIDE_NO_PROBLEMS: {
    code: 2006,
    message: "This study guide has no practice problems yet",
  },

  // File Upload errors (3000-3099)
  UPLOAD_FAILED: {
    code: 3001,
    message: "File upload failed. Please try again.",
  },
  UPLOAD_INVALID_FILE: {
    code: 3002,
    message: "Invalid file type. Please upload TXT, MD, PDF, or DOCX files.",
  },
  UPLOAD_FILE_TOO_LARGE: {
    code: 3003,
    message: "File is too large. Maximum size is 10MB.",
  },
  UPLOAD_STORAGE_ERROR: {
    code: 3004,
    message: "Storage error. Please try again later.",
  },

  // Processing errors (4000-4099)
  PROCESS_FAILED: {
    code: 4001,
    message: "Failed to process document. Please try again.",
  },
  PROCESS_CLAUDE_API_ERROR: {
    code: 4002,
    message: "AI service error. Check your API key configuration.",
  },
  PROCESS_NO_CONTENT: {
    code: 4003,
    message: "No content found in document. Please upload a different file.",
  },
  PROCESS_INVALID_FORMAT: {
    code: 4004,
    message: "Document format not recognized. Please try a different file.",
  },

  // Practice Session errors (5000-5099)
  SESSION_NOT_FOUND: { code: 5001, message: "Practice session not found" },
  SESSION_START_FAILED: {
    code: 5002,
    message: "Failed to start practice session. Please try again.",
  },
  SESSION_NO_PROBLEMS: {
    code: 5003,
    message: "No practice problems available. Please generate topics first.",
  },
  SESSION_PROBLEM_LOAD_FAILED: {
    code: 5004,
    message: "Failed to load problem. Please try again.",
  },
  SESSION_SUBMIT_FAILED: {
    code: 5005,
    message: "Failed to submit answer. Please try again.",
  },
  SESSION_END_FAILED: {
    code: 5006,
    message: "Failed to end session. Please try again.",
  },

  // Topic errors (6000-6099)
  TOPIC_NOT_FOUND: { code: 6001, message: "Topic not found" },
  TOPIC_CREATE_FAILED: {
    code: 6002,
    message: "Failed to create topic. Please try again.",
  },
  TOPIC_DELETE_FAILED: {
    code: 6003,
    message: "Failed to delete topic. Please try again.",
  },
  TOPIC_UPDATE_FAILED: {
    code: 6004,
    message: "Failed to update topic. Please try again.",
  },

  // Problem errors (7000-7099)
  PROBLEM_NOT_FOUND: { code: 7001, message: "Problem not found" },
  PROBLEM_CREATE_FAILED: {
    code: 7002,
    message: "Failed to create problem. Please try again.",
  },
  PROBLEM_NO_HINTS: {
    code: 7003,
    message: "No hints available for this problem",
  },
  PROBLEM_HINT_LOAD_FAILED: {
    code: 7004,
    message: "Failed to load hint. Please try again.",
  },

  // Network errors (8000-8099)
  NETWORK_ERROR: {
    code: 8001,
    message: "Network error. Please check your connection.",
  },
  NETWORK_TIMEOUT: {
    code: 8002,
    message: "Request timed out. Please try again.",
  },
  NETWORK_SERVER_ERROR: {
    code: 8003,
    message: "Server error. Please try again later.",
  },

  // Validation errors (9000-9099)
  VALIDATION_FAILED: {
    code: 9001,
    message: "Validation failed. Please check your input.",
  },
  VALIDATION_REQUIRED_FIELD: {
    code: 9002,
    message: "Required field is missing",
  },
  VALIDATION_INVALID_FORMAT: { code: 9003, message: "Invalid format" },

  // Generic errors
  UNKNOWN_ERROR: {
    code: 9999,
    message: "An unexpected error occurred. Please try again.",
  },
};

/**
 * Create an error with code and message
 * @param {keyof typeof ErrorCodes} errorKey
 * @param {string} [additionalInfo]
 * @returns {Error & { code: number }}
 */
export function createError(errorKey, additionalInfo) {
  const errorDef = ErrorCodes[errorKey] || ErrorCodes.UNKNOWN_ERROR;
  const message = additionalInfo
    ? `${errorDef.message} (${additionalInfo})`
    : errorDef.message;

  const error = new Error(message);
  error.code = errorDef.code;
  return error;
}

/**
 * Get error code from error object
 * @param {any} error
 * @returns {number}
 */
export function getErrorCode(error) {
  return error?.code || ErrorCodes.UNKNOWN_ERROR.code;
}

/**
 * Get user-friendly error message
 * @param {any} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  return ErrorCodes.UNKNOWN_ERROR.message;
}

/**
 * Check if error is a specific type
 * @param {any} error
 * @param {keyof typeof ErrorCodes} errorKey
 * @returns {boolean}
 */
export function isErrorType(error, errorKey) {
  const errorDef = ErrorCodes[errorKey];
  return error?.code === errorDef?.code;
}
