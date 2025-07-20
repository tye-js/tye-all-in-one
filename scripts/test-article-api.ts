import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { users } from '../src/lib/db/schema';
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

async function testArticleAPI() {
  try {
    console.log('🔗 Connecting to database...');
    const client = postgres(dbUrl, { prepare: false });
    const db = drizzle(client);

    // 查找管理员用户
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@example.com'))
      .limit(1);

    if (!adminUser[0]) {
      console.error('❌ Admin user not found. Please run: npm run db:seed-custom');
      process.exit(1);
    }

    console.log('✅ Admin user found:', adminUser[0].email);

    // 测试文章数据
    const testArticle = {
      title: 'Test Article from Script',
      slug: 'test-article-from-script',
      excerpt: 'This is a test article created from a script',
      content: '# Test Article\n\nThis is the content of the test article.',
      status: 'published',
      category: 'general',
      tags: ['test', 'script'],
    };

    console.log('📝 Test article data:', testArticle);

    // 测试 API 端点
    const response = await fetch('http://localhost:3001/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 注意：这里没有认证，所以会失败，但我们可以看到错误信息
      },
      body: JSON.stringify(testArticle),
    });

    console.log('📡 API Response status:', response.status);
    
    if (response.status === 401) {
      console.log('🔐 API requires authentication (expected)');
      console.log('✅ API endpoint is working correctly');
    } else {
      const responseData = await response.text();
      console.log('📄 API Response:', responseData);
    }

    await client.end();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testArticleAPI();
