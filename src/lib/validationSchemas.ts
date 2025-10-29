import { z } from "zod";

// Security: Input validation schemas with length limits and sanitization

export const jobPostSchema = z.object({
  title: z.string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),
  location: z.string()
    .trim()
    .min(2, "Location must be at least 2 characters")
    .max(200, "Location must be less than 200 characters"),
  salary_min: z.number()
    .int()
    .min(0, "Salary must be positive")
    .max(10000000, "Salary exceeds maximum")
    .optional()
    .nullable(),
  salary_max: z.number()
    .int()
    .min(0, "Salary must be positive")
    .max(10000000, "Salary exceeds maximum")
    .optional()
    .nullable(),
  skills: z.array(z.string().max(50))
    .max(20, "Maximum 20 skills allowed"),
  certifications: z.array(z.string().max(100))
    .max(10, "Maximum 10 certifications allowed"),
});

export const applicationSchema = z.object({
  cover_letter: z.string()
    .trim()
    .max(2000, "Cover letter must be less than 2000 characters")
    .optional(),
});

export const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  bio: z.string()
    .trim()
    .max(1000, "Bio must be less than 1000 characters")
    .optional(),
  location: z.string()
    .trim()
    .max(200, "Location must be less than 200 characters")
    .optional(),
  phone: z.string()
    .trim()
    .max(20, "Phone must be less than 20 characters")
    .regex(/^[+\d\s()-]*$/, "Invalid phone number format")
    .optional(),
  linkedin_url: z.string()
    .trim()
    .url("Invalid URL format")
    .max(200, "URL too long")
    .optional()
    .or(z.literal("")),
  facebook_url: z.string()
    .trim()
    .url("Invalid URL format")
    .max(200, "URL too long")
    .optional()
    .or(z.literal("")),
  instagram_url: z.string()
    .trim()
    .url("Invalid URL format")
    .max(200, "URL too long")
    .optional()
    .or(z.literal("")),
});

export const companyProfileSchema = z.object({
  company_name: z.string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must be less than 100 characters"),
  description: z.string()
    .trim()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  location: z.string()
    .trim()
    .max(200, "Location must be less than 200 characters")
    .optional(),
  website: z.string()
    .trim()
    .url("Invalid URL format")
    .max(200, "URL too long")
    .optional()
    .or(z.literal("")),
  contact_email: z.string()
    .trim()
    .email("Invalid email format")
    .max(255, "Email too long")
    .optional()
    .or(z.literal("")),
  contact_phone: z.string()
    .trim()
    .max(20, "Phone must be less than 20 characters")
    .regex(/^[+\d\s()-]*$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
});

export const contractSchema = z.object({
  title: z.string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),
  location: z.string()
    .trim()
    .min(2, "Location must be at least 2 characters")
    .max(200, "Location must be less than 200 characters"),
  equipment_needed: z.string()
    .trim()
    .max(1000, "Equipment description must be less than 1000 characters")
    .optional(),
  budget_range: z.string()
    .trim()
    .max(100, "Budget range must be less than 100 characters")
    .optional(),
});

export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must be less than 5000 characters"),
});

export const skillSchema = z.object({
  skill_name: z.string()
    .trim()
    .min(2, "Skill name must be at least 2 characters")
    .max(50, "Skill name must be less than 50 characters"),
});

export const certificationSchema = z.object({
  certification_name: z.string()
    .trim()
    .min(2, "Certification name must be at least 2 characters")
    .max(100, "Certification name must be less than 100 characters"),
  issuer: z.string()
    .trim()
    .max(100, "Issuer name must be less than 100 characters")
    .optional(),
});
