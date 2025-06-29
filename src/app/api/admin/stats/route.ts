import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { articles, users, ttsRequests } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get article stats
    const [articleStats] = await db
      .select({
        total: sql<number>`count(*)`,
        published: sql<number>`count(case when ${articles.status} = 'published' then 1 end)`,
        draft: sql<number>`count(case when ${articles.status} = 'draft' then 1 end)`,
        totalViews: sql<number>`sum(${articles.viewCount})`,
      })
      .from(articles);

    // Get user count
    const [userStats] = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(users);

    // Get TTS request count
    const [ttsStats] = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(ttsRequests);

    const stats = {
      totalArticles: articleStats.total || 0,
      publishedArticles: articleStats.published || 0,
      draftArticles: articleStats.draft || 0,
      totalUsers: userStats.total || 0,
      totalTTSRequests: ttsStats.total || 0,
      totalViews: articleStats.totalViews || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
