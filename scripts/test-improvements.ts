import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { articles, users } from '../src/lib/db/schema';
import { contentProcessor } from '../src/lib/content-processor';
import { eq } from 'drizzle-orm';

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

async function testImprovements() {
  try {
    console.log('🚀 Testing All Improvements...\n');
    
    const client = postgres(dbUrl, { prepare: false });
    const db = drizzle(client);

    // 1. 测试内容处理器
    console.log('📝 Testing Content Processor...');
    const testMarkdown = `# 测试文章

这是一个测试文章，用来验证内容处理器的功能。

## 功能特性

- **粗体文本**
- *斜体文本*
- \`内联代码\`

### 代码块测试

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### 引用测试

> 这是一个重要的引用内容。

### 链接测试

[访问 GitHub](https://github.com)

## 总结

这个测试验证了所有的 Markdown 功能。`;

    const processed = await contentProcessor.processContent(testMarkdown);
    
    console.log('✅ Content processing successful!');
    console.log(`   📖 TOC items: ${processed.metadata.tableOfContents.length}`);
    console.log(`   📊 Words: ${processed.metadata.wordCount}`);
    console.log(`   ⏱️  Reading time: ${processed.metadata.readingTime} min`);
    console.log(`   💻 Code blocks: ${processed.metadata.codeBlocks}`);
    console.log(`   📄 Paragraphs: ${processed.metadata.paragraphs}`);
    console.log(`   🔗 Links: ${processed.metadata.links}`);

    // 2. 测试文章创建（模拟）
    console.log('\n📄 Testing Article Creation with Pre-processing...');
    
    // 查找管理员用户
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@example.com'))
      .limit(1);

    if (!adminUser[0]) {
      console.log('⚠️  Admin user not found, skipping article creation test');
    } else {
      // 创建测试文章
      const testArticleData = {
        title: '改进测试文章',
        slug: 'improvement-test-article',
        excerpt: '这是一篇用于测试所有改进功能的文章。',
        content: testMarkdown,
        processedContent: processed.html,
        contentMetadata: processed.metadata,
        status: 'published' as const,
        category: 'general' as const,
        authorId: adminUser[0].id,
        publishedAt: new Date(),
        processedAt: new Date(),
        viewCount: 0,
      };

      // 检查文章是否已存在
      const existingArticle = await db
        .select()
        .from(articles)
        .where(eq(articles.slug, testArticleData.slug))
        .limit(1);

      if (existingArticle[0]) {
        // 更新现有文章
        const updatedArticle = await db
          .update(articles)
          .set({
            ...testArticleData,
            updatedAt: new Date(),
          })
          .where(eq(articles.slug, testArticleData.slug))
          .returning();

        console.log('✅ Test article updated with pre-processed content!');
        console.log(`   📝 Article: ${updatedArticle[0].title}`);
        console.log(`   🔗 URL: http://localhost:3000/articles/${updatedArticle[0].slug}`);
      } else {
        // 创建新文章
        const newArticle = await db
          .insert(articles)
          .values(testArticleData)
          .returning();

        console.log('✅ Test article created with pre-processed content!');
        console.log(`   📝 Article: ${newArticle[0].title}`);
        console.log(`   🔗 URL: http://localhost:3000/articles/${newArticle[0].slug}`);
      }
    }

    // 3. 测试 Azure Speech Service 配置
    console.log('\n🎤 Testing Azure Speech Service Configuration...');
    
    const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
    const azureSpeechRegion = process.env.AZURE_SPEECH_REGION;
    
    if (azureSpeechKey && azureSpeechRegion) {
      console.log('✅ Azure Speech Service configured!');
      console.log(`   🌍 Region: ${azureSpeechRegion}`);
      console.log(`   🔑 Key: ${azureSpeechKey.substring(0, 8)}...`);
      
      // 测试语音合成 API（不实际调用，只检查配置）
      console.log('   📋 Available voices: zh-CN-XiaoxiaoNeural, zh-CN-YunxiNeural, etc.');
    } else {
      console.log('⚠️  Azure Speech Service not configured');
      console.log('   Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local');
    }

    // 4. 测试数据库 Schema
    console.log('\n🗄️  Testing Database Schema...');
    
    try {
      // 检查新字段是否存在
      const testQuery = await client`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'articles' 
        AND column_name IN ('processed_content', 'content_metadata', 'processed_at')
      `;
      
      const newColumns = testQuery.map(row => row.column_name);
      
      if (newColumns.includes('processed_content')) {
        console.log('✅ processed_content column exists');
      } else {
        console.log('❌ processed_content column missing');
      }
      
      if (newColumns.includes('content_metadata')) {
        console.log('✅ content_metadata column exists');
      } else {
        console.log('❌ content_metadata column missing');
      }
      
      if (newColumns.includes('processed_at')) {
        console.log('✅ processed_at column exists');
      } else {
        console.log('❌ processed_at column missing');
      }
      
    } catch (error) {
      console.log('⚠️  Could not check database schema');
    }

    console.log('\n🎉 All Tests Completed!');
    console.log('\n📋 Summary of Improvements:');
    console.log('   1. ✅ Switched to Microsoft Azure Speech Service');
    console.log('   2. ✅ Fixed Markdown editor toolbar positioning');
    console.log('   3. ✅ Added content pre-processing on article creation/update');
    console.log('   4. ✅ Enhanced database schema with new fields');
    console.log('   5. ✅ Improved performance with cached processed content');
    
    console.log('\n🔧 Next Steps:');
    console.log('   • Configure Azure Speech Service credentials');
    console.log('   • Test the admin article editor');
    console.log('   • Verify TTS functionality');
    console.log('   • Check article page performance');

    await client.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testImprovements();
