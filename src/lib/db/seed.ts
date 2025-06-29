import { db } from './index';
import { users, categories, articles, tags } from './schema';
import { createUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (!existingAdmin[0]) {
      await createUser(adminEmail, adminPassword, 'Admin User', 'admin');
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
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
        console.log(`Category "${category.name}" created`);
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
        console.log(`Tag "${tag.name}" created`);
      }
    }

    // Create sample articles
    const admin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    const serverDealsCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, 'server-deals'))
      .limit(1);

    const aiToolsCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, 'ai-tools'))
      .limit(1);

    if (admin[0] && serverDealsCategory[0] && aiToolsCategory[0]) {
      const sampleArticles = [
        {
          title: 'Amazing VPS Deal: 50% Off for New Customers',
          slug: 'amazing-vps-deal-50-off',
          excerpt: 'Get 50% off on premium VPS hosting for the first 6 months. Limited time offer!',
          content: `# Amazing VPS Deal: 50% Off for New Customers

We're excited to announce an incredible deal for new customers! Get 50% off on all our premium VPS hosting plans for the first 6 months.

## What's Included:
- High-performance SSD storage
- 24/7 customer support
- 99.9% uptime guarantee
- Free SSL certificates
- Daily backups

## How to Claim:
1. Sign up for a new account
2. Choose your preferred VPS plan
3. Use code: **SAVE50**
4. Enjoy 6 months at half price!

*Offer valid until the end of this month. Terms and conditions apply.*`,
          status: 'published' as const,
          category: 'server_deals' as const,
          categoryId: serverDealsCategory[0].id,
          authorId: admin[0].id,
          publishedAt: new Date(),
        },
        {
          title: 'ChatGPT-4 Turbo: New Features and Improvements',
          slug: 'chatgpt-4-turbo-new-features',
          excerpt: 'OpenAI releases ChatGPT-4 Turbo with enhanced capabilities and faster response times.',
          content: `# ChatGPT-4 Turbo: New Features and Improvements

OpenAI has just released ChatGPT-4 Turbo, bringing significant improvements to the popular AI assistant.

## Key Features:
- **Faster Response Times**: Up to 3x faster than the previous version
- **Enhanced Context Window**: Now supports up to 128k tokens
- **Improved Accuracy**: Better understanding of complex queries
- **Multimodal Capabilities**: Enhanced image and text processing

## What This Means for Users:
The new version offers a more responsive and capable AI assistant that can handle longer conversations and more complex tasks.

## Availability:
ChatGPT-4 Turbo is now available to ChatGPT Plus subscribers and through the OpenAI API.`,
          status: 'published' as const,
          category: 'ai_tools' as const,
          categoryId: aiToolsCategory[0].id,
          authorId: admin[0].id,
          publishedAt: new Date(),
        },
      ];

      for (const article of sampleArticles) {
        const existing = await db
          .select()
          .from(articles)
          .where(eq(articles.slug, article.slug))
          .limit(1);

        if (!existing[0]) {
          await db.insert(articles).values(article);
          console.log(`Article "${article.title}" created`);
        }
      }
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };
