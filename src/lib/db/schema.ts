import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const articleStatusEnum = pgEnum('article_status', ['draft', 'published', 'archived']);
export const articleCategoryEnum = pgEnum('article_category', ['server_deals', 'ai_tools', 'general']);
export const ttsStatusEnum = pgEnum('tts_status', ['pending', 'processing', 'completed', 'failed']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  password: text('password'),
  role: userRoleEnum('role').default('user').notNull(),
  avatar: text('avatar'),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // hex color
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tags table
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Articles table
export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  processedContent: text('processed_content'), // 预处理的 HTML 内容
  contentMetadata: jsonb('content_metadata'), // 内容元数据（目录、字数等）
  featuredImage: text('featured_image'),
  status: articleStatusEnum('status').default('draft').notNull(),
  category: articleCategoryEnum('category').default('general').notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  publishedAt: timestamp('published_at'),
  processedAt: timestamp('processed_at'), // 内容处理时间
  viewCount: integer('view_count').default(0).notNull(),
  metadata: jsonb('metadata'), // For SEO and additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Article tags junction table
export const articleTags = pgTable('article_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
});

// TTS Voices table - stores available voices from Azure
export const ttsVoices = pgTable('tts_voices', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(), // e.g., zh-CN-XiaoxiaoNeural
  displayName: varchar('display_name', { length: 200 }).notNull(), // e.g., 晓晓 (女声, 温柔)
  localName: varchar('local_name', { length: 200 }).notNull(), // e.g., Conrad
  shortName: varchar('short_name', { length: 100 }).notNull(), // e.g., Xiaoxiao
  gender: varchar('gender', { length: 10 }).notNull(), // Male, Female
  locale: varchar('locale', { length: 20 }).notNull(), // e.g., zh-CN-guangxi
  localeName: varchar('locale_name', { length: 100 }).notNull(), // e.g., Chinese (Mainland)
  voiceType: varchar('voice_type', { length: 50 }).notNull(), // Neural, Standard
  status: varchar('status', { length: 20 }).default('GA').notNull(), // GA, Preview
  styleList: jsonb('style_list'), // e.g., ['cheerful', 'sad']
  voiceTag: jsonb('voice_tag'), // e.g., { TailoredScenarios: [...], VoicePersonalities: [...] }
  sampleRateHertz: varchar('sample_rate_hertz', { length: 50 }), // e.g., 24000
  wordsPerMinute: varchar('words_per_minute', { length: 50 }), // e.g., 180
  isActive: boolean('is_active').default(true).notNull(),
  lastSyncAt: timestamp('last_sync_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Text-to-Speech requests table
export const ttsRequests = pgTable('tts_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  text: text('text').notNull(),
  language: varchar('language', { length: 10 }).default('en-US').notNull(),
  voice: varchar('voice', { length: 50 }).default('en-US-Standard-A').notNull(),
  audioUrl: text('audio_url'),
  status: ttsStatusEnum('status').default('pending').notNull(),
  errorMessage: text('error_message'),
  duration: integer('duration'), // in seconds
  fileSize: integer('file_size'), // in bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Media files table
export const mediaFiles = pgTable('media_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Azure Speech Keys table
export const azureKeys = pgTable('azure_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 密钥名称/描述
  speechKey: text('speech_key').notNull(), // Azure Speech API Key
  speechRegion: varchar('speech_region', { length: 50 }).notNull(), // Azure Speech Region
  totalQuota: integer('total_quota').notNull().default(2000000), // 总配额（字符数）
  usedQuota: integer('used_quota').notNull().default(0), // 已使用配额
  isActive: boolean('is_active').notNull().default(true), // 是否激活
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'), // 最后使用时间
  notes: text('notes'), // 备注
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  ttsRequests: many(ttsRequests),
  mediaFiles: many(mediaFiles),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articleTags: many(articleTags),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  articleTags: many(articleTags),
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}));

export const ttsVoicesRelations = relations(ttsVoices, ({ many }) => ({
  // 可以添加与其他表的关系，比如使用统计等
}));

export const ttsRequestsRelations = relations(ttsRequests, ({ one }) => ({
  user: one(users, {
    fields: [ttsRequests.userId],
    references: [users.id],
  }),
}));

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [mediaFiles.uploadedBy],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type TTSVoice = typeof ttsVoices.$inferSelect;
export type NewTTSVoice = typeof ttsVoices.$inferInsert;
export type TTSRequest = typeof ttsRequests.$inferSelect;
export type NewTTSRequest = typeof ttsRequests.$inferInsert;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type NewMediaFile = typeof mediaFiles.$inferInsert;
export type AzureKey = typeof azureKeys.$inferSelect;
export type NewAzureKey = typeof azureKeys.$inferInsert;
