/**
 * 字体优化配置
 * 
 * 这个文件包含了与 Turbopack 兼容的字体优化设置
 * 使用 next/font/google 确保最佳性能和兼容性
 */

// 字体显示策略
export const FONT_DISPLAY_STRATEGIES = {
  SWAP: 'swap', // 推荐：立即显示回退字体，字体加载完成后替换
  OPTIONAL: 'optional', // 可选：如果字体在短时间内加载完成则使用，否则使用回退字体
  FALLBACK: 'fallback', // 回退：短暂显示回退字体，然后切换到自定义字体
  BLOCK: 'block', // 阻塞：等待字体加载完成（不推荐）
  AUTO: 'auto', // 自动：浏览器默认行为
} as const;

// 字体子集配置
export const FONT_SUBSETS = {
  LATIN: 'latin',
  LATIN_EXT: 'latin-ext',
  CYRILLIC: 'cyrillic',
  CYRILLIC_EXT: 'cyrillic-ext',
  GREEK: 'greek',
  GREEK_EXT: 'greek-ext',
  VIETNAMESE: 'vietnamese',
} as const;

// 系统回退字体
export const SYSTEM_FONTS = {
  SANS: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Open Sans',
    'Helvetica Neue',
    'sans-serif',
  ],
  MONO: [
    'ui-monospace',
    'SFMono-Regular',
    'SF Mono',
    'Consolas',
    'Liberation Mono',
    'Menlo',
    'Monaco',
    'Courier New',
    'monospace',
  ],
  SERIF: [
    'ui-serif',
    'Georgia',
    'Cambria',
    'Times New Roman',
    'Times',
    'serif',
  ],
} as const;

// 字体优化配置
export const FONT_OPTIMIZATION_CONFIG = {
  // 使用 swap 策略确保文本立即可见
  display: FONT_DISPLAY_STRATEGIES.SWAP,
  
  // 预加载关键字体
  preload: true,
  
  // 启用字体回退调整
  adjustFontFallback: true,
  
  // 仅加载需要的子集
  subsets: [FONT_SUBSETS.LATIN],
  
  // 变量字体支持
  variable: true,
} as const;

// Turbopack 兼容性检查
export function isTurbopackCompatible(): boolean {
  // 检查是否在 Turbopack 环境中运行
  return process.env.NODE_ENV === 'development' && 
         (process.env.TURBOPACK === '1' || process.argv.includes('--turbopack'));
}

// 字体加载性能监控
export function logFontLoadingPerformance(fontName: string, startTime: number): void {
  if (typeof window !== 'undefined' && window.performance) {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    console.log(`Font ${fontName} loaded in ${loadTime.toFixed(2)}ms`);
  }
}

// 字体预连接优化
export function addFontPreconnect(): void {
  if (typeof document !== 'undefined') {
    const preconnectLink = document.createElement('link');
    preconnectLink.rel = 'preconnect';
    preconnectLink.href = 'https://fonts.gstatic.com';
    preconnectLink.crossOrigin = 'anonymous';
    document.head.appendChild(preconnectLink);
  }
}
