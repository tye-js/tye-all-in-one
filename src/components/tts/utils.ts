import { TTSSettings, TTSFormData } from './types';

export const createTTSFormData = (
  text: string,
  settings: TTSSettings
): TTSFormData => {
  return {
    text,
    language: settings.selectedLanguage,
    voice: settings.selectedVoice,
    speakingRate: settings.speakingRate[0],
    pitch: settings.pitch[0],
    // SSML 配置选项 - 将 "default" 转换为空字符串
    style: settings.selectedStyle === "default" ? "" : settings.selectedStyle,
    volume: settings.volume[0],
    quality: settings.quality,
    emotionIntensity: settings.emotionIntensity[0],
    useSSML: settings.useSSML,
  };
};

export const getDefaultSettings = (): TTSSettings => {
  return {
    selectedLanguage: 'zh-CN',
    selectedVoice: 'zh-CN-XiaoxiaoNeural',
    selectedStyle: '',
    speakingRate: [1.0],
    pitch: [0.0],
    volume: [100],
    quality: 'high',
    emotionIntensity: [1.0],
    useSSML: false,
  };
};
