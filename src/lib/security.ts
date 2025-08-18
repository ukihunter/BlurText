import Joi from "joi";
import validator from "validator";

// Validation schemas
export const authValidation = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      "string.alphanum": "Username must contain only alphanumeric characters",
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username must not exceed 30 characters",
    }),
    password: Joi.string()
      .min(6)
      .max(128)
      .pattern(/^(?=.*[a-zA-Z])(?=.*\d).*$/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must contain at least one letter and one number",
        "string.min": "Password must be at least 6 characters long",
        "string.max": "Password must not exceed 128 characters",
      }),
  }),

  login: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(1).max(128).required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(6)
      .max(128)
      .pattern(/^(?=.*[a-zA-Z])(?=.*\d).*$/)
      .required()
      .messages({
        "string.pattern.base":
          "New password must contain at least one letter and one number",
        "string.min": "New password must be at least 6 characters long",
      }),
  }),
};

export const contentValidation = {
  post: Joi.object({
    content: Joi.string().min(1).max(2000).required().messages({
      "string.max": "Post content must not exceed 2000 characters",
    }),
    mediaUrls: Joi.array().items(Joi.string().uri()).max(4).optional(),
  }),

  message: Joi.object({
    chatId: Joi.string().required(),
    content: Joi.string().min(1).max(1000).required().messages({
      "string.max": "Message content must not exceed 1000 characters",
    }),
    messageType: Joi.string().valid("text", "emoji").default("text"),
  }),

  profile: Joi.object({
    interests: Joi.array().items(Joi.string().max(50)).max(20).optional(),
    completeOnboarding: Joi.boolean().optional(),
    displayName: Joi.string().max(50).optional().allow(""),
    anonymitySettings: Joi.object({
      hideOnlineStatus: Joi.boolean().default(false),
      enableDisappearingMessages: Joi.boolean().default(false),
      autoDeleteMessages: Joi.boolean().default(false),
      blockScreenshots: Joi.boolean().default(false),
      enableTwoFactor: Joi.boolean().default(false),
    }).optional(),
  }),
};

// Sanitization functions
export const sanitizeInput = {
  text: (input: string): string => {
    if (!input || typeof input !== "string") return "";

    // Remove null bytes and other dangerous characters
    let sanitized = input.replace(/\0/g, "");

    // Remove script tags and other dangerous HTML
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
    sanitized = sanitized.replace(
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      ""
    );
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");

    // Validate and escape
    sanitized = validator.escape(sanitized);

    return sanitized.trim();
  },

  html: (input: string): string => {
    if (!input || typeof input !== "string") return "";

    // Simple HTML sanitization - remove dangerous tags and attributes
    let sanitized = input.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
    sanitized = sanitized.replace(
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      ""
    );
    sanitized = sanitized.replace(
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      ""
    );
    sanitized = sanitized.replace(
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      ""
    );
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");

    return sanitized.trim();
  },

  mongodbId: (input: string): string => {
    if (!input || typeof input !== "string") return "";

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(input)) {
      throw new Error("Invalid ID format");
    }

    return input;
  },

  username: (input: string): string => {
    if (!input || typeof input !== "string") return "";

    // Only allow alphanumeric characters
    const sanitized = input.replace(/[^a-zA-Z0-9]/g, "");

    if (sanitized.length < 3 || sanitized.length > 30) {
      throw new Error("Username must be between 3 and 30 characters");
    }

    return sanitized.toLowerCase();
  },
};

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = {
  check: (
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 900000
  ): boolean => {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false; // Rate limit exceeded
    }

    record.count++;
    return true;
  },

  reset: (identifier: string): void => {
    rateLimitStore.delete(identifier);
  },
};

// Security headers
export const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    process.env.NODE_ENV === "development"
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss:; font-src 'self'"
      : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'",
};

// File upload validation
export const validateFile = {
  image: (
    file: File | Buffer,
    filename?: string
  ): { valid: boolean; error?: string } => {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || "5") * 1024 * 1024; // Default 5MB
    const allowedTypes = (
      process.env.ALLOWED_FILE_TYPES ||
      "image/jpeg,image/png,image/gif,image/webp"
    ).split(",");

    if (file instanceof File) {
      if (file.size > maxSize) {
        return {
          valid: false,
          error: "File size exceeds maximum allowed size",
        };
      }

      if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: "File type not allowed" };
      }
    } else if (Buffer.isBuffer(file)) {
      if (file.length > maxSize) {
        return {
          valid: false,
          error: "File size exceeds maximum allowed size",
        };
      }

      // For buffer, we'd need to check file signature/magic numbers
      // This is a simplified check
      if (filename) {
        const ext = filename.toLowerCase().split(".").pop();
        const validExts = ["jpg", "jpeg", "png", "gif", "webp"];
        if (!ext || !validExts.includes(ext)) {
          return { valid: false, error: "File extension not allowed" };
        }
      }
    }

    return { valid: true };
  },
};

// Error response helper
export const createErrorResponse = (
  message: string,
  status: number = 400,
  includeDetails: boolean = false
) => {
  const response: { error: string; timestamp: string; details?: string } = {
    error: message,
    timestamp: new Date().toISOString(),
  };

  // Only include detailed errors in development
  if (includeDetails && process.env.NODE_ENV === "development") {
    response.details = message;
  }

  return Response.json(response, { status });
};

// CSRF token generation and validation
export const csrf = {
  generate: (): string => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  },

  validate: (token: string, storedToken: string): boolean => {
    return token === storedToken && token.length >= 20;
  },
};
