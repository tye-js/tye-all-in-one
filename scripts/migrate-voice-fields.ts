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

async function migrateVoiceFields() {
  try {
    console.log('🔧 Migrating TTS voices table to add new fields...\n');
    
    const client = postgres(DATABASE_URL, { prepare: false });

    console.log('📊 Adding new columns to tts_voices table...');
    
    try {
      // 添加 local_name 字段
      await client`
        ALTER TABLE tts_voices 
        ADD COLUMN IF NOT EXISTS local_name VARCHAR(200);
      `;
      console.log('✅ Added local_name column');

      // 添加 style_list 字段
      await client`
        ALTER TABLE tts_voices 
        ADD COLUMN IF NOT EXISTS style_list JSONB;
      `;
      console.log('✅ Added style_list column');

      // 添加 voice_tag 字段
      await client`
        ALTER TABLE tts_voices 
        ADD COLUMN IF NOT EXISTS voice_tag JSONB;
      `;
      console.log('✅ Added voice_tag column');

      // 创建新字段的索引
      await client`
        CREATE INDEX IF NOT EXISTS idx_tts_voices_style_list ON tts_voices USING GIN(style_list);
      `;
      console.log('✅ Created style_list index');

      await client`
        CREATE INDEX IF NOT EXISTS idx_tts_voices_voice_tag ON tts_voices USING GIN(voice_tag);
      `;
      console.log('✅ Created voice_tag index');

    } catch (error) {
      console.log('⚠️  Column addition failed (may already exist):', error);
    }

    console.log('\n🔄 Re-syncing voices to populate new fields...');
    
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
        
        // 重新同步语音以填充新字段
        const result = await voiceSyncService.syncVoicesToDatabase();
        
        console.log('✅ Voice re-sync completed!');
        console.log(`   📊 Added: ${result.added} voices`);
        console.log(`   🔄 Updated: ${result.updated} voices`);
        console.log(`   📋 Total: ${result.total} voices`);
        
        // 检查新字段的数据
        const voicesWithStyles = await client`
          SELECT COUNT(*) as count 
          FROM tts_voices 
          WHERE style_list IS NOT NULL AND jsonb_array_length(style_list) > 0
        `;
        
        const voicesWithTags = await client`
          SELECT COUNT(*) as count 
          FROM tts_voices 
          WHERE voice_tag IS NOT NULL AND voice_tag != '{}'::jsonb
        `;
        
        console.log(`\n📊 New field statistics:`);
        console.log(`   🎭 Voices with styles: ${voicesWithStyles[0].count}`);
        console.log(`   🏷️  Voices with tags: ${voicesWithTags[0].count}`);
        
        // 显示一些有风格的语音示例
        const styledVoices = await client`
          SELECT name, display_name, style_list 
          FROM tts_voices 
          WHERE style_list IS NOT NULL AND jsonb_array_length(style_list) > 0
          LIMIT 5
        `;
        
        if (styledVoices.length > 0) {
          console.log('\n🎭 Sample voices with styles:');
          styledVoices.forEach(voice => {
            try {
              const styles = Array.isArray(voice.style_list) ? voice.style_list : JSON.parse(voice.style_list);
              console.log(`   • ${voice.display_name}: [${styles.join(', ')}]`);
            } catch (error) {
              console.log(`   • ${voice.display_name}: ${voice.style_list}`);
            }
          });
        }
        
      } catch (error) {
        console.error('❌ Voice re-sync failed:', error);
      }
    }

    console.log('\n🎯 Migration completed!');
    console.log('\n📋 New features available:');
    console.log('   • StyleList: 语音风格支持 (如 cheerful, sad)');
    console.log('   • VoiceTag: 语音标签信息 (场景和个性)');
    console.log('   • LocalName: 本地化名称');
    console.log('   • 更完整的语音元数据');

    await client.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// 运行迁移
console.log('🔧 TTS Voices Table Migration\n');
migrateVoiceFields();
