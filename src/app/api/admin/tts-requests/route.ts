import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ttsRequests, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

// GET /api/admin/tts-requests - 获取所有 TTS 请求
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await db
      .select({
        id: ttsRequests.id,
        userId: ttsRequests.userId,
        text: ttsRequests.text,
        language: ttsRequests.language,
        voice: ttsRequests.voice,
        audioUrl: ttsRequests.audioUrl,
        status: ttsRequests.status,
        errorMessage: ttsRequests.errorMessage,
        duration: ttsRequests.duration,
        fileSize: ttsRequests.fileSize,
        createdAt: ttsRequests.createdAt,
        updatedAt: ttsRequests.updatedAt,
        user: {
          name: users.name,
          email: users.email,
        },
      })
      .from(ttsRequests)
      .leftJoin(users, eq(ttsRequests.userId, users.id))
      .orderBy(desc(ttsRequests.createdAt));

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Failed to get TTS requests:', error);
    return NextResponse.json(
      { error: 'Failed to get TTS requests' },
      { status: 500 }
    );
  }
}
