import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { users, articles, categories, tags, articleTags } from '../src/lib/db/schema';
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

async function testArticlePage() {
  try {
    console.log('🔗 Connecting to database...');
    const client = postgres(dbUrl, { prepare: false });
    const db = drizzle(client);

    console.log('📝 Creating comprehensive test article...');

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

    // 创建一个包含各种 Markdown 元素的测试文章
    const comprehensiveContent = `# 完整功能测试文章

这是一篇用于测试文章页面所有功能的综合性文章。

## 📋 测试内容概览

本文将测试以下功能：
- 服务端渲染的 Markdown 内容
- 目录导航功能
- 代码高亮显示
- 图片和媒体内容
- 各种文本格式

## 🔧 技术特性测试

### 代码块测试

这是一个 JavaScript 代码示例：

\`\`\`javascript
// 这是一个示例函数
function testFunction(param) {
  console.log('Hello, World!');
  return param * 2;
}

// 使用箭头函数
const arrowFunction = (x, y) => {
  return x + y;
};
\`\`\`

### TypeScript 代码示例

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

class UserService {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  findUser(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }
}
\`\`\`

### 内联代码测试

这里有一些内联代码：\`const variable = 'value'\` 和 \`npm install package\`。

## 📝 文本格式测试

### 强调和重点

- **粗体文本** 用于强调重要内容
- *斜体文本* 用于轻微强调
- ***粗斜体*** 用于特别重要的内容
- ~~删除线~~ 用于标记已删除的内容

### 列表测试

#### 无序列表
- 第一项内容
- 第二项内容
  - 嵌套项目 1
  - 嵌套项目 2
- 第三项内容

#### 有序列表
1. 首先做这个
2. 然后做那个
3. 最后完成这个
   1. 子步骤 A
   2. 子步骤 B

### 引用块测试

> 这是一个重要的引用块。它包含了一些重要的信息，需要特别注意。
> 
> 引用可以跨越多行，并且应该有适当的样式。

### 表格测试

| 功能 | 状态 | 描述 |
|------|------|------|
| 服务端渲染 | ✅ | 完全支持 |
| 客户端交互 | ✅ | Portal 渲染 |
| SEO 优化 | ✅ | 完整 metadata |
| 认证评论 | ✅ | 用户登录 |

## 🔗 链接测试

- [内部链接](/articles)
- [外部链接](https://nextjs.org)
- [GitHub 仓库](https://github.com/vercel/next.js)

## 📊 更多内容部分

### 分隔线测试

---

### 任务列表

- [x] 实现服务端渲染
- [x] 添加客户端交互
- [ ] 优化性能
- [ ] 添加更多功能

## 🎯 总结

这篇文章测试了文章页面的各种功能：

1. **内容渲染** - Markdown 到 HTML 的转换
2. **代码高亮** - 语法高亮显示
3. **目录生成** - 自动生成可点击的目录
4. **响应式设计** - 适配各种屏幕尺寸
5. **SEO 优化** - 完整的元数据和结构化内容

通过这个测试文章，我们可以验证所有功能是否正常工作。

### 最后的测试段落

这是文章的最后一个段落，用于测试滚动和阅读进度功能。当用户滚动到这里时，应该能看到阅读进度接近 100%。`;

    const testArticleData = {
      title: '完整功能测试文章 - 服务端渲染版本',
      slug: 'comprehensive-test-article-ssr',
      excerpt: '这是一篇用于测试文章页面所有功能的综合性文章，包括服务端渲染、客户端交互、认证评论等功能。',
      content: comprehensiveContent,
      status: 'published' as const,
      category: 'general' as const,
      authorId: adminUser[0].id,
      publishedAt: new Date(),
      viewCount: 0,
    };

    // 检查文章是否已存在
    const existingArticle = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, testArticleData.slug))
      .limit(1);

    if (existingArticle[0]) {
      console.log('⚠️  Test article already exists, updating...');
      
      const updatedArticle = await db
        .update(articles)
        .set({
          ...testArticleData,
          updatedAt: new Date(),
        })
        .where(eq(articles.slug, testArticleData.slug))
        .returning();

      console.log('✅ Test article updated:', updatedArticle[0].title);
    } else {
      console.log('📝 Creating new comprehensive test article...');
      
      const newArticle = await db
        .insert(articles)
        .values(testArticleData)
        .returning();

      console.log('✅ Test article created:', newArticle[0].title);

      // 添加测试标签
      const testTags = ['test', 'ssr', 'markdown', 'nextjs', 'comprehensive'];
      
      for (const tagName of testTags) {
        // 查找或创建标签
        let tag = await db
          .select()
          .from(tags)
          .where(eq(tags.name, tagName))
          .limit(1);

        if (!tag[0]) {
          const newTag = await db
            .insert(tags)
            .values({
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, '-'),
            })
            .returning();
          tag = newTag;
          console.log(`✅ Created tag: ${tagName}`);
        }

        // 创建文章-标签关联
        await db
          .insert(articleTags)
          .values({
            articleId: newArticle[0].id,
            tagId: tag[0].id,
          })
          .onConflictDoNothing();
      }

      console.log('✅ Tags added to article');
    }

    console.log('🎉 Comprehensive test article setup completed!');
    console.log('');
    console.log('📋 Test the following features:');
    console.log('   🌐 Article page: http://localhost:3000/articles/comprehensive-test-article-ssr');
    console.log('   📱 Mobile responsiveness');
    console.log('   🔍 SEO metadata (view page source)');
    console.log('   📖 Table of contents navigation');
    console.log('   💬 Comments system (requires login)');
    console.log('   📊 Reading progress bar');
    console.log('   🔗 Share functionality');
    console.log('   💾 Bookmark feature');
    console.log('   ⬅️➡️ Article navigation');

    await client.end();
    
  } catch (error) {
    console.error('❌ Failed to create test article:', error);
    process.exit(1);
  }
}

testArticlePage();
