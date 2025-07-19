import { z } from 'zod';

// Auth schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Article schemas
export const articleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(255, 'Slug too long'),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  featuredImage: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  category: z.enum(['server_deals', 'ai_tools', 'general']),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export const createArticleSchema = articleSchema.omit({ 
  publishedAt: true 
});

export const updateArticleSchema = articleSchema.partial();

// Category schemas
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

// Tag schemas
export const tagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(50, 'Slug too long'),
});

// TTS schemas
export const ttsRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000, 'Text too long'),
  language: z.string().default('en-US'),
  voice: z.string().default('en-US-Standard-A'),
  speakingRate: z.number().min(0.25).max(4.0).optional(),
  pitch: z.number().min(-20.0).max(20.0).optional(),
  useSSML: z.boolean().optional().default(false),
});

// Search schemas
export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.enum(['server_deals', 'ai_tools', 'general', 'all']).optional(),
  status: z.enum(['draft', 'published', 'archived', 'all']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'title', 'viewCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.any(),
  type: z.enum(['image', 'audio', 'document']).optional(),
});

// User profile schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  avatar: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Utility functions
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isValidImageType(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
}

export function isValidAudioType(mimeType: string): boolean {
  return ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'].includes(mimeType);
}
