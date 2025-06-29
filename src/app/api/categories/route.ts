import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { categories, articles } from '@/lib/db/schema';
import { categorySchema } from '@/lib/validations';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeCount = searchParams.get('includeCount') === 'true';

    if (includeCount) {
      // Get categories with article count
      const categoriesWithCount = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          color: categories.color,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
          articleCount: sql<number>`count(${articles.id})`,
        })
        .from(categories)
        .leftJoin(articles, eq(categories.id, articles.categoryId))
        .groupBy(categories.id)
        .orderBy(categories.name);

      return NextResponse.json({ categories: categoriesWithCount });
    } else {
      // Get categories without count
      const categoriesList = await db
        .select()
        .from(categories)
        .orderBy(categories.name);

      return NextResponse.json({ categories: categoriesList });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
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
    const validatedData = categorySchema.parse(body);

    // Check if category with same slug exists
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, validatedData.slug))
      .limit(1);

    if (existingCategory[0]) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    const newCategory = await db
      .insert(categories)
      .values(validatedData)
      .returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
