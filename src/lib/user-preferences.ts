"use client"
import { useState, useEffect } from 'react';
import { type Locale } from '@/lib/i18n/types';

// 用户偏好设置接口
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
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'medium',
  currency: 'USD',
  notifications: {
    email: true,
    push: true,
    marketing: false,
  },
};

// 本地存储键名
const PREFERENCES_KEY = 'user-preferences';

// 获取用户偏好设置
export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultPreferences, ...parsed };
    }
  } catch (error) {
    console.error('Failed to parse user preferences:', error);
  }

  return defaultPreferences;
}

// 保存用户偏好设置
export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getUserPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    
    // 触发自定义事件，通知其他组件偏好已更新
    window.dispatchEvent(new CustomEvent('preferences-updated', {
      detail: updated
    }));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}

// 获取用户语言偏好
export function getUserLocale(): Locale {
  const preferences = getUserPreferences();
  return preferences.locale;
}

// 保存用户语言偏好
export function saveUserLocale(locale: Locale): void {
  saveUserPreferences({ locale });
}

// 根据 IP 地址检测用户地区（需要外部服务）
export async function detectUserRegionByIP(): Promise<{
  country: string;
  locale: Locale;
  timezone: string;
  currency: string;
}> {
  try {
    // 使用免费的 IP 地理位置服务
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    // 根据国家代码映射语言
    const countryToLocale: Record<string, Locale> = {
      'CN': 'zh',
      'TW': 'zh',
      'HK': 'zh',
      'SG': 'zh',
      'JP': 'ja',
      'US': 'en',
      'GB': 'en',
      'CA': 'en',
      'AU': 'en',
      'NZ': 'en',
    };
    
    const locale = countryToLocale[data.country_code] || 'en';
    
    return {
      country: data.country_code,
      locale,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: data.currency || 'USD',
    };
  } catch (error) {
    console.error('Failed to detect user region:', error);
    return {
      country: 'US',
      locale: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: 'USD',
    };
  }
}

// 初始化用户偏好（在应用启动时调用）
export async function initializeUserPreferences(): Promise<UserPreferences> {
  const stored = getUserPreferences();
  
  // 如果是首次访问，尝试根据 IP 检测地区
  if (stored.locale === defaultPreferences.locale && typeof window !== 'undefined') {
    try {
      const detected = await detectUserRegionByIP();
      const initialPreferences: Partial<UserPreferences> = {
        locale: detected.locale,
        timezone: detected.timezone,
        currency: detected.currency,
      };
      
      saveUserPreferences(initialPreferences);
      return { ...stored, ...initialPreferences };
    } catch (error) {
      console.error('Failed to initialize preferences with IP detection:', error);
    }
  }
  
  return stored;
}

// Hook: 使用用户偏好
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      setIsLoading(true);
      try {
        const prefs = await initializeUserPreferences();
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();

    // 监听偏好更新事件
    const handlePreferencesUpdate = (event: CustomEvent) => {
      setPreferences(event.detail);
    };

    window.addEventListener('preferences-updated', handlePreferencesUpdate as EventListener);

    return () => {
      window.removeEventListener('preferences-updated', handlePreferencesUpdate as EventListener);
    };
  }, []);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    saveUserPreferences(updates);
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  return {
    preferences,
    updatePreferences,
    isLoading,
  };
}

// 语言相关的实用函数
export function getLanguageFromAcceptLanguage(acceptLanguage: string): Locale {
  if (!acceptLanguage) return 'en';
  
  // 解析 Accept-Language 头
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);
  
  // 查找支持的语言
  for (const { code } of languages) {
    // 精确匹配
    if (['en', 'zh', 'ja'].includes(code)) {
      return code as Locale;
    }
    
    // 语言代码匹配
    const langCode = code.split('-')[0];
    if (['en', 'zh', 'ja'].includes(langCode)) {
      return langCode as Locale;
    }
  }
  
  return 'en';
}

// 服务器端语言检测
export function detectServerSideLocale(req: {
  headers: { 'accept-language'?: string };
  cookies: Record<string, string>;
}): Locale {
  // 1. 检查 cookie 中的偏好
  const cookieLocale = req.cookies['preferred-locale'];
  if (cookieLocale && ['en', 'zh', 'ja'].includes(cookieLocale)) {
    return cookieLocale as Locale;
  }
  
  // 2. 检查 Accept-Language 头
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    return getLanguageFromAcceptLanguage(acceptLanguage);
  }
  
  // 3. 默认返回英文
  return 'en';
}
