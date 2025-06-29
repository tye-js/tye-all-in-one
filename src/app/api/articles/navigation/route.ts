import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq, and, lt, gt, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentSlug = searchParams.get('current');
    const category = searchParams.get('category');

    if (!currentSlug) {
      return NextResponse.json(
        { error: 'Current slug is required' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const currentPublishedAt = currentArticle[0].publishedAt;

    // 构建查询条件
    const baseConditions = [eq(articles.status, 'published')];
    if (category && category !== 'all') {
      baseConditions.push(eq(articles.category, category as any));
    }

    // 获取上一篇文章（发布时间更早）
    const prevArticle = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
      })
      .from(articles)
      .where(and(
        ...baseConditions,
        lt(articles.publishedAt, currentPublishedAt)
      ))
      .orderBy(desc(articles.publishedAt))
      .limit(1);

    // 获取下一篇文章（发布时间更晚）
    const nextArticle = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
      })
      .from(articles)
      .where(and(
        ...baseConditions,
        gt(articles.publishedAt, currentPublishedAt)
      ))
      .orderBy(asc(articles.publishedAt))
      .limit(1);

    return NextResponse.json({
      prev: prevArticle[0] || null,
      next: nextArticle[0] || null,
    });

  } catch (error) {
    console.error('Error fetching article navigation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
