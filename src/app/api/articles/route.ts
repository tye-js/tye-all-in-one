import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles, users, categories, tags, articleTags } from '@/lib/db/schema';
import { createArticleSchema, searchSchema } from '@/lib/validations';
import { contentProcessor } from '@/lib/content-processor';
import { eq, desc, asc, like, and, or, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log("xaaaaa")
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

    // Build query conditions
    const conditions = [];
    
    if (status !== 'all') {
      conditions.push(eq(articles.status, status as any));
    }
    
    if (category && category !== 'all') {
      conditions.push(eq(articles.category, category as any));
    }
    
    if (q) {
      conditions.push(
        or(
          like(articles.title, `%${q}%`),
          like(articles.excerpt, `%${q}%`),
          like(articles.content, `%${q}%`)
        )
      );
    }

    // Build order clause
    let orderColumn;
    switch (sortBy) {
      case 'title':
        orderColumn = articles.title;
        break;
      case 'createdAt':
        orderColumn = articles.createdAt;
        break;
      case 'updatedAt':
        orderColumn = articles.updatedAt;
        break;
      case 'viewCount':
        orderColumn = articles.viewCount;
        break;
      default:
        orderColumn = articles.publishedAt;
    }
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    // Get total count
    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(articles);
    
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    
    const [{ count: total }] = await totalQuery;

    // Get articles with relations
    let query = db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        content: articles.content,
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
      .leftJoin(categories, eq(articles.categoryId, categories.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query
      .orderBy(orderDirection(orderColumn))
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      articles: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createArticleSchema.parse(body);

    // 预处理文章内容
    const processed = await contentProcessor.processContent(validatedData.content);

    const newArticle = await db
      .insert(articles)
      .values({
        ...validatedData,
        processedContent: processed.html,
        contentMetadata: processed.metadata,
        processedAt: new Date(),
        authorId: session.user.id,
        publishedAt: validatedData.status === 'published' ? new Date() : null,
      })
      .returning();

    // Handle tags if provided
    if (body.tags && body.tags.length > 0) {
      const tagIds = [];
      
      for (const tagName of body.tags) {
        // Find or create tag
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
        }

        tagIds.push(tag[0].id);
      }

      // Create article-tag relationships
      if (tagIds.length > 0) {
        await db
          .insert(articleTags)
          .values(
            tagIds.map(tagId => ({
              articleId: newArticle[0].id,
              tagId,
            }))
          );
      }
    }

    return NextResponse.json(newArticle[0], { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
