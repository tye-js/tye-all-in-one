// 首先加载环境变量
import * as fs from 'fs';
import * as path from 'path';

// 从 .env.local 读取环境变量
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');

  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  }
}

// 然后导入其他模块
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

async function setupVoiceSync() {
  try {
    console.log('🚀 Setting up Voice Sync System...\n');
    
    const client = postgres(DATABASE_URL, { prepare: false });
    const db = drizzle(client);

    console.log('📊 Creating TTS voices table...');
    
    // 创建 TTS voices 表
    try {
      await client`
        CREATE TABLE IF NOT EXISTS tts_voices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          display_name VARCHAR(200) NOT NULL,
          short_name VARCHAR(100) NOT NULL,
          gender VARCHAR(10) NOT NULL,
          locale VARCHAR(20) NOT NULL,
          locale_name VARCHAR(100) NOT NULL,
          voice_type VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'GA' NOT NULL,
          sample_rate_hertz VARCHAR(50),
          words_per_minute VARCHAR(50),
          is_active BOOLEAN DEFAULT true NOT NULL,
          last_sync_at TIMESTAMP DEFAULT NOW() NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `;
      
      // 创建索引
      await client`
        CREATE INDEX IF NOT EXISTS idx_tts_voices_locale ON tts_voices(locale);
      `;
      await client`
        CREATE INDEX IF NOT EXISTS idx_tts_voices_is_active ON tts_voices(is_active);
      `;
      await client`
        CREATE INDEX IF NOT EXISTS idx_tts_voices_last_sync_at ON tts_voices(last_sync_at);
      `;
      
      console.log('✅ TTS voices table created successfully');
    } catch (error) {
      console.log('⚠️  Table creation skipped (may already exist)');
    }

    console.log('\n🔄 Performing initial voice synchronization...');

    // 检查 Azure 配置
    const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
    const azureSpeechRegion = process.env.AZURE_SPEECH_REGION;

    if (!azureSpeechKey || !azureSpeechRegion) {
      console.log('⚠️  Azure Speech Service not configured');
      console.log('   Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local');
      console.log('   Voice sync will be skipped for now.');
    } else {
      try {
        // 动态导入 voiceSyncService
        const { voiceSyncService } = await import('../src/lib/voice-sync');

        // 执行初始同步
        const result = await voiceSyncService.syncVoicesToDatabase();

        console.log('✅ Initial voice sync completed!');
        console.log(`   📊 Added: ${result.added} voices`);
        console.log(`   🔄 Updated: ${result.updated} voices`);
        console.log(`   📋 Total: ${result.total} voices`);

        // 显示语言统计
        const languages = await voiceSyncService.getSupportedLanguages();
        console.log(`   🌍 Languages: ${languages.length}`);

        // 显示一些示例语音
        const chineseVoices = await voiceSyncService.getVoicesFromDatabase('zh-CN', true);
        if (chineseVoices.length > 0) {
          console.log('\n📋 Sample Chinese voices:');
          chineseVoices.slice(0, 5).forEach(voice => {
            console.log(`   • ${voice.displayName} (${voice.name})`);
          });
          if (chineseVoices.length > 5) {
            console.log(`   ... and ${chineseVoices.length - 5} more`);
          }
        }

      } catch (error) {
        console.error('❌ Initial voice sync failed:', error);
        console.log('   You can manually trigger sync later via API or admin panel');
      }
    }

    console.log('\n🎯 Voice Sync System Setup Complete!');
    console.log('\n📋 Available APIs:');
    console.log('   • GET  /api/tts/voices - Get voices from database');
    console.log('   • GET  /api/tts/voices?language=zh-CN - Get voices for specific language');
    console.log('   • GET  /api/tts/voices?grouped=true - Get voices grouped by language');
    console.log('   • POST /api/admin/sync-voices - Manual sync (admin only)');
    console.log('   • GET  /api/admin/sync-voices - Sync status (admin only)');
    console.log('   • GET  /api/cron/sync-voices - Automated sync (cron job)');
    
    console.log('\n🕐 Automated Sync:');
    console.log('   • Voices are automatically synced every 24 hours');
    console.log('   • First API call will trigger sync if database is empty');
    console.log('   • Set up a cron job to call /api/cron/sync-voices daily');
    
    console.log('\n🔧 Cron Job Setup Examples:');
    console.log('   # Daily at 2 AM');
    console.log('   0 2 * * * curl -X GET https://yourdomain.com/api/cron/sync-voices');
    console.log('   ');
    console.log('   # With authentication (if CRON_SECRET is set)');
    console.log('   0 2 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/sync-voices');

    await client.end();
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// 运行设置
console.log('🎤 Voice Sync System Setup\n');
setupVoiceSync();
