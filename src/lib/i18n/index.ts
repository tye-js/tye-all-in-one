'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  type Locale,
  type TFunction,
  type TranslationKey,
  type TranslationParams,
  locales,
  localeConfig
} from './types';

// 获取嵌套对象的值
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// 替换参数
function interpolate(template: string, params: TranslationParams = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

// 创建翻译函数
export function createTranslation(translations: any): TFunction {
  return (key: TranslationKey, params?: TranslationParams): string => {
    const value = getNestedValue(translations, key);
    
    if (typeof value === 'string') {
      return interpolate(value, params);
    }
    
    // 如果找不到翻译，返回 key
    console.warn(`Translation missing for key: ${key}`);
    return key;
  };
}

// 动态加载翻译文件
export async function loadTranslations(locale: Locale): Promise<any> {
  try {
    const translations = await import(`./locales/${locale}.json`);
    return translations.default;
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    // 回退到英文
    if (locale !== 'en') {
      return loadTranslations('en');
    }
    return {};
  }
}

// 检测用户首选语言
export function detectUserLocale(): Locale {
  // 1. 检查 localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preferred-locale');
    if (stored && locales.includes(stored as Locale)) {
      return stored as Locale;
    }
    
    // 2. 检查浏览器语言
    const browserLang = navigator.language.toLowerCase();
    
    // 精确匹配
    if (locales.includes(browserLang as Locale)) {
      return browserLang as Locale;
    }
    
    // 语言代码匹配（如 zh-CN -> zh）
    const langCode = browserLang.split('-')[0];
    if (locales.includes(langCode as Locale)) {
      return langCode as Locale;
    }
  }
  
  // 3. 默认返回英文
  return 'en';
}

// 保存用户语言偏好
export function saveUserLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred-locale', locale);
  }
}

// 获取语言方向
export function getLanguageDirection(locale: Locale): 'ltr' | 'rtl' {
  return localeConfig[locale]?.dir || 'ltr';
}

// 格式化日期
export function formatDate(date: Date | string, locale: Locale): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    return dateObj.toLocaleDateString();
  }
}

// 格式化相对时间
export function formatRelativeTime(date: Date | string, locale: Locale): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  try {
    const rtf = new Intl.RelativeTimeFormat(locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US', {
      numeric: 'auto',
    });
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    }
  } catch (error) {
    return formatDate(dateObj, locale);
  }
}

// 格式化数字
export function formatNumber(number: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US').format(number);
  } catch (error) {
    return number.toString();
  }
}

// Hook: 使用翻译 - 客户端版本
export function useTranslation() {
  const router = useRouter();
  const params = useParams();
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // 从 URL 参数或默认值获取语言
  const locale = (params?.locale as Locale) || 'en';

  useEffect(() => {
    async function loadAndSetTranslations() {
      setIsLoading(true);
      try {
        const trans = await loadTranslations(locale);
        setTranslations(trans);
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAndSetTranslations();
  }, [locale]);

  const t = createTranslation(translations);

  return {
    t,
    locale,
    isLoading,
    changeLanguage: (newLocale: Locale) => {
      saveUserLocale(newLocale);
      // 使用 next/navigation 的 router
      const currentPath = window.location.pathname;
      const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`);
      router.push(newPath);
    },
  };
}

// Hook: 使用语言切换 - 客户端版本
export function useLanguageSwitcher() {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as Locale) || 'en';

  const switchLanguage = (locale: Locale) => {
    saveUserLocale(locale);
    // 使用 next/navigation 的 router
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(`/${currentLocale}`, `/${locale}`);
    router.push(newPath);
  };

  return {
    currentLocale,
    switchLanguage,
    availableLocales: locales,
    localeConfig,
  };
}
