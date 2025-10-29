# Security Implementation Guide

## Overview
This document outlines the security measures implemented in the application and best practices for developers.

## Implemented Security Measures

### Phase 1: Critical Security Fixes ✅

#### 1. Role-Based Access Control (RBAC)
- **What**: Implemented proper RBAC using a dedicated `user_roles` table
- **Why**: Prevents privilege escalation attacks
- **How**: 
  - Created `app_role` enum with roles: admin, manager, recruiter, member
  - Created `user_roles` table to store user-company-role relationships
  - Created security definer functions `has_role()` and `has_company_role()` to check permissions
  - Migrated existing `company_users` data to new structure

**Usage Example:**
```sql
-- Check if user has admin role
SELECT public.has_company_role(auth.uid(), company_id, 'admin');
```

#### 2. Profile Visibility Protection
- **What**: Restricted access to sensitive profile data (email, phone, passport)
- **Why**: Protects PII from unauthorized access
- **Implementation**: 
  - Updated profiles SELECT policy to respect `profile_visibility` field
  - Public profiles: basic info only
  - Private profiles: only accessible to companies who have interacted (applications, profile views)
  - Owner always has full access

#### 3. Company Data Protection
- **What**: Restricted company contacts to admin/manager roles only
- **Why**: Prevents unauthorized access to sensitive company information
- **What**: Restricted billing/subscription info to company admins only
- **Why**: Protects financial data

#### 4. Push Notification Security
- **What**: Added explicit RLS policies for push tokens
- **Why**: Prevents unauthorized access to device tokens
- **Implementation**: Separate policies for SELECT, INSERT, UPDATE, DELETE

#### 5. Missing Policies Added
- **What**: Added DELETE policy for messages, INSERT policy for conversations
- **Why**: Complete CRUD operation coverage with proper authorization

#### 6. Authentication Hardening
- **What**: Enabled secure authentication settings
- **Configuration**:
  - Auto-confirm email: enabled (for development/testing)
  - Anonymous users: disabled
  - Signups: enabled

### Input Validation

#### Validation Schemas (`src/lib/validationSchemas.ts`)
Pre-built Zod schemas for all major forms:
- `jobPostSchema`: Job posting validation (titles, descriptions, limits)
- `applicationSchema`: Cover letter validation
- `profileSchema`: User profile validation with URL and phone number formats
- `companyProfileSchema`: Company profile validation
- `contractSchema`: Contract posting validation
- `messageSchema`: Message validation
- `skillSchema`: Skill name validation
- `certificationSchema`: Certification validation

**Usage Example:**
```typescript
import { jobPostSchema } from "@/lib/validationSchemas";

const result = jobPostSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
  console.error(result.error.errors);
  return;
}
// Use validated data
const validatedData = result.data;
```

#### Security Utilities (`src/lib/securityUtils.ts`)
Helper functions for input sanitization:
- `sanitizeText()`: Remove XSS vectors from text input
- `sanitizeUrl()`: Validate and sanitize URLs (only http/https)
- `sanitizeEmail()`: Normalize email addresses
- `sanitizePhone()`: Clean phone number format
- `validateFile()`: Check file type and size
- `rateLimiter`: Client-side rate limiting utility

**Usage Example:**
```typescript
import { sanitizeText, validateFile } from "@/lib/securityUtils";

const cleanBio = sanitizeText(userInput.bio);

const fileValidation = validateFile(uploadedFile, ['pdf', 'doc', 'docx'], 10);
if (!fileValidation.valid) {
  toast.error(fileValidation.error);
  return;
}
```

## Database Security Architecture

### Security Definer Functions
Functions that run with elevated privileges to prevent RLS recursion:
- `public.has_role(_user_id, _role)`: Check if user has a specific role
- `public.has_company_role(_user_id, _company_id, _role)`: Check company-specific role

**Important**: These functions bypass RLS, so they must be carefully designed to prevent security issues.

### RLS Policy Patterns

#### Pattern 1: Owner Access
```sql
CREATE POLICY "Users can view own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);
```

#### Pattern 2: Role-Based Access
```sql
CREATE POLICY "Admins can manage data"
ON table_name FOR ALL
USING (public.has_company_role(auth.uid(), company_id, 'admin'));
```

#### Pattern 3: Visibility-Based Access
```sql
CREATE POLICY "Respect visibility settings"
ON profiles FOR SELECT
USING (
  auth.uid() = id OR
  profile_visibility = 'public' OR
  (profile_visibility = 'private' AND has_interacted())
);
```

## Best Practices for Developers

### 1. Always Validate Input
```typescript
// ❌ Bad: No validation
const { data } = await supabase.from('jobs').insert({ title: userInput });

// ✅ Good: Validate first
const result = jobPostSchema.safeParse(userInput);
if (!result.success) {
  throw new Error("Invalid input");
}
const { data } = await supabase.from('jobs').insert(result.data);
```

### 2. Never Trust Client Data
- All validation must happen on both client AND server
- Use database constraints and RLS policies
- Sanitize all user inputs

### 3. Use Proper Error Messages
```typescript
// ❌ Bad: Exposes internal details
catch (error) {
  toast.error(error.message);
}

// ✅ Good: Generic message
catch (error) {
  console.error('Error:', error); // Log for debugging
  toast.error('An error occurred. Please try again.');
}
```

### 4. Implement Rate Limiting
```typescript
import { rateLimiter } from "@/lib/securityUtils";

// Allow max 5 job posts per minute
if (!rateLimiter.check(`job-post-${userId}`, 5, 60000)) {
  toast.error("Too many requests. Please wait.");
  return;
}
```

### 5. Secure File Uploads
```typescript
const validation = validateFile(file, ['pdf', 'doc', 'docx'], 10);
if (!validation.valid) {
  toast.error(validation.error);
  return;
}

// Use authenticated upload
const { error } = await supabase.storage
  .from('secure-bucket')
  .upload(`${userId}/${uniqueFilename}`, file);
```

## Security Checklist for New Features

- [ ] Input validation with Zod schemas
- [ ] RLS policies for all database operations
- [ ] Proper error handling (no internal details exposed)
- [ ] File upload validation (type, size)
- [ ] Rate limiting for sensitive operations
- [ ] Role-based access control where needed
- [ ] Sanitization of user inputs
- [ ] Test with different user roles
- [ ] Verify no PII is exposed

## Remaining Security Tasks

### Phase 2: High Priority (Recommended)
- [ ] Add audit logging for sensitive operations
- [ ] Implement comprehensive rate limiting on edge functions
- [ ] Add CORS restrictions to specific domains
- [ ] Add request validation schemas to all edge functions

### Phase 3: Security Hardening
- [ ] Implement user data export (GDPR compliance)
- [ ] Add data deletion capabilities
- [ ] Set up security monitoring and alerting
- [ ] Regular security scans and penetration testing

## Reporting Security Issues

If you discover a security vulnerability:
1. Do NOT create a public GitHub issue
2. Contact the security team directly
3. Provide detailed reproduction steps
4. Wait for acknowledgment before disclosure

## Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Zod Documentation](https://zod.dev/)
