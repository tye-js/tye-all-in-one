import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import MainLayout from '@/components/layout/main-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Eye, ArrowLeft, Bookmark, Tag as TagIcon } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { db } from '@/lib/db';
import { articles, users, categories, tags, articleTags } from '@/lib/db/schema';
import { eq, and, lt, gt, desc, asc } from 'drizzle-orm';
import ArticleContent from '@/components/article/article-content';
import ClientSideComponents from '@/components/article/client-side-components';
import AuthenticatedCommentsSection from '@/components/article/authenticated-comments-section';
import { Article, RelatedArticle, Tag } from '@/types/article';
import 'highlight.js/styles/github.css';
import './article-styles.css';
import Image from 'next/image';

// 直接在服务端获取文章数据，避免额外的 HTTP 请求
async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    // 获取文章基本信息
    const articleResult = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        content: articles.content,
        processedContent: articles.processedContent,
        contentMetadata: articles.contentMetadata,
        featuredImage: articles.featuredImage,
        status: articles.status,
        category: articles.category,
        publishedAt: articles.publishedAt,
        processedAt: articles.processedAt,
        viewCount: articles.viewCount,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        },
        categoryInfo: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          color: categories.color,
        }
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(
        eq(articles.slug, slug),
        eq(articles.status, 'published')
      ))
      .limit(1);

    if (!articleResult[0]) {
      return null;
    }

    // 获取文章标签
    const articleTagsResult = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(articleTags)
      .leftJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, articleResult[0].id));

    return {
      ...articleResult[0],
      publishedAt: articleResult[0].publishedAt?.toISOString() || '',
      createdAt: articleResult[0].createdAt.toISOString(),
      updatedAt: articleResult[0].updatedAt.toISOString(),
      processedAt: articleResult[0].processedAt?.toISOString() || null,
      tags: articleTagsResult.filter(tag => tag.id !== null),
    } as Article;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

// 获取相关文章
async function getRelatedArticles(category: string, currentSlug: string, limit = 3): Promise<RelatedArticle[]> {
  try {
    const relatedResult = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        publishedAt: articles.publishedAt,
        viewCount: articles.viewCount,
        author: {
          name: users.name,
          avatar: users.avatar,
        }
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(
        eq(articles.status, 'published'),
        eq(articles.category, category as any)
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(limit + 1); // 多获取一个，然后过滤掉当前文章

    return relatedResult
      .filter(article => article.slug !== currentSlug)
      .slice(0, limit)
      .map(article => ({
        ...article,
        publishedAt: article.publishedAt?.toISOString() || '',
      })) as RelatedArticle[];
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return [];
  }
}

// 获取文章导航（上一篇/下一篇）
async function getArticleNavigation(currentSlug: string, category: string) {
  try {
    // 获取当前文章的发布时间
    const currentArticle = await db
      .select({
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(and(
        eq(articles.slug, currentSlug),
        eq(articles.status, 'published')
      ))
      .limit(1);

    if (!currentArticle[0]) {
      return { prev: null, next: null };
    }

    const currentPublishedAt = currentArticle[0].publishedAt;

    if (!currentPublishedAt) {
      return { prev: null, next: null };
    }

    // 获取上一篇文章
    const prevArticle = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
      })
      .from(articles)
      .where(and(
        eq(articles.status, 'published'),
        eq(articles.category, category as any),
        lt(articles.publishedAt, currentPublishedAt)
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(1);

    // 获取下一篇文章
    const nextArticle = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
      })
      .from(articles)
      .where(and(
        eq(articles.status, 'published'),
        eq(articles.category, category as any),
        gt(articles.publishedAt, currentPublishedAt)
      ))
      .orderBy(asc(articles.publishedAt))
      .limit(1);

    return {
      prev: prevArticle[0] || null,
      next: nextArticle[0] || null,
    };
  } catch (error) {
    console.error('Error fetching article navigation:', error);
    return { prev: null, next: null };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  
  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: `${article.title} | Your Blog`,
    description: article.excerpt || `Read ${article.title} on our blog`,
    keywords: article.tags.map((tag: Tag) => tag.name).join(', '),
    authors: [{ name: article.author?.name || 'Anonymous' }],
    openGraph: {
      title: article.title,
      description: article.excerpt || undefined,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: article.author?.name ? [article.author.name] : undefined,
      tags: article.tags.map((tag: Tag) => tag.name),
      ...(article.featuredImage && { 
        images: [{
          url: article.featuredImage,
          width: 1200,
          height: 630,
          alt: article.title,
        }] 
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || undefined,
      creator: article.author?.name ? `@${article.author.name.replace(/\s+/g, '')}` : undefined,
      ...(article.featuredImage && { 
        images: [{
          url: article.featuredImage,
          alt: article.title,
        }] 
      }),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 获取当前用户会话
  const session = await getServerSession(authOptions);

  // 获取文章数据
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // 获取相关文章和导航
  const [relatedArticles, navigation] = await Promise.all([
    getRelatedArticles(article.category, slug, 3),
    getArticleNavigation(slug, article.category)
  ]);

  const getCategoryColor = (category: string) => {
    const colors = {
      server_deals: 'bg-green-100 text-green-800 border-green-200',
      ai_tools: 'bg-purple-100 text-purple-800 border-purple-200',
      general: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryName = (category: string) => {
    const names = {
      server_deals: 'Server Deals',
      ai_tools: 'AI Tools',
      general: 'General',
    };
    return names[category as keyof typeof names] || category;
  };

  return (
    <MainLayout>
      {/* 客户端组件 */}
      <ClientSideComponents
        articleId={article.id}
        articleSlug={slug}
        articleTitle={article.title}
        articleContent={article.content}
        tableOfContents={article.contentMetadata?.tableOfContents}
        articleExcerpt={article.excerpt}
        articleTags={article.tags.map(tag => tag.name)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/articles">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Articles
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-3">
            {/* Featured Image */}
            {article.featuredImage && (
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-8">
                <Image
                  src={article.featuredImage}
                  alt={article.title}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            )}

            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={getCategoryColor(article.category)}>
                  {getCategoryName(article.category)}
                </Badge>
                {article.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <TagIcon className="w-3 h-3 text-gray-400" />
                    {article.tags.slice(0, 3).map((tag: Tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  {article.excerpt}
                </p>
              )}

              {/* Author and Meta Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={article.author?.avatar || undefined} 
                      alt={article.author?.name || 'Author'} 
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {article.author?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <User className="w-4 h-4 mr-1" />
                      {article.author?.name || 'Anonymous'}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {/* Article Actions - 这些将由客户端组件处理 */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Eye className="w-4 h-4 mr-1" />
                    {article.viewCount.toLocaleString()} views
                  </div>
                  {/* 分享和收藏按钮将由客户端组件渲染 */}
                  <div className="share-buttons"></div>
                  <div className="bookmark-button"></div>
                </div>
              </div>

              <Separator />
            </header>

            {/* Article Content - 服务端渲染 */}
            <ArticleContent
              content={article.content}
              processedContent={article.processedContent}
              contentMetadata={article.contentMetadata}
            />

            {/* Article Footer */}
            <footer className="border-t pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-500">
                  Published {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                  {article.updatedAt !== article.createdAt && (
                    <span className="ml-2">
                      • Updated {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {/* 分享按钮将由客户端组件渲染 */}
                  <div className="share-buttons"></div>
                </div>
              </div>
            </footer>

            {/* Article Navigation - 服务端渲染 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {/* Previous Article */}
              <div className="md:col-span-1">
                {navigation.prev ? (
                  <Link href={`/articles/${navigation.prev.slug}`}>
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Previous Article
                        </div>
                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                          {navigation.prev.title}
                        </h3>
                        {navigation.prev.excerpt && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {navigation.prev.excerpt}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <div />
                )}
              </div>

              {/* Next Article */}
              <div className="md:col-span-1">
                {navigation.next ? (
                  <Link href={`/articles/${navigation.next.slug}`}>
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 text-right">
                        <div className="flex items-center justify-end text-sm text-gray-500 mb-2">
                          Next Article
                          <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                        </div>
                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                          {navigation.next.title}
                        </h3>
                        {navigation.next.excerpt && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {navigation.next.excerpt}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>

            {/* Comments Section - 使用认证的评论系统 */}
            <AuthenticatedCommentsSection articleId={article.id} />
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Table of Contents - 将由客户端组件渲染 */}
              <div id="table-of-contents-placeholder"></div>
              {/* Article Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Article Stats</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Views</span>
                      <span className="font-medium">{article.viewCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Published</span>
                      <span className="font-medium">
                        {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Reading time</span>
                      <span className="font-medium">
                        {Math.ceil(article.content.split(' ').length / 200)} min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Related Articles</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {relatedArticles.map((relatedArticle: RelatedArticle) => (
                        <Link
                          key={relatedArticle.id}
                          href={`/articles/${relatedArticle.slug}`}
                          className="block group"
                        >
                          <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {relatedArticle.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(relatedArticle.publishedAt), { addSuffix: true })}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
