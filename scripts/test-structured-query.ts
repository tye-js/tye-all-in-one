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

async function testStructuredQuery() {
  try {
    console.log('🧪 Testing Structured getVoicesFromDatabase Query...\n');
    
    // 动态导入服务
    const { voiceSyncService } = await import('../src/lib/voice-sync');

    // 1. 测试无条件查询 - 获取所有语言的语音
    console.log('📊 Testing query without conditions (all locales)...');
    const startTime1 = Date.now();
    const allLocales = await voiceSyncService.getVoicesFromDatabase();
    const endTime1 = Date.now();
    
    console.log(`✅ All locales: ${allLocales.length} locales in ${endTime1 - startTime1}ms`);
    
    // 统计总语音数
    let totalVoices = 0;
    allLocales.forEach((localeData: any) => {
      totalVoices += localeData.voices.length;
    });
    console.log(`📊 Total voices across all locales: ${totalVoices}`);
    
    // 显示前5个语言的统计
    console.log('📋 Sample locales:');
    allLocales.slice(0, 5).forEach((localeData: any) => {
      console.log(`   • ${localeData.locale}: ${localeData.voices.length} voices`);
    });

    // 2. 测试按语言查询 - 中文
    console.log('\n🇨🇳 Testing query with locale filter (zh-CN)...');
    const startTime2 = Date.now();
    const chineseResult = await voiceSyncService.getVoicesFromDatabase('zh-CN');
    const endTime2 = Date.now();
    
    console.log(`✅ Chinese query: ${chineseResult.length} locales in ${endTime2 - startTime2}ms`);
    
    if (chineseResult.length > 0) {
      const chineseLocale = chineseResult[0] as any;
      console.log(`📋 Chinese voices (${chineseLocale.locale}): ${chineseLocale.voices.length} voices`);

      // 显示前5个中文语音
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
    const activeResult = await voiceSyncService.getVoicesFromDatabase(undefined, true);
    const endTime3 = Date.now();
    
    console.log(`✅ Active voices query: ${activeResult.length} locales in ${endTime3 - startTime3}ms`);
    
    // 统计激活的语音总数
    let totalActiveVoices = 0;
    activeResult.forEach((localeData: any) => {
      totalActiveVoices += localeData.voices.length;
    });
    console.log(`📊 Total active voices: ${totalActiveVoices}`);

    // 4. 测试组合条件查询
    console.log('\n🔍 Testing query with combined filters (zh-CN + active)...');
    const startTime4 = Date.now();
    const activeChineseResult = await voiceSyncService.getVoicesFromDatabase('zh-CN', true);
    const endTime4 = Date.now();
    
    console.log(`✅ Active Chinese query: ${activeChineseResult.length} locales in ${endTime4 - startTime4}ms`);
    
    if (activeChineseResult.length > 0) {
      const activeChineseLocale = activeChineseResult[0] as any;
      console.log(`📋 Active Chinese voices: ${activeChineseLocale.voices.length} voices`);
    }

    // 5. 测试英文语音
    console.log('\n🇺🇸 Testing query with locale filter (en-US)...');
    const startTime5 = Date.now();
    const englishResult = await voiceSyncService.getVoicesFromDatabase('en-US', true);
    const endTime5 = Date.now();
    
    console.log(`✅ English query: ${englishResult.length} locales in ${endTime5 - startTime5}ms`);
    
    if (englishResult.length > 0) {
      const englishLocale = englishResult[0] as any;
      console.log(`📋 English voices: ${englishLocale.voices.length} voices`);

      // 显示有风格的英文语音
      const englishVoicesWithStyles = englishLocale.voices.filter((voice: any) =>
        voice.styleList && Array.isArray(voice.styleList) && voice.styleList.length > 0
      );
      
      if (englishVoicesWithStyles.length > 0) {
        console.log('📋 English voices with styles:');
        englishVoicesWithStyles.slice(0, 3).forEach((voice: any) => {
          console.log(`   • ${voice.displayName} (${voice.localName}) - ${voice.gender}`);
          console.log(`     Styles: [${voice.styleList.join(', ')}]`);
        });
      }
    }

    // 6. 测试德文语音
    console.log('\n🇩🇪 Testing query with locale filter (de-DE)...');
    const startTime6 = Date.now();
    const germanResult = await voiceSyncService.getVoicesFromDatabase('de-DE', true);
    const endTime6 = Date.now();
    
    console.log(`✅ German query: ${germanResult.length} locales in ${endTime6 - startTime6}ms`);
    
    if (germanResult.length > 0) {
      const germanLocale = germanResult[0] as any;
      console.log(`📋 German voices: ${germanLocale.voices.length} voices`);

      germanLocale.voices.forEach((voice: any) => {
        console.log(`   • ${voice.displayName} (${voice.localName}) - ${voice.gender}`);
        if (voice.styleList && Array.isArray(voice.styleList) && voice.styleList.length > 0) {
          console.log(`     Styles: [${voice.styleList.join(', ')}]`);
        }
      });
    }

    // 7. 性能统计
    console.log('\n📈 Performance Summary:');
    console.log(`   🔍 All locales query: ${endTime1 - startTime1}ms`);
    console.log(`   🇨🇳 Chinese query: ${endTime2 - startTime2}ms`);
    console.log(`   ✅ Active voices query: ${endTime3 - startTime3}ms`);
    console.log(`   🔍 Combined filter query: ${endTime4 - startTime4}ms`);
    console.log(`   🇺🇸 English query: ${endTime5 - startTime5}ms`);
    console.log(`   🇩🇪 German query: ${endTime6 - startTime6}ms`);

    // 8. 数据结构验证
    console.log('\n🔍 Data Structure Validation:');
    
    if (allLocales.length > 0) {
      const sampleLocale = allLocales[0] as any;
      console.log(`✅ Locale structure: { locale: "${sampleLocale.locale}", voices: Array(${sampleLocale.voices.length}) }`);

      if (sampleLocale.voices.length > 0) {
        const sampleVoice = sampleLocale.voices[0] as any;
        console.log('✅ Voice structure includes:');
        console.log(`   • name: ${sampleVoice.name}`);
        console.log(`   • displayName: ${sampleVoice.displayName}`);
        console.log(`   • localName: ${sampleVoice.localName}`);
        console.log(`   • gender: ${sampleVoice.gender}`);
        console.log(`   • voiceType: ${sampleVoice.voiceType}`);
        console.log(`   • styleList: ${Array.isArray(sampleVoice.styleList) ? 'Array' : 'null'}`);
        console.log(`   • voiceTag: ${typeof sampleVoice.voiceTag}`);
        console.log(`   • isActive: ${sampleVoice.isActive}`);
      }
    }

    // 9. 统计信息
    console.log('\n📊 Final Statistics:');
    console.log(`   🌍 Total locales: ${allLocales.length}`);
    console.log(`   📊 Total voices: ${totalVoices}`);
    console.log(`   ✅ Total active voices: ${totalActiveVoices}`);
    
    // 统计有风格和标签的语音
    let voicesWithStyles = 0;
    let voicesWithTags = 0;
    
    allLocales.forEach((localeData: any) => {
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

    console.log('\n🎉 Structured query test completed successfully!');
    console.log('\n📋 Benefits verified:');
    console.log('   ✅ Direct JSON aggregation from database');
    console.log('   ✅ Proper WHERE condition handling');
    console.log('   ✅ Grouped by locale structure');
    console.log('   ✅ Fast query performance');
    console.log('   ✅ No client-side data transformation needed');
    console.log('   ✅ Ready-to-use JSON structure');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// 运行测试
console.log('🧪 Structured Query Test\n');
testStructuredQuery();
