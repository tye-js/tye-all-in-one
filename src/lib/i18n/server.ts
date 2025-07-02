// 服务端翻译工具 - 不依赖客户端 API
import { type Locale } from './types';

// 获取嵌套对象的值
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// 替换参数
function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

// 服务端翻译函数
export function createServerTranslation(translations: any) {
  return (key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(translations, key);
    
    if (typeof value === 'string') {
      return interpolate(value, params);
    }
    
    // 如果找不到翻译，返回 key
    console.warn(`Translation missing for key: ${key}`);
    return key;
  };
}

// 服务端加载翻译文件
export async function loadServerTranslations(locale: Locale): Promise<any> {
  try {
    // 使用动态导入
    const translations = await import(`./locales/${locale}.json`);
    return translations.default || translations;
  } catch (error) {
    console.error(`Failed to load translations for locale: ${locale}`, error);
    // 回退到英文
    if (locale !== 'en') {
      return loadServerTranslations('en');
    }
    return {};
  }
}

// 服务端语言检测
export function detectServerLocale(req: {
  headers: { 'accept-language'?: string };
  cookies: Record<string, string>;
}): Locale {
  const locales: Locale[] = ['en', 'zh', 'ja'];
  
  // 1. 检查 cookie 中的偏好
  const cookieLocale = req.cookies['preferred-locale'];
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }
  
  // 2. 检查 Accept-Language 头
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
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
      if (locales.includes(code as Locale)) {
        return code as Locale;
      }
      
      // 语言代码匹配
      const langCode = code.split('-')[0];
      if (locales.includes(langCode as Locale)) {
        return langCode as Locale;
      }
    }
  }
  
  // 3. 默认返回英文
  return 'en';
}

// 格式化日期 - 服务端版本
export function formatServerDate(date: Date | string, locale: Locale): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return new Intl.DateTimeFormat(
      locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    ).format(dateObj);
  } catch (error) {
    return dateObj.toLocaleDateString();
  }
}

// 格式化数字 - 服务端版本
export function formatServerNumber(number: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(
      locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US'
    ).format(number);
  } catch (error) {
    return number.toString();
  }
}
