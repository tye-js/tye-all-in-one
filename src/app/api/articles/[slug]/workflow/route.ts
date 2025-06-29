import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { ArticleWorkflow } from '@/lib/workflow';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const workflowActionSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'archive', 'restore']),
  reason: z.string().optional(),
});

export async function POST(
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
    const { action, reason } = workflowActionSchema.parse(body);

    // Get the article by slug
    const article = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (!article[0]) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Execute workflow action
    const result = await ArticleWorkflow.executeAction({
      type: action,
      articleId: article[0].id,
      userId: session.user.id,
      reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
      article: result.article,
    });
  } catch (error) {
    console.error('Workflow action error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
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

    // Get the article by slug
    const article = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (!article[0]) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view workflow info
    const isAuthor = session.user.id === article[0].authorId;
    const isAdmin = session.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get workflow history (placeholder for now)
    const history = await ArticleWorkflow.getArticleHistory(article[0].id);

    return NextResponse.json({
      article: {
        id: article[0].id,
        title: article[0].title,
        slug: article[0].slug,
        status: article[0].status,
        publishedAt: article[0].publishedAt,
        createdAt: article[0].createdAt,
        updatedAt: article[0].updatedAt,
      },
      history,
      permissions: {
        canPublish: article[0].status === 'draft',
        canUnpublish: article[0].status === 'published',
        canArchive: ['draft', 'published'].includes(article[0].status),
        canRestore: article[0].status === 'archived',
      },
    });
  } catch (error) {
    console.error('Error fetching workflow info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
