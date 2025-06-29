# 内容处理架构改进方案

## 🎯 问题分析

### 当前架构问题
1. **重复处理**: 每次读取都要重新解析 Markdown
2. **性能损耗**: 服务端 ReactMarkdown 渲染开销大
3. **水合复杂**: 客户端需要重新解析生成目录
4. **一致性风险**: 标题 ID 生成逻辑可能不一致

## 💡 改进方案

### 方案一：双字段存储 (推荐)
```sql
ALTER TABLE articles ADD COLUMN processed_content TEXT;
ALTER TABLE articles ADD COLUMN content_metadata JSONB;
```

### 方案二：预处理缓存
```sql
CREATE TABLE article_cache (
  article_id UUID PRIMARY KEY,
  processed_html TEXT,
  table_of_contents JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🏗️ 实现架构

### 1. 写入时预处理
```typescript
interface ProcessedContent {
  html: string;
  tableOfContents: TocItem[];
  metadata: {
    headingCount: number;
    wordCount: number;
    readingTime: number;
    codeBlocks: number;
  };
}

async function processMarkdownContent(markdown: string): Promise<ProcessedContent> {
  // 1. 解析 Markdown 生成 HTML
  const html = await markdownToHtml(markdown);
  
  // 2. 提取目录信息
  const tableOfContents = extractTableOfContents(markdown);
  
  // 3. 计算元数据
  const metadata = calculateMetadata(markdown, html);
  
  return { html, tableOfContents, metadata };
}
```

### 2. 读取时直接使用
```typescript
async function getArticleBySlug(slug: string) {
  const article = await db.select({
    // ... 其他字段
    content: articles.content,           // 原始 Markdown
    processedContent: articles.processedContent, // 处理后的 HTML
    contentMetadata: articles.contentMetadata,   // 元数据
  }).from(articles)...;
  
  return article;
}
```

## 🔧 技术实现

### 1. Markdown 处理器
```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

export class ContentProcessor {
  private processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(this.addHeadingIds)
    .use(rehypeStringify);

  async processContent(markdown: string): Promise<ProcessedContent> {
    // 处理 Markdown
    const result = await this.processor.process(markdown);
    const html = result.toString();
    
    // 提取目录
    const toc = this.extractToc(markdown);
    
    // 计算元数据
    const metadata = this.calculateMetadata(markdown, html);
    
    return { html, tableOfContents: toc, metadata };
  }
  
  private addHeadingIds() {
    return (tree: any) => {
      // 为标题添加 ID
    };
  }
  
  private extractToc(markdown: string): TocItem[] {
    // 提取目录结构
  }
  
  private calculateMetadata(markdown: string, html: string) {
    // 计算字数、阅读时间等
  }
}
```

### 2. 数据库 Schema 更新
```typescript
export const articles = pgTable('articles', {
  // ... 现有字段
  content: text('content').notNull(),                    // 原始 Markdown
  processedContent: text('processed_content'),           // 处理后的 HTML
  contentMetadata: jsonb('content_metadata'),            // 元数据
  processedAt: timestamp('processed_at'),                // 处理时间
});
```

### 3. 文章创建/更新逻辑
```typescript
export async function createArticle(data: CreateArticleData) {
  // 1. 处理内容
  const processed = await contentProcessor.processContent(data.content);
  
  // 2. 保存到数据库
  const article = await db.insert(articles).values({
    ...data,
    processedContent: processed.html,
    contentMetadata: processed.metadata,
    processedAt: new Date(),
  }).returning();
  
  return article[0];
}

export async function updateArticle(id: string, data: UpdateArticleData) {
  let updateData = { ...data };
  
  // 如果内容有变化，重新处理
  if (data.content) {
    const processed = await contentProcessor.processContent(data.content);
    updateData = {
      ...updateData,
      processedContent: processed.html,
      contentMetadata: processed.metadata,
      processedAt: new Date(),
    };
  }
  
  return await db.update(articles)
    .set(updateData)
    .where(eq(articles.id, id))
    .returning();
}
```

## 🚀 性能优势

### 1. 读取性能
- ✅ 无需重复解析 Markdown
- ✅ 直接返回处理好的 HTML
- ✅ 目录信息预先计算
- ✅ 元数据即时可用

### 2. 服务端渲染
```typescript
// 简化的服务端组件
export default function ArticleContent({ 
  processedContent, 
  tableOfContents 
}: {
  processedContent: string;
  tableOfContents: TocItem[];
}) {
  return (
    <div 
      className="prose prose-lg max-w-none mb-8"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
```

### 3. 客户端水合
```typescript
// 目录组件直接使用预处理的数据
export default function TableOfContents({ 
  tableOfContents 
}: { 
  tableOfContents: TocItem[] 
}) {
  return (
    <nav>
      {tableOfContents.map(item => (
        <a key={item.id} href={`#${item.id}`}>
          {item.text}
        </a>
      ))}
    </nav>
  );
}
```

## 📊 对比分析

| 方面 | 当前方案 | 改进方案 |
|------|----------|----------|
| 读取性能 | 每次解析 | 直接使用 |
| 服务端负载 | 高 | 低 |
| 客户端负载 | 高 | 低 |
| 水合复杂度 | 复杂 | 简单 |
| 一致性 | 风险 | 保证 |
| 存储空间 | 小 | 稍大 |
| 维护复杂度 | 高 | 中等 |

## 🔄 迁移策略

### 1. 渐进式迁移
```typescript
// 兼容性处理
async function getArticleContent(article: Article) {
  if (article.processedContent) {
    // 使用预处理内容
    return {
      html: article.processedContent,
      toc: article.contentMetadata?.tableOfContents || [],
    };
  } else {
    // 降级到实时处理
    return await processMarkdownContent(article.content);
  }
}
```

### 2. 批量处理现有文章
```typescript
async function migrateExistingArticles() {
  const articles = await db.select().from(articles)
    .where(isNull(articles.processedContent));
  
  for (const article of articles) {
    const processed = await contentProcessor.processContent(article.content);
    
    await db.update(articles)
      .set({
        processedContent: processed.html,
        contentMetadata: processed.metadata,
        processedAt: new Date(),
      })
      .where(eq(articles.id, article.id));
  }
}
```

## 🎯 推荐实施步骤

1. **添加新字段** - 扩展数据库 schema
2. **实现处理器** - 创建内容处理服务
3. **更新写入逻辑** - 在创建/更新时预处理
4. **优化读取逻辑** - 使用预处理内容
5. **迁移现有数据** - 批量处理历史文章
6. **性能测试** - 验证改进效果

这个方案将显著提升性能，简化水合逻辑，并提供更好的用户体验！
