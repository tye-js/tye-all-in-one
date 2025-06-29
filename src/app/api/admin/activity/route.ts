import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles, users, ttsRequests } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const limit = 10;

    // Get recent articles
    const recentArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        status: articles.status,
        createdAt: articles.createdAt,
        authorName: users.name,
      })
      .from(articles)
      .leftJoin(users, sql`${articles.authorId} = ${users.id}`)
      .orderBy(desc(articles.createdAt))
      .limit(5);

    // Get recent users
    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(3);

    // Get recent TTS requests
    const recentTTS = await db
      .select({
        id: ttsRequests.id,
        text: ttsRequests.text,
        language: ttsRequests.language,
        status: ttsRequests.status,
        createdAt: ttsRequests.createdAt,
        userName: users.name,
      })
      .from(ttsRequests)
      .leftJoin(users, sql`${ttsRequests.userId} = ${users.id}`)
      .orderBy(desc(ttsRequests.createdAt))
      .limit(2);

    // Combine and format activities
    const activities = [
      ...recentArticles.map(article => ({
        id: `article-${article.id}`,
        type: 'article' as const,
        title: `New article: ${article.title}`,
        description: `${article.status} by ${article.authorName || 'Unknown'}`,
        createdAt: article.createdAt.toISOString(),
        href: `/admin/articles/${article.slug}`,
      })),
      ...recentUsers.map(user => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        title: `New user registered: ${user.name || user.email}`,
        description: `Role: ${user.role}`,
        createdAt: user.createdAt.toISOString(),
        href: `/admin/users/${user.id}`,
      })),
      ...recentTTS.map(tts => ({
        id: `tts-${tts.id}`,
        type: 'tts' as const,
        title: `TTS request: ${tts.text.substring(0, 50)}${tts.text.length > 50 ? '...' : ''}`,
        description: `${tts.language} by ${tts.userName || 'Anonymous'} - ${tts.status}`,
        createdAt: tts.createdAt.toISOString(),
        href: `/admin/tts/${tts.id}`,
      })),
    ];

    // Sort by creation date and limit
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      activities: activities.slice(0, limit),
    });
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
