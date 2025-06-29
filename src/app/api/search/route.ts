import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { articles, users, categories, tags, articleTags } from '@/lib/db/schema';
import { searchSchema } from '@/lib/validations';
import { eq, like, and, or, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    // Convert string numbers to actual numbers
    const params = {
      ...rawParams,
      page: rawParams.page ? parseInt(rawParams.page) : undefined,
      limit: rawParams.limit ? parseInt(rawParams.limit) : undefined,
    };

    const validatedParams = searchSchema.parse(params);
    
    const {
      q,
      category,
      status = 'published',
      page = 1,
      limit = 10,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = validatedParams;

    if (!q) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Build search conditions
    const searchConditions = [
      like(articles.title, `%${q}%`),
      like(articles.excerpt, `%${q}%`),
      like(articles.content, `%${q}%`),
    ];

    const conditions = [or(...searchConditions)];
    
    if (status !== 'all') {
      conditions.push(eq(articles.status, status as any));
    }
    
    if (category && category !== 'all') {
      conditions.push(eq(articles.category, category as any));
    }

    // Build order clause
    const orderColumn = articles[sortBy as keyof typeof articles] || articles.publishedAt;
    const orderDirection = sortOrder === 'asc' ? sql`ASC` : sql`DESC`;

    // Get total count
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(and(...conditions));

    // Get search results with relations
    const results = await db
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
      .where(and(...conditions))
      .orderBy(sql`${orderColumn} ${orderDirection}`)
      .limit(limit)
      .offset((page - 1) * limit);

    // Get related tags for search suggestions
    const relatedTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        count: sql<number>`count(${articleTags.articleId})`,
      })
      .from(tags)
      .leftJoin(articleTags, eq(tags.id, articleTags.tagId))
      .leftJoin(articles, and(
        eq(articleTags.articleId, articles.id),
        or(...searchConditions)
      ))
      .where(like(tags.name, `%${q}%`))
      .groupBy(tags.id)
      .orderBy(desc(sql`count(${articleTags.articleId})`))
      .limit(10);

    return NextResponse.json({
      query: q,
      results,
      relatedTags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      suggestions: {
        categories: category === 'all' ? ['server_deals', 'ai_tools', 'general'] : [],
        tags: relatedTags.map(tag => tag.name),
      }
    });
  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
