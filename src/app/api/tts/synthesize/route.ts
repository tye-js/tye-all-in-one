import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ttsRequests } from '@/lib/db/schema';
import { ttsRequestSchema } from '@/lib/validations';
import { synthesizeSpeech } from '@/lib/tts';
import { getMembershipInfo } from '@/lib/membership';
import { checkUsageLimits, trackTTSUsage } from '@/lib/usage-tracking';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = ttsRequestSchema.parse(body);

    // 检查会员权限和使用限制
    const membershipInfo = getMembershipInfo(session.user);
    const charactersCount = validatedData.text.length;

    const usageCheck = await checkUsageLimits(
      session.user.id,
      charactersCount,
      membershipInfo.features
    );

    if (!usageCheck.canUse) {
      return NextResponse.json(
        {
          error: usageCheck.reason,
          usage: usageCheck.usage,
          membershipTier: membershipInfo.tier
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Create TTS request record
    const ttsRequest = await db
      .insert(ttsRequests)
      .values({
        userId: session.user.id,
        text: validatedData.text,
        language: validatedData.language,
        voice: validatedData.voice,
        status: 'processing',
      })
      .returning();

    try {
      // Synthesize speech
      const result = await synthesizeSpeech({
        text: validatedData.text,
        languageCode: validatedData.language,
        voiceName: validatedData.voice,
        speakingRate: validatedData.speakingRate,
        pitch: validatedData.pitch,
        useSSML: validatedData.useSSML,
      });

      // Update request with success
      const updatedRequest = await db
        .update(ttsRequests)
        .set({
          audioUrl: result.audioUrl,
          fileSize: result.fileSize,
          duration: result.duration,
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(ttsRequests.id, ttsRequest[0].id))
        .returning();

      // 记录使用统计
      await trackTTSUsage(session.user.id, charactersCount);

      return NextResponse.json({
        id: updatedRequest[0].id,
        audioUrl: result.audioUrl,
        fileSize: result.fileSize,
        duration: result.duration,
        status: 'completed',
      });
    } catch (error) {
      // Update request with error
      await db
        .update(ttsRequests)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(ttsRequests.id, ttsRequest[0].id));

      throw error;
    }
  } catch (error) {
    console.error('TTS synthesis error:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize speech' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const requests = await db
      .select()
      .from(ttsRequests)
      .where(eq(ttsRequests.userId, session.user.id))
      .orderBy(ttsRequests.createdAt)
      .limit(limit)
      .offset((page - 1) * limit);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total: requests.length,
      }
    });
  } catch (error) {
    console.error('Error fetching TTS requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TTS requests' },
      { status: 500 }
    );
  }
}
