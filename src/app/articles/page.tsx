import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/db';
import { articles, users } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import ArticlesFilters from '@/components/articles/articles-filters';

export const metadata: Metadata = {
  title: 'Articles | TYE All-in-One',
  description: 'Discover the latest server deals, AI tool updates, and industry insights. Browse our comprehensive collection of articles.',
  keywords: ['articles', 'server deals', 'AI tools', 'technology', 'blog', 'insights'],
  openGraph: {
    title: 'Articles | TYE All-in-One',
    description: 'Discover the latest server deals, AI tool updates, and industry insights. Browse our comprehensive collection of articles.',
    type: 'website',
    url: '/articles',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Articles | TYE All-in-One',
    description: 'Discover the latest server deals, AI tool updates, and industry insights.',
  },
  alternates: {
    canonical: '/articles',
  },
};

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  status: string;
  category: string;
  publishedAt: string;
  viewCount: number;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

// 服务端获取文章列表
async function getArticles(
  searchParams: { [key: string]: string | string[] | undefined }
): Promise<{ articles: Article[]; total: number }> {
  try {
    const q = searchParams.query as string;
    const page = Number(searchParams.page) || 1;
    const limit = Number(searchParams.limit) || 12;
    const category = searchParams.category as string;
    const sortBy = (searchParams.sortBy as string) || 'publishedAt';
    const sortOrder = (searchParams.sortOrder as string) || 'desc';

    // 构建查询条件
    const conditions = [eq(articles.status, 'published')];

    // 添加分类过滤
    if (category && category !== 'all') {
      conditions.push(eq(articles.category, category as any));
    }

    const query = db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        status: articles.status,
        category: articles.category,
        publishedAt: articles.publishedAt,
        viewCount: articles.viewCount,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        },
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(...conditions));

    // 添加搜索过滤

    // 添加排序
    const orderColumn = sortBy === 'title' ? articles.title :
                       sortBy === 'viewCount' ? articles.viewCount :
                       articles.publishedAt;

    const orderDirection = sortOrder === 'asc' ? orderColumn : desc(orderColumn);

    const result = await query
      .orderBy(orderDirection)
      .limit(limit)
      .offset((page - 1) * limit);

    // 获取总数
    const totalResult = await db
      .select({ count: articles.id })
      .from(articles)
      .where(and(...conditions));

    return {
      articles: result.map(article => ({
        ...article,
        publishedAt: article.publishedAt?.toISOString() || '',
      })) as Article[],
      total: totalResult.length,
    };
  } catch (error) {
    console.error('Error fetching articles:', error);
    return { articles: [], total: 0 };
  }
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const { articles: articlesList, total } = await getArticles(params);

  const getCategoryColor = (category: string) => {
    const colors = {
      server_deals: 'bg-green-100 text-green-800',
      ai_tools: 'bg-purple-100 text-purple-800',
      general: 'bg-blue-100 text-blue-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Articles</h1>
          <p className="text-gray-600">
            Discover the latest server deals, AI tool updates, and industry insights.
          </p>
        </div>

        {/* Filters - 客户端组件用于交互 */}
        <Suspense fallback={<div className="mb-8 h-16 bg-gray-100 rounded animate-pulse" />}>
          <ArticlesFilters />
        </Suspense>

        {/* Articles Grid - 服务端渲染 */}
        {articlesList.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or check back later for new content.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {articlesList.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow">
                  {article.featuredImage && (
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      <Image
                        src={article.featuredImage}
                        alt={article.title}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getCategoryColor(article.category)}>
                        {getCategoryName(article.category)}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Eye className="w-4 h-4 mr-1" />
                        {article.viewCount}
                      </div>
                    </div>
                    <CardTitle className="line-clamp-2">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {article.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {article.author.name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination - 客户端组件用于交互 */}
            <Suspense fallback={<div className="h-12 bg-gray-100 rounded animate-pulse" />}>
              <div className="pagination-placeholder" data-total={total} />
            </Suspense>
          </>
        )}
      </div>
    </MainLayout>
  );
}
