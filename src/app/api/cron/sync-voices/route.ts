import { NextRequest, NextResponse } from 'next/server';
import { voiceSyncService } from '@/lib/voice-sync';

export async function GET(request: NextRequest) {
  try {
    // 验证 cron 密钥（可选，用于安全性）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 Cron job: Voice sync started');

    // 检查是否需要同步（距离上次同步超过 24 小时）
    const shouldSync = await voiceSyncService.shouldSync(24);
    
    if (!shouldSync) {
      console.log('⏭️  Cron job: Voice sync skipped (recent sync found)');
      return NextResponse.json({
        success: true,
        message: 'Voice sync skipped - recent sync found',
        skipped: true,
      });
    }

    // 执行语音同步
    const result = await voiceSyncService.syncVoicesToDatabase();

    console.log('✅ Cron job: Voice sync completed', result);

    return NextResponse.json({
      success: true,
      message: 'Voice synchronization completed successfully',
      data: result,
    });

  } catch (error) {
    console.error('❌ Cron job: Voice sync failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Voice synchronization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 支持 POST 方法（某些 cron 服务可能使用 POST）
export async function POST(request: NextRequest) {
  return GET(request);
}
