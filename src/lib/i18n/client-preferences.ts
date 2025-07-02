'use client';

import { useState, useEffect } from 'react';
import { type Locale, type UserPreferences, defaultPreferences } from './types';

// 本地存储键名
const PREFERENCES_KEY = 'user-preferences';

// 获取用户偏好设置 - 客户端版本
export function getClientUserPreferences(): UserPreferences {
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

// 保存用户偏好设置 - 客户端版本
export function saveClientUserPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getClientUserPreferences();
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

// 获取用户语言偏好 - 客户端版本
export function getClientUserLocale(): Locale {
  const preferences = getClientUserPreferences();
  return preferences.locale;
}

// 保存用户语言偏好 - 客户端版本
export function saveClientUserLocale(locale: Locale): void {
  saveClientUserPreferences({ locale });
}

// 检测用户首选语言 - 客户端版本
export function detectClientUserLocale(): Locale {
  // 1. 检查 localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preferred-locale');
    if (stored && ['en', 'zh', 'ja'].includes(stored)) {
      return stored as Locale;
    }
    
    // 2. 检查浏览器语言
    const browserLang = navigator.language.toLowerCase();
    
    // 精确匹配
    if (['en', 'zh', 'ja'].includes(browserLang)) {
      return browserLang as Locale;
    }
    
    // 语言代码匹配（如 zh-CN -> zh）
    const langCode = browserLang.split('-')[0];
    if (['en', 'zh', 'ja'].includes(langCode)) {
      return langCode as Locale;
    }
  }
  
  // 3. 默认返回英文
  return 'en';
}

// Hook: 使用用户偏好 - 客户端版本
export function useClientUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function loadPreferences() {
      setIsLoading(true);
      try {
        const prefs = getClientUserPreferences();
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
    saveClientUserPreferences(updates);
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  return {
    preferences,
    updatePreferences,
    isLoading,
  };
}

// 根据 IP 地址检测用户地区 - 客户端版本
export async function detectClientUserRegionByIP() {
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
      locale: 'en' as Locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: 'USD',
    };
  }
}

// 初始化用户偏好 - 客户端版本
export async function initializeClientUserPreferences(): Promise<UserPreferences> {
  const stored = getClientUserPreferences();
  
  // 如果是首次访问，尝试根据 IP 检测地区
  if (stored.locale === defaultPreferences.locale && typeof window !== 'undefined') {
    try {
      const detected = await detectClientUserRegionByIP();
      const initialPreferences: Partial<UserPreferences> = {
        locale: detected.locale,
        timezone: detected.timezone,
        currency: detected.currency,
      };
      
      saveClientUserPreferences(initialPreferences);
      return { ...stored, ...initialPreferences };
    } catch (error) {
      console.error('Failed to initialize preferences with IP detection:', error);
    }
  }
  
  return stored;
}
