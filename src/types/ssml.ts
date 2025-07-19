export interface VoiceCharacter {
  id: string;
  name: string;
  voice: string;
  language: string;
  style?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  description?: string;
  avatar?: string;
  color?: string;
}

export interface SSMLSegment {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  characterId?: string; // 关联的角色ID
  voice?: string;
  style?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  breakTime?: string;
}

export interface SSMLSettings {
  globalVoice: string;
  globalLanguage: string;
  characters: VoiceCharacter[];
  segments: SSMLSegment[];
}

export interface VoiceOption {
  shortName: string;
  displayName: string;
  localName: string;
  locale: string;
  localeName: string;
  gender: string;
  styleList: string[];
  voiceType: string;
}
