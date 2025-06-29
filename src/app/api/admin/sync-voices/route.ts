import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { voiceSyncService } from '@/lib/voice-sync';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 只有管理员可以手动触发同步
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    console.log('🔄 Manual voice sync triggered by admin:', session.user.email);

    // 执行语音同步
    const result = await voiceSyncService.syncVoicesToDatabase();

    return NextResponse.json({
      success: true,
      message: 'Voice synchronization completed successfully',
      data: result,
    });

  } catch (error) {
    console.error('❌ Voice sync API error:', error);
    return NextResponse.json(
      { 
        error: 'Voice synchronization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 只有管理员可以查看同步状态
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    // 检查是否需要同步
    const shouldSync = await voiceSyncService.shouldSync(24); // 24小时
    
    // 获取语音统计信息
    const voices = await voiceSyncService.getVoicesFromDatabase();
    const languages = await voiceSyncService.getSupportedLanguages();

    const stats = {
      totalVoices: voices.length,
      activeVoices: voices.filter(v => v.isActive).length,
      supportedLanguages: languages.length,
      shouldSync,
      lastSyncAt: voices.length > 0 ? voices[0].lastSyncAt : null,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('❌ Voice sync status API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
