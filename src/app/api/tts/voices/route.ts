import { NextRequest, NextResponse } from 'next/server';
import {  getVoicesForLanguage} from '@/lib/tts';
import { voiceSyncService } from '@/lib/voice-sync';

export async function GET(request: NextRequest) {
  try {
    // 检查是否需要同步语音（如果数据库为空）
    const shouldSync = await voiceSyncService.shouldSync(24);
    if (shouldSync) {
      console.log('🔄 Auto-syncing voices (database empty or outdated)');
      try {
        await voiceSyncService.syncVoicesToDatabase();
      } catch (error) {
        console.error('❌ Auto-sync failed:', error);
        // 继续执行，使用现有数据
      }
    }

 
      // 获取指定语言的语音
      const voices = await getVoicesForLanguage();
      return NextResponse.json(voices);
    
  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch voices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
