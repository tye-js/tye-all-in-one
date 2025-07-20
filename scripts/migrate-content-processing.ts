import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { articles } from '../src/lib/db/schema';
import { contentProcessor } from '../src/lib/content-processor';
import { eq, isNull } from 'drizzle-orm';

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

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

// TypeScript 类型断言，确保 DATABASE_URL 不是 undefined
const dbUrl: string = DATABASE_URL;

async function migrateContentProcessing() {
  try {
    console.log('🔗 Connecting to database...');
    const client = postgres(dbUrl, { prepare: false });
    const db = drizzle(client);

    console.log('📊 Adding new columns to articles table...');
    
    // 添加新列（如果不存在）
    try {
      await client`
        ALTER TABLE articles 
        ADD COLUMN IF NOT EXISTS processed_content TEXT,
        ADD COLUMN IF NOT EXISTS content_metadata JSONB,
        ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
      `;
      console.log('✅ Database schema updated successfully');
    } catch (error) {
      console.log('⚠️  Schema update skipped (columns may already exist)');
    }

    console.log('📝 Finding articles that need processing...');
    
    // 查找需要处理的文章
    const articlesToProcess = await db
      .select({
        id: articles.id,
        title: articles.title,
        content: articles.content,
      })
      .from(articles)
      .where(isNull(articles.processedContent));

    console.log(`📋 Found ${articlesToProcess.length} articles to process`);

    if (articlesToProcess.length === 0) {
      console.log('🎉 All articles are already processed!');
      await client.end();
      return;
    }

    let processed = 0;
    let failed = 0;

    for (const article of articlesToProcess) {
      try {
        console.log(`🔄 Processing: ${article.title}`);
        
        // 处理文章内容
        const result = await contentProcessor.processContent(article.content);
        
        // 更新数据库
        await db
          .update(articles)
          .set({
            processedContent: result.html,
            contentMetadata: result.metadata,
            processedAt: new Date(),
          })
          .where(eq(articles.id, article.id));

        processed++;
        console.log(`✅ Processed: ${article.title}`);
        
        // 显示处理统计
        if (result.metadata.tableOfContents.length > 0) {
          console.log(`   📖 TOC items: ${result.metadata.tableOfContents.length}`);
        }
        console.log(`   📊 Words: ${result.metadata.wordCount}, Reading time: ${result.metadata.readingTime}min`);
        
      } catch (error) {
        failed++;
        console.error(`❌ Failed to process: ${article.title}`, error);
      }
    }

    console.log('\n🎯 Migration Summary:');
    console.log(`   ✅ Successfully processed: ${processed} articles`);
    console.log(`   ❌ Failed: ${failed} articles`);
    console.log(`   📊 Total: ${articlesToProcess.length} articles`);

    if (processed > 0) {
      console.log('\n🚀 Content processing migration completed!');
      console.log('📋 Benefits:');
      console.log('   • Faster page loading (no real-time Markdown processing)');
      console.log('   • Better SEO (pre-rendered HTML content)');
      console.log('   • Improved user experience (instant TOC generation)');
      console.log('   • Reduced server load (cached processed content)');
    }

    await client.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// 运行迁移
console.log('🚀 Starting content processing migration...\n');
migrateContentProcessing();
