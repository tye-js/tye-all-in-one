export interface Voice {
  name: string;
  displayName: string;
  shortName: string;
  gender: string;
  locale: string;
  localName: string;
  localeName: string;
  voiceType: string;
  status: string;
  styleList: string[];
}

export interface VoiceList {
  locale: string;
  voices: Voice[];
}

export interface TTSResult {
  id: string;
  audioUrl: string;
  fileSize: number;
  duration?: number;
  status: string;
}

export interface TTSSettings {
  selectedLanguage: string;
  selectedVoice: string;
  selectedStyle: string;
  speakingRate: number[];
  pitch: number[];
  volume: number[];
  quality: string;
  emotionIntensity: number[];
  useSSML: boolean;
}

export interface TTSFormData {
  text: string;
  language: string;
  voice: string;
  speakingRate: number;
  pitch: number;
  style?: string;
  volume?: number;
  quality?: string;
  emotionIntensity?: number;
  useSSML?: boolean;
}

// SSML Pro 编辑器相关类型
export interface SSMLSegment {
  id: string;
  text: string;
  voice?: string;
  style?: string;
  rate?: string | number;
  pitch?: string | number;
  volume?: string | number;
  breakTime?: string;
  startIndex: number;
  endIndex: number;
}

export interface SSMLProSettings {
  segments: SSMLSegment[];
  globalVoice: string;
  globalLanguage: string;
}

export interface VoiceStyle {
  name: string;
  displayName: string;
  description: string;
}

export interface SSMLTag {
  name: string;
  displayName: string;
  description: string;
  attributes: SSMLAttribute[];
  example: string;
}

export interface SSMLAttribute {
  name: string;
  type: 'string' | 'number' | 'select';
  options?: string[];
  min?: number;
  max?: number;
  default?: string | number;
  description: string;
}
