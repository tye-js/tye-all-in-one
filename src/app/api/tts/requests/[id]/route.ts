import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ttsRequests } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const ttsRequest = await db
      .select()
      .from(ttsRequests)
      .where(
        and(
          eq(ttsRequests.id, id),
          eq(ttsRequests.userId, session.user.id)
        )
      )
      .limit(1);

    if (!ttsRequest[0]) {
      return NextResponse.json(
        { error: 'TTS request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ttsRequest[0]);
  } catch (error) {
    console.error('Error fetching TTS request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TTS request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the TTS request to check ownership and get audio file path
    const ttsRequest = await db
      .select()
      .from(ttsRequests)
      .where(
        and(
          eq(ttsRequests.id, id),
          eq(ttsRequests.userId, session.user.id)
        )
      )
      .limit(1);

    if (!ttsRequest[0]) {
      return NextResponse.json(
        { error: 'TTS request not found' },
        { status: 404 }
      );
    }

    // Delete the audio file if it exists
    if (ttsRequest[0].audioUrl) {
      try {
        const filename = ttsRequest[0].audioUrl.split('/').pop();
        if (filename) {
          const filepath = join(process.cwd(), 'public', 'uploads', 'tts', filename);
          await unlink(filepath);
        }
      } catch (fileError) {
        console.warn('Could not delete audio file:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the database record
    await db
      .delete(ttsRequests)
      .where(eq(ttsRequests.id, id));

    return NextResponse.json({ message: 'TTS request deleted successfully' });
  } catch (error) {
    console.error('Error deleting TTS request:', error);
    return NextResponse.json(
      { error: 'Failed to delete TTS request' },
      { status: 500 }
    );
  }
}
