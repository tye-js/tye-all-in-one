// 国际化类型定义

// 支持的语言
export const locales = ['en', 'zh', 'ja'] as const;
export type Locale = typeof locales[number];

// 语言配置
export const localeConfig = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
  },
  zh: {
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    dir: 'ltr',
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    dir: 'ltr',
  },
} as const;

// 翻译类型
export type TranslationKey = string;
export type TranslationParams = Record<string, string | number>;

// 翻译函数类型
export type TFunction = (key: TranslationKey, params?: TranslationParams) => string;

// 语言方向类型
export type LanguageDirection = 'ltr' | 'rtl';

// 用户偏好接口
export interface UserPreferences {
  locale: Locale;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  dateFormat: 'short' | 'medium' | 'long';
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
}

// 默认用户偏好
export const defaultPreferences: UserPreferences = {
  locale: 'en',
  theme: 'system',
  timezone: 'UTC',
  dateFormat: 'medium',
  currency: 'USD',
  notifications: {
    email: true,
    push: true,
    marketing: false,
  },
};

// 地区检测结果
export interface RegionDetectionResult {
  country: string;
  locale: Locale;
  timezone: string;
  currency: string;
}
