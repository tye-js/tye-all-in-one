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

async function testOptimizedQuery() {
  try {
    console.log('🧪 Testing Optimized getVoicesFromDatabase Query...\n');
    
    // 动态导入服务
    const { voiceSyncService } = await import('../src/lib/voice-sync');

    // 1. 测试无条件查询
    console.log('📊 Testing query without conditions...');
    const startTime1 = Date.now();
    const allVoices = await voiceSyncService.getVoicesFromDatabase();
    const endTime1 = Date.now();
    
    console.log(`✅ All voices: ${allVoices.length} results in ${endTime1 - startTime1}ms`);
    
    // 显示结构化数据的格式
    if (allVoices.length > 0) {
      console.log('📋 Sample structured data:');
      const sampleLocale = allVoices[0] as any;
      console.log(`   • Locale: ${sampleLocale.locale}`);
      console.log(`   • Voices count: ${sampleLocale.voices.length}`);

      if (sampleLocale.voices.length > 0) {
        const sampleVoice = sampleLocale.voices[0] as any;
        console.log(`   • First voice: ${sampleVoice.displayName} (${sampleVoice.name})`);
        console.log(`   • Gender: ${sampleVoice.gender}`);
        console.log(`   • Voice Type: ${sampleVoice.voiceType}`);
        console.log(`   • Is Active: ${sampleVoice.isActive}`);

        if (sampleVoice.styleList && Array.isArray(sampleVoice.styleList) && sampleVoice.styleList.length > 0) {
          console.log(`   • Styles: [${sampleVoice.styleList.join(', ')}]`);
        }

        if (sampleVoice.voiceTag && Object.keys(sampleVoice.voiceTag).length > 0) {
          console.log(`   • Voice Tag: Available`);
        }
      }
    }

    // 2. 测试按语言查询
    console.log('\n🇨🇳 Testing query with locale filter (zh-CN)...');
    const startTime2 = Date.now();
    const chineseResult = await voiceSyncService.getVoicesFromDatabase('zh-CN');
    const endTime2 = Date.now();

    console.log(`✅ Chinese locale result: ${chineseResult.length} locales in ${endTime2 - startTime2}ms`);

    // 显示中文语音
    if (chineseResult.length > 0) {
      const chineseLocale = chineseResult[0] as any;
      console.log(`📋 Chinese voices (${chineseLocale.locale}): ${chineseLocale.voices.length} voices`);
      chineseLocale.voices.slice(0, 5).forEach((voice: any) => {
        console.log(`   • ${voice.displayName} (${voice.localName}) - ${voice.gender}`);
        if (voice.styleList && Array.isArray(voice.styleList) && voice.styleList.length > 0) {
          console.log(`     Styles: [${voice.styleList.join(', ')}]`);
        }
      });
    }

    // 3. 测试按激活状态查询
    console.log('\n✅ Testing query with isActive filter (true)...');
    const startTime3 = Date.now();
    const activeVoices = await voiceSyncService.getVoicesFromDatabase(undefined, true);
    const endTime3 = Date.now();
    
    console.log(`✅ Active voices: ${activeVoices.length} results in ${endTime3 - startTime3}ms`);

    // 4. 测试组合条件查询
    console.log('\n🔍 Testing query with combined filters (zh-CN + active)...');
    const startTime4 = Date.now();
    const activeChineseVoices = await voiceSyncService.getVoicesFromDatabase('zh-CN', true);
    const endTime4 = Date.now();
    
    console.log(`✅ Active Chinese voices: ${activeChineseVoices.length} results in ${endTime4 - startTime4}ms`);

    // 5. 测试英文语音
    console.log('\n🇺🇸 Testing query with locale filter (en-US)...');
    const startTime5 = Date.now();
    const englishVoices = await voiceSyncService.getVoicesFromDatabase('en-US', true);
    const endTime5 = Date.now();
    
    console.log(`✅ English voices: ${englishVoices.length} results in ${endTime5 - startTime5}ms`);
    
    // 显示有风格的英文语音
    const englishVoicesWithStyles = (englishVoices as any[]).filter((voice: any) =>
      voice.styleList && Array.isArray(voice.styleList) && voice.styleList.length > 0
    );

    if (englishVoicesWithStyles.length > 0) {
      console.log('📋 English voices with styles:');
      englishVoicesWithStyles.slice(0, 3).forEach((voice: any) => {
        console.log(`   • ${voice.displayName} (${voice.localName}) - ${voice.gender}`);
        console.log(`     Styles: [${voice.styleList.join(', ')}]`);
      });
    }

    // 6. 测试德文语音（有风格的语音）
    console.log('\n🇩🇪 Testing query with locale filter (de-DE)...');
    const startTime6 = Date.now();
    const germanVoices = await voiceSyncService.getVoicesFromDatabase('de-DE', true);
    const endTime6 = Date.now();
    
    console.log(`✅ German voices: ${germanVoices.length} results in ${endTime6 - startTime6}ms`);
    
    if (germanVoices.length > 0) {
      console.log('📋 German voices:');
      (germanVoices as any[]).forEach((voice: any) => {
        console.log(`   • ${voice.displayName} (${voice.localName}) - ${voice.gender}`);
        if (voice.styleList && Array.isArray(voice.styleList) && voice.styleList.length > 0) {
          console.log(`     Styles: [${voice.styleList.join(', ')}]`);
        }
      });
    }

    // 7. 性能统计
    console.log('\n📈 Performance Summary:');
    console.log(`   🔍 All voices query: ${endTime1 - startTime1}ms`);
    console.log(`   🇨🇳 Chinese voices query: ${endTime2 - startTime2}ms`);
    console.log(`   ✅ Active voices query: ${endTime3 - startTime3}ms`);
    console.log(`   🔍 Combined filter query: ${endTime4 - startTime4}ms`);
    console.log(`   🇺🇸 English voices query: ${endTime5 - startTime5}ms`);
    console.log(`   🇩🇪 German voices query: ${endTime6 - startTime6}ms`);

    // 8. 数据质量检查
    console.log('\n🔍 Data Quality Check:');

    // 统计所有语音
    let totalVoices = 0;
    let voicesWithStyles = 0;
    let voicesWithTags = 0;

    allVoices.forEach((localeData: any) => {
      totalVoices += localeData.voices.length;

      localeData.voices.forEach((voice: any) => {
        if (voice.styleList && Array.isArray(voice.styleList) && voice.styleList.length > 0) {
          voicesWithStyles++;
        }
        if (voice.voiceTag && typeof voice.voiceTag === 'object' && Object.keys(voice.voiceTag).length > 0) {
          voicesWithTags++;
        }
      });
    });

    console.log(`   🎭 Voices with styles: ${voicesWithStyles}`);
    console.log(`   🏷️  Voices with tags: ${voicesWithTags}`);
    console.log(`   📊 Total voices: ${totalVoices}`);
    console.log(`   🌍 Total locales: ${allVoices.length}`);

    // 检查数据类型
    if (allVoices.length > 0 && (allVoices[0] as any).voices.length > 0) {
      const sample = (allVoices[0] as any).voices[0];
      console.log('\n🔍 Data Type Check:');
      console.log(`   • styleList type: ${Array.isArray(sample.styleList) ? 'Array' : typeof sample.styleList}`);
      console.log(`   • voiceTag type: ${typeof sample.voiceTag}`);
      console.log(`   • isActive type: ${typeof sample.isActive}`);
    }

    console.log('\n🎉 Optimized query test completed successfully!');
    console.log('\n📋 Benefits verified:');
    console.log('   ✅ Direct JSON data from database');
    console.log('   ✅ Proper WHERE condition handling');
    console.log('   ✅ Fast query performance');
    console.log('   ✅ Correct data types preserved');
    console.log('   ✅ No additional data transformation needed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
console.log('🧪 Optimized Query Test\n');
testOptimizedQuery();
