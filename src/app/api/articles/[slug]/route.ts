import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles, users, categories, tags, articleTags } from '@/lib/db/schema';
import { updateArticleSchema } from '@/lib/validations';
import { contentProcessor } from '@/lib/content-processor';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get article with relations
    const article = await db
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
        metadata: articles.metadata,
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
      .where(eq(articles.slug, slug))
      .limit(1);

    if (!article[0]) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if article is published or user has permission to view
    if (article[0].status !== 'published') {
      // For unpublished articles, check if user has permission
      const session = await getServerSession(authOptions);
      const isAuthor = session?.user?.id === article[0].author?.id;
      const isAdmin = session?.user?.role === 'admin';

      if (!isAuthor && !isAdmin) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }
    }

    // Get article tags
    const articleTagsData = await db
      .select({
        tag: {
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
        }
      })
      .from(articleTags)
      .leftJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, article[0].id));

    // Increment view count if article is published
    if (article[0].status === 'published') {
      await db
        .update(articles)
        .set({ 
          viewCount: sql`${articles.viewCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(articles.id, article[0].id));
    }

    return NextResponse.json({
      ...article[0],
      tags: articleTagsData.map(item => item.tag).filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const validatedData = updateArticleSchema.parse(body);

    // Get existing article
    const existingArticle = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (!existingArticle[0]) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAuthor = session.user.id === existingArticle[0].authorId;
    const isAdmin = session.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 准备更新数据
    let updateData = {
      ...validatedData,
      updatedAt: new Date(),
      publishedAt: validatedData.status === 'published' && !existingArticle[0].publishedAt
        ? new Date()
        : existingArticle[0].publishedAt,
    };

    // 如果内容有变化，重新处理
    if (validatedData.content && validatedData.content !== existingArticle[0].content) {
      const processed = await contentProcessor.processContent(validatedData.content);
      updateData = {
        ...updateData,
        processedContent: processed.html,
        contentMetadata: processed.metadata,
        processedAt: new Date(),
      } as any;
    }

    // Update article
    const updatedArticle = await db
      .update(articles)
      .set(updateData)
      .where(eq(articles.id, existingArticle[0].id))
      .returning();

    // Handle tags if provided
    if (body.tags) {
      // Remove existing tags
      await db
        .delete(articleTags)
        .where(eq(articleTags.articleId, existingArticle[0].id));

      // Add new tags
      if (body.tags.length > 0) {
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
                articleId: existingArticle[0].id,
                tagId,
              }))
            );
        }
      }
    }

    return NextResponse.json(updatedArticle[0]);
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    // Get existing article
    const existingArticle = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (!existingArticle[0]) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAuthor = session.user.id === existingArticle[0].authorId;
    const isAdmin = session.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete article (cascade will handle article_tags)
    await db
      .delete(articles)
      .where(eq(articles.id, existingArticle[0].id));

    return NextResponse.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
