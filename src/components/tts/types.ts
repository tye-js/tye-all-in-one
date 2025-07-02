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
