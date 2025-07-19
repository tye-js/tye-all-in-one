import { db } from '@/lib/db';
import { ttsVoices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAzureConfig, getConfigStatusMessage, getConfigHelpMessage } from '@/lib/azure-config';

interface AzureVoice {
  Name: string;
  DisplayName: string;
  LocalName: string;
  ShortName: string;
  Gender: string;
  Locale: string;
  LocaleName: string;
  StyleList?: string[]; // 语音风格列表，如 ['cheerful', 'sad']
  SampleRateHertz: string;
  VoiceType: string;
  Status: string;
  VoiceTag?: {
    TailoredScenarios?: string[];
    VoicePersonalities?: string[];
    [key: string]: any;
  };
  WordsPerMinute: string;
}

export class VoiceSyncService {
  private config: ReturnType<typeof getAzureConfig>;

  constructor() {
    this.config = getAzureConfig();

    if (!this.config.isConfigured) {
      console.warn('⚠️ Azure Speech Service credentials not configured. Using fallback data.');
      console.log(getConfigStatusMessage());
      console.log(getConfigHelpMessage());
    } else {
      console.log(getConfigStatusMessage());
    }
  }

  /**
   * 从 Azure 获取所有可用语音
   */
  async fetchVoicesFromAzure(): Promise<AzureVoice[]> {
    // 检查是否有有效的凭据
    if (!this.config.isConfigured) {
      console.warn('⚠️ Azure credentials not available, using fallback voices');
      return this.getFallbackVoices();
    }

    try {
      console.log(`🔄 Fetching voices from Azure region: ${this.config.region}`);

      const response = await fetch(
        `${this.config.endpoint}/cognitiveservices/voices/list`,
        {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
          },
        }
      );

      if (!response.ok) {
        console.error(`❌ Azure API error: ${response.status} ${response.statusText}`);

        // 提供更详细的错误信息
        if (response.status === 401) {
          console.error('🔑 Authentication failed. Please check your AZURE_SPEECH_KEY.');
        } else if (response.status === 403) {
          console.error('🚫 Access forbidden. Please check your subscription and region.');
        } else if (response.status === 404) {
          console.error('🌍 Region not found. Please check your AZURE_SPEECH_REGION.');
        }

        console.log('🔄 Falling back to default voices...');
        return this.getFallbackVoices();
      }

      const voices: AzureVoice[] = await response.json();
      console.log(`✅ Fetched ${voices.length} voices from Azure`);

      return voices;
    } catch (error) {
      console.error('❌ Failed to fetch voices from Azure:', error);
      console.log('🔄 Falling back to default voices...');
      return this.getFallbackVoices();
    }
  }

  /**
   * 获取回退语音数据（当 Azure API 不可用时使用）
   */
  private getFallbackVoices(): AzureVoice[] {
    return [
      // 中文语音
      {
        Name: "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)",
        DisplayName: "Xiaoxiao",
        LocalName: "晓晓",
        ShortName: "zh-CN-XiaoxiaoNeural",
        Gender: "Female",
        Locale: "zh-CN",
        LocaleName: "Chinese (Mandarin, Simplified)",
        StyleList: ["general", "assistant", "chat", "customerservice", "newscast", "affectionate", "angry", "calm", "cheerful", "disgruntled", "fearful", "gentle", "lyrical", "sad", "serious", "poetry-reading"],
        SampleRateHertz: "24000",
        VoiceType: "Neural",
        Status: "GA",
        VoiceTag: {
          TailoredScenarios: ["General", "Assistant"],
          VoicePersonalities: ["Friendly", "Positive"]
        },
        WordsPerMinute: "200"
      },
      {
        Name: "Microsoft Server Speech Text to Speech Voice (zh-CN, YunxiNeural)",
        DisplayName: "Yunxi",
        LocalName: "云希",
        ShortName: "zh-CN-YunxiNeural",
        Gender: "Male",
        Locale: "zh-CN",
        LocaleName: "Chinese (Mandarin, Simplified)",
        StyleList: ["general", "calm", "fearful", "cheerful", "disgruntled", "serious", "angry", "sad", "depressed", "embarrassed"],
        SampleRateHertz: "24000",
        VoiceType: "Neural",
        Status: "GA",
        VoiceTag: {
          TailoredScenarios: ["General"],
          VoicePersonalities: ["Reliable", "Positive"]
        },
        WordsPerMinute: "200"
      },
      // 英文语音
      {
        Name: "Microsoft Server Speech Text to Speech Voice (en-US, JennyNeural)",
        DisplayName: "Jenny",
        LocalName: "Jenny",
        ShortName: "en-US-JennyNeural",
        Gender: "Female",
        Locale: "en-US",
        LocaleName: "English (United States)",
        StyleList: ["general", "assistant", "chat", "customerservice", "newscast", "angry", "cheerful", "sad", "excited", "friendly", "hopeful", "shouting", "terrified", "unfriendly", "whispering"],
        SampleRateHertz: "24000",
        VoiceType: "Neural",
        Status: "GA",
        VoiceTag: {
          TailoredScenarios: ["General", "Assistant"],
          VoicePersonalities: ["Friendly", "Pleasant"]
        },
        WordsPerMinute: "200"
      },
      {
        Name: "Microsoft Server Speech Text to Speech Voice (en-US, GuyNeural)",
        DisplayName: "Guy",
        LocalName: "Guy",
        ShortName: "en-US-GuyNeural",
        Gender: "Male",
        Locale: "en-US",
        LocaleName: "English (United States)",
        StyleList: ["general", "newscast", "angry", "cheerful", "sad", "excited", "friendly", "hopeful", "shouting", "terrified", "unfriendly", "whispering"],
        SampleRateHertz: "24000",
        VoiceType: "Neural",
        Status: "GA",
        VoiceTag: {
          TailoredScenarios: ["General"],
          VoicePersonalities: ["Warm", "Pleasant"]
        },
        WordsPerMinute: "200"
      },
      // 日文语音
      {
        Name: "Microsoft Server Speech Text to Speech Voice (ja-JP, NanamiNeural)",
        DisplayName: "Nanami",
        LocalName: "七海",
        ShortName: "ja-JP-NanamiNeural",
        Gender: "Female",
        Locale: "ja-JP",
        LocaleName: "Japanese (Japan)",
        StyleList: ["general", "chat", "customerservice", "cheerful"],
        SampleRateHertz: "24000",
        VoiceType: "Neural",
        Status: "GA",
        VoiceTag: {
          TailoredScenarios: ["General"],
          VoicePersonalities: ["Friendly", "Pleasant"]
        },
        WordsPerMinute: "200"
      },
      {
        Name: "Microsoft Server Speech Text to Speech Voice (ja-JP, KeitaNeural)",
        DisplayName: "Keita",
        LocalName: "圭太",
        ShortName: "ja-JP-KeitaNeural",
        Gender: "Male",
        Locale: "ja-JP",
        LocaleName: "Japanese (Japan)",
        StyleList: ["general", "cheerful", "sad"],
        SampleRateHertz: "24000",
        VoiceType: "Neural",
        Status: "GA",
        VoiceTag: {
          TailoredScenarios: ["General"],
          VoicePersonalities: ["Reliable", "Pleasant"]
        },
        WordsPerMinute: "200"
      }
    ];
  }

  /**
   * 将 Azure 语音数据转换为数据库格式
   */
  private transformVoiceData(azureVoice: AzureVoice) {
    return {
      name: azureVoice.Name,
      displayName: azureVoice.DisplayName || azureVoice.LocalName,
      localName: azureVoice.LocalName,
      shortName: azureVoice.ShortName,
      gender: azureVoice.Gender,
      locale: azureVoice.Locale,
      localeName: azureVoice.LocaleName,
      voiceType: azureVoice.VoiceType,
      status: azureVoice.Status,
      styleList: azureVoice.StyleList || [], // 语音风格列表
      voiceTag: azureVoice.VoiceTag || {}, // 语音标签信息
      sampleRateHertz: azureVoice.SampleRateHertz,
      wordsPerMinute: azureVoice.WordsPerMinute,
      isActive: azureVoice.Status === 'GA', // 只有 GA (Generally Available) 状态的语音默认激活
      lastSyncAt: new Date(),
    };
  }

  /**
   * 同步语音数据到数据库
   */
  async syncVoicesToDatabase(): Promise<{ added: number; updated: number; total: number }> {
    try {
      console.log('🔄 Starting voice synchronization...');

      // 获取 Azure 语音列表（包含回退机制）
      const azureVoices = await this.fetchVoicesFromAzure();

      if (azureVoices.length === 0) {
        console.warn('⚠️ No voices available from Azure or fallback data');
        return { added: 0, updated: 0, total: 0 };
      }

      console.log(`📝 Processing ${azureVoices.length} voices...`);
      
      let addedCount = 0;
      let updatedCount = 0;

      for (const azureVoice of azureVoices) {
        try {
          // 检查语音是否已存在
          const existingVoice = await db
            .select()
            .from(ttsVoices)
            .where(eq(ttsVoices.name, azureVoice.Name))
            .limit(1);

          const voiceData = this.transformVoiceData(azureVoice);

          if (existingVoice.length > 0) {
            // 更新现有语音
            await db
              .update(ttsVoices)
              .set({
                ...voiceData,
                updatedAt: new Date(),
              })
              .where(eq(ttsVoices.name, azureVoice.Name));
            
            updatedCount++;
          } else {
            // 添加新语音
            await db
              .insert(ttsVoices)
              .values(voiceData);
            
            addedCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to sync voice ${azureVoice.Name}:`, error);
        }
      }

      console.log(`✅ Voice sync completed: ${addedCount} added, ${updatedCount} updated`);
      
      return {
        added: addedCount,
        updated: updatedCount,
        total: azureVoices.length,
      };
    } catch (error) {
      console.error('❌ Voice synchronization failed:', error);
      throw error;
    }
  }

  /**
   * 获取数据库中的语音列表
   */
  async getVoicesFromDatabase(locale?: string, isActive?: boolean) {
    try {
      // 直接使用 Drizzle 的 sql 模板

      // 使用 Drizzle 的 sql 模板执行原生查询
      const { sql } = await import('drizzle-orm');

      // 构建带参数的查询 - 使用模板字符串方式
      let query;
      if (!locale && isActive === undefined) {
        query = sql`
          SELECT
            locale,
            JSONB_AGG(
              JSON_BUILD_OBJECT(
                'name', name,
                'displayName', display_name,
                'shortName', short_name,
                'gender', gender,
                'localeName', locale_name,
                'voiceType', voice_type,
                'status', status,
                'sampleRateHertz', sample_rate_hertz,
                'wordsPerMinute', words_per_minute,
                'localName', local_name,
                'styleList', style_list,
                'voiceTag', voice_tag,
                'isActive', is_active
              )
            ) AS voices
          FROM tts_voices
          GROUP BY locale
          ORDER BY locale ASC
        `;
      } else if (locale && isActive !== undefined) {
        query = sql`
          SELECT
            locale,
            JSONB_AGG(
              JSON_BUILD_OBJECT(
                'name', name,
                'displayName', display_name,
                'shortName', short_name,
                'gender', gender,
                'localeName', locale_name,
                'voiceType', voice_type,
                'status', status,
                'sampleRateHertz', sample_rate_hertz,
                'wordsPerMinute', words_per_minute,
                'localName', local_name,
                'styleList', style_list,
                'voiceTag', voice_tag,
                'isActive', is_active
              )
            ) AS voices
          FROM tts_voices
          WHERE locale = ${locale} AND is_active = ${isActive}
          GROUP BY locale
          ORDER BY locale ASC
        `;
      } else if (locale) {
        query = sql`
          SELECT
            locale,
            JSONB_AGG(
              JSON_BUILD_OBJECT(
                'name', name,
                'displayName', display_name,
                'shortName', short_name,
                'gender', gender,
                'localeName', locale_name,
                'voiceType', voice_type,
                'status', status,
                'sampleRateHertz', sample_rate_hertz,
                'wordsPerMinute', words_per_minute,
                'localName', local_name,
                'styleList', style_list,
                'voiceTag', voice_tag,
                'isActive', is_active
              )
            ) AS voices
          FROM tts_voices
          WHERE locale = ${locale}
          GROUP BY locale
          ORDER BY locale ASC
        `;
      } else if (isActive !== undefined) {
        query = sql`
          SELECT
            locale,
            JSONB_AGG(
              JSON_BUILD_OBJECT(
                'name', name,
                'displayName', display_name,
                'shortName', short_name,
                'gender', gender,
                'localeName', locale_name,
                'voiceType', voice_type,
                'status', status,
                'sampleRateHertz', sample_rate_hertz,
                'wordsPerMinute', words_per_minute,
                'localName', local_name,
                'styleList', style_list,
                'voiceTag', voice_tag,
                'isActive', is_active
              )
            ) AS voices
          FROM tts_voices
          WHERE is_active = ${isActive}
          GROUP BY locale
          ORDER BY locale ASC
        `;
      }

      const result = await db.execute(query!);

      // Drizzle 返回的是一个数组，直接使用
      const rows = Array.isArray(result) ? result : [];

      console.log(`✅ Found ${rows.length} locales with voices from database`);
      console.log('Query result structure:', {
        resultType: typeof result,
        isArray: Array.isArray(result),
        rowsLength: rows.length,
        firstRowKeys: rows.length > 0 ? Object.keys(rows[0]) : []
      });

      return rows;
    } catch (error) {
      console.error('❌ Failed to get voices from database:', error);
      throw error;
    }
  }

  // /**
  //  * 按语言分组获取语音
  //  */
  // async getVoicesByLanguage(isActive: boolean = true,locale?: string) {
  //   try {
  //     const voices = await this.getVoicesFromDatabase(locale, isActive);
      
  //     const groupedVoices: Record<string, typeof voices> = {};
      
  //     voices.forEach(voice => {
  //       if (!groupedVoices[voice.locale]) {
  //         groupedVoices[voice.locale] = [];
  //       }
  //       groupedVoices[voice.locale].push(voice);
  //     });
      
  //     return groupedVoices;
  //   } catch (error) {
  //     console.error('❌ Failed to group voices by language:', error);
  //     throw error;
  //   }
  // }

  /**
   * 检查是否需要同步（距离上次同步超过指定时间）
   */
  async shouldSync(maxAgeHours: number = 24): Promise<boolean> {
    try {
      const latestVoice = await db
        .select()
        .from(ttsVoices)
        .orderBy(ttsVoices.lastSyncAt)
        .limit(1);

      if (latestVoice.length === 0) {
        return true; // 没有语音数据，需要同步
      }

      const lastSyncTime = new Date(latestVoice[0].lastSyncAt);
      const now = new Date();
      const hoursSinceLastSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastSync >= maxAgeHours;
    } catch (error) {
      console.error('❌ Failed to check sync status:', error);
      return true; // 出错时默认需要同步
    }
  }

  /**
   * 获取支持的语言列表
   */
  async getSupportedLanguages() {
    try {
      const result = await db
        .selectDistinct({
          locale: ttsVoices.locale,
          localeName: ttsVoices.localeName,
        })
        .from(ttsVoices)
        .where(eq(ttsVoices.isActive, true))
        .orderBy(ttsVoices.locale);

      return result;
    } catch (error) {
      console.error('❌ Failed to get supported languages:', error);
      throw error;
    }
  }
}

// 单例实例
export const voiceSyncService = new VoiceSyncService();
