import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Azure Speech Service configuration
function getAzureConfig() {
  const subscriptionKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!subscriptionKey || !region) {
    throw new Error('Azure Speech Service not configured. Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables.');
  }

  return { subscriptionKey, region };
}

export interface TTSOptions {
  text: string;
  languageCode?: string;
  voiceName?: string;
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  speakingRate?: number;
  pitch?: number;
}

export interface TTSResult {
  audioUrl: string;
  duration?: number;
  fileSize: number;
}

import { voiceSyncService } from './voice-sync';

// 这些常量现在主要用于向后兼容和默认值
export const DEFAULT_LANGUAGE = 'zh-CN';
export const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';

export async function synthesizeSpeech(options: TTSOptions): Promise<TTSResult> {
  const { subscriptionKey, region } = getAzureConfig();

  const {
    text,
    languageCode = 'zh-CN',
    voiceName = 'zh-CN-XiaoxiaoNeural',
    audioEncoding = 'MP3',
    speakingRate = 1.0,
    pitch = 0.0,
  } = options;

  try {
    // 构建 SSML
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${languageCode}">
        <voice name="${voiceName}">
          <prosody rate="${speakingRate}" pitch="${pitch > 0 ? '+' : ''}${pitch}%">
            ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </prosody>
        </voice>
      </speak>
    `;

    // 调用 Azure Speech Service API
    const response = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'NextJS-TTS-App',
        },
        body: ssml,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Speech API error:', response.status, errorText);
      throw new Error(`Azure Speech API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('No audio content received from Azure Speech Service');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'tts');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const filename = `${uuidv4()}.mp3`;
    const filepath = join(uploadsDir, filename);

    // Write audio file
    writeFileSync(filepath, Buffer.from(audioBuffer));

    // Get file size
    const fileSize = audioBuffer.byteLength;

    return {
      audioUrl: `/uploads/tts/${filename}`,
      fileSize,
    };
  } catch (error) {
    console.error('TTS synthesis error:', error);
    throw new Error('Failed to synthesize speech');
  }
}



/**
 * 获取指定语言的语音列表
 */
export async function getVoicesForLanguage(languageCode?: string) {
  try {
    return await voiceSyncService.getVoicesFromDatabase(languageCode, true);
  } catch (error) {
    console.error('Error getting voices for language:', error);
    return [];
  }
}

/**
 * 获取所有支持的语言
 */
export async function getSupportedLanguages() {
  try {
    return await voiceSyncService.getSupportedLanguages();
  } catch (error) {
    console.error('Error getting supported languages:', error);
    return [];
  }
}

/**
 * 按语言分组获取语音
 */
export async function getVoicesByLanguage() {
  try {
    return await voiceSyncService.getVoicesByLanguage(true);
  } catch (error) {
    console.error('Error getting voices by language:', error);
    return {};
  }
}
