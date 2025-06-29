import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { users, categories, articles, tags } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// 从 .env.local 读取环境变量
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

async function createUser(email: string, password: string, name?: string, role: 'user' | 'admin' = 'user') {
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const newUser = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      name,
      role,
    })
    .returning();

  return newUser[0];
}

console.log('🌱 Starting database seeding...');

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema: { users, categories, articles, tags } });

async function seedDatabase() {
  try {
    console.log('🔗 Connected to database');

    // Create admin user
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    if (!existingAdmin[0]) {
      await createUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'Admin User', 'admin');
      console.log('✅ Admin user created');
    } else {
      console.log('⚠️  Admin user already exists');
    }

    // Create default categories
    const defaultCategories = [
      {
        name: 'Server Deals',
        slug: 'server-deals',
        description: 'Latest server deals and hosting promotions',
        color: '#10B981',
      },
      {
        name: 'AI Tools',
        slug: 'ai-tools',
        description: 'AI tool announcements and updates',
        color: '#8B5CF6',
      },
      {
        name: 'General',
        slug: 'general',
        description: 'General articles and announcements',
        color: '#3B82F6',
      },
    ];

    for (const category of defaultCategories) {
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, category.slug))
        .limit(1);

      if (!existing[0]) {
        await db.insert(categories).values(category);
        console.log(`✅ Category "${category.name}" created`);
      } else {
        console.log(`⚠️  Category "${category.name}" already exists`);
      }
    }

    // Create default tags
    const defaultTags = [
      { name: 'VPS', slug: 'vps' },
      { name: 'Dedicated Server', slug: 'dedicated-server' },
      { name: 'Cloud Hosting', slug: 'cloud-hosting' },
      { name: 'AI', slug: 'ai' },
      { name: 'Machine Learning', slug: 'machine-learning' },
      { name: 'ChatGPT', slug: 'chatgpt' },
      { name: 'OpenAI', slug: 'openai' },
      { name: 'News', slug: 'news' },
      { name: 'Tutorial', slug: 'tutorial' },
      { name: 'Review', slug: 'review' },
    ];

    for (const tag of defaultTags) {
      const existing = await db
        .select()
        .from(tags)
        .where(eq(tags.slug, tag.slug))
        .limit(1);

      if (!existing[0]) {
        await db.insert(tags).values(tag);
        console.log(`✅ Tag "${tag.name}" created`);
      } else {
        console.log(`⚠️  Tag "${tag.name}" already exists`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   👤 Admin user: ${ADMIN_EMAIL}`);
    console.log(`   🔑 Admin password: ${ADMIN_PASSWORD}`);
    console.log('   📁 Categories: Server Deals, AI Tools, General');
    console.log('   🏷️  Tags: VPS, AI, ChatGPT, etc.');
    console.log('');
    console.log('🚀 You can now start the development server with: npm run dev');

    await client.end();
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
