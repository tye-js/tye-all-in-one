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

async function fixVoiceTable() {
  try {
    console.log('🔧 Fixing TTS voices table structure...\n');
    
    const client = postgres(DATABASE_URL!, { prepare: false });

    console.log('📊 Updating locale column length...');
    
    try {
      // 修改 locale 字段长度
      await client`
        ALTER TABLE tts_voices 
        ALTER COLUMN locale TYPE VARCHAR(20);
      `;
      
      console.log('✅ Locale column updated successfully');
    } catch (error) {
      console.log('⚠️  Locale column update failed (may already be correct):', error);
    }

    console.log('\n🔄 Re-syncing failed voices...');
    
    // 检查 Azure 配置
    const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
    const azureSpeechRegion = process.env.AZURE_SPEECH_REGION;
    
    if (!azureSpeechKey || !azureSpeechRegion) {
      console.log('⚠️  Azure Speech Service not configured');
      console.log('   Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local');
    } else {
      try {
        // 动态导入 voiceSyncService
        const { voiceSyncService } = await import('../src/lib/voice-sync');
        
        // 重新同步语音
        const result = await voiceSyncService.syncVoicesToDatabase();
        
        console.log('✅ Voice re-sync completed!');
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
        
        // 显示方言语音
        const dialectVoices = await voiceSyncService.getVoicesFromDatabase('zh-CN-guangxi', true);
        if (dialectVoices.length > 0) {
          console.log('\n📋 Sample dialect voices:');
          dialectVoices.forEach(voice => {
            console.log(`   • ${voice.displayName} (${voice.locale})`);
          });
        }
        
      } catch (error) {
        console.error('❌ Voice re-sync failed:', error);
      }
    }

    console.log('\n🎯 Table fix completed!');

    await client.end();
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// 运行修复
console.log('🔧 TTS Voices Table Fix\n');
fixVoiceTable();
