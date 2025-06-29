import { db } from '@/lib/db';
import { ttsVoices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
  private subscriptionKey: string;
  private region: string;

  constructor() {
    this.subscriptionKey = process.env.AZURE_SPEECH_KEY || '';
    this.region = process.env.AZURE_SPEECH_REGION || '';
    
    if (!this.subscriptionKey || !this.region) {
      throw new Error('Azure Speech Service credentials not configured');
    }
  }

  /**
   * 从 Azure 获取所有可用语音
   */
  async fetchVoicesFromAzure(): Promise<AzureVoice[]> {
    try {
      const response = await fetch(
        `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
        {
          method: 'GET',
          headers: {
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Azure API error: ${response.status} ${response.statusText}`);
      }

      const voices: AzureVoice[] = await response.json();
      console.log(`✅ Fetched ${voices.length} voices from Azure`);
      console.log(voices);
      
      return voices;
    } catch (error) {
      console.error('❌ Failed to fetch voices from Azure:', error);
      throw error;
    }
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
      
      // 获取 Azure 语音列表
      const azureVoices = await this.fetchVoicesFromAzure();
      
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
