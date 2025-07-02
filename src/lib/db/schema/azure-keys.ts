import { pgTable, text, varchar, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

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

export type AzureKey = typeof azureKeys.$inferSelect;
export type NewAzureKey = typeof azureKeys.$inferInsert;
