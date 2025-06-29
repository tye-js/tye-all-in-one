import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { tags, articleTags } from '@/lib/db/schema';
import { tagSchema } from '@/lib/validations';
import { eq, like, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const includeCount = searchParams.get('includeCount') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let result;

    if (includeCount) {
      let countQuery = db
        .select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
          createdAt: tags.createdAt,
          articleCount: sql<number>`count(${articleTags.articleId})`,
        })
        .from(tags)
        .leftJoin(articleTags, eq(tags.id, articleTags.tagId))
        .groupBy(tags.id);

      if (search) {
        countQuery = countQuery.where(like(tags.name, `%${search}%`)) as any;
      }

      result = await countQuery
        .orderBy(tags.name)
        .limit(limit);
    } else {
      let basicQuery = db.select().from(tags);

      if (search) {
        basicQuery = basicQuery.where(like(tags.name, `%${search}%`)) as any;
      }

      result = await basicQuery
        .orderBy(tags.name)
        .limit(limit);
    }

    return NextResponse.json({ tags: result });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = tagSchema.parse(body);

    // Check if tag with same slug exists
    const existingTag = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, validatedData.slug))
      .limit(1);

    if (existingTag[0]) {
      return NextResponse.json(
        { error: 'Tag with this slug already exists' },
        { status: 400 }
      );
    }

    const newTag = await db
      .insert(tags)
      .values(validatedData)
      .returning();

    return NextResponse.json(newTag[0], { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
