// Security utilities for input sanitization and validation

/**
 * Sanitize text input by trimming and removing potential XSS vectors
 */
export const sanitizeText = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove inline event handlers
};

/**
 * Sanitize URL to prevent XSS and ensure it's a valid HTTP(S) URL
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  const trimmed = url.trim();
  
  // Only allow http and https protocols
  if (!trimmed.match(/^https?:\/\//i)) {
    return '';
  }
  
  // Remove any javascript: or data: URIs that might have been encoded
  if (trimmed.match(/javascript:|data:/i)) {
    return '';
  }
  
  return trimmed;
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Validate file type and size for uploads
 */
export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { valid: boolean; error?: string } => {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Rate limiting helper - tracks action timestamps
 */
class RateLimiter {
  private actions: Map<string, number[]> = new Map();

  check(key: string, maxActions: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.actions.get(key) || [];
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (validTimestamps.length >= maxActions) {
      return false;
    }
    
    validTimestamps.push(now);
    this.actions.set(key, validTimestamps);
    return true;
  }

  reset(key: string): void {
    this.actions.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Sanitize phone number to standard format
 */
export const sanitizePhone = (phone: string): string => {
  // Remove all non-digit and non-plus characters
  return phone.replace(/[^\d+\s()-]/g, '').trim();
};

/**
 * Validate and limit array length
 */
export const validateArrayLength = <T>(
  array: T[],
  maxLength: number,
  fieldName: string
): { valid: boolean; error?: string } => {
  if (array.length > maxLength) {
    return {
      valid: false,
      error: `Maximum ${maxLength} ${fieldName} allowed`,
    };
  }
  return { valid: true };
};
