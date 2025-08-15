import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

export interface EncryptedImageData {
  data: string;
  iv: string;
  key: string;
  filename: string;
  mimetype: string;
  size: number;
}

// Encrypt image data
export const encryptImageData = (
  base64Data: string
): { encryptedData: string; iv: string; key: string } => {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(base64Data, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    key: key.toString("hex"),
  };
};

// Decrypt image data
export const decryptImageData = (
  encryptedData: string,
  key: string,
  iv: string
): string => {
  const keyBuffer = Buffer.from(key, "hex");
  const ivBuffer = Buffer.from(iv, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

// Validate image file
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB limit

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File too large. Maximum size is 5MB." };
  }

  return { valid: true };
};
