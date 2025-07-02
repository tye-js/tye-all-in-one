'use client';

import { useEffect } from 'react';
import { logFontLoadingPerformance, addFontPreconnect } from '@/lib/font-optimization';

/**
 * 字体性能监控组件
 * 
 * 这个组件监控字体加载性能并添加必要的预连接
 * 仅在开发环境中启用详细日志
 */
export default function FontPerformanceMonitor() {
  useEffect(() => {
    // 添加字体预连接以提高加载性能
    addFontPreconnect();

    // 仅在开发环境中监控字体加载性能
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      // 监控 Geist Sans 字体加载
      document.fonts.ready.then(() => {
        logFontLoadingPerformance('Geist Sans', startTime);
      });

      // 监控字体加载事件
      document.fonts.addEventListener('loadingdone', (event) => {
        console.log('Fonts loaded:', event);
      });

      document.fonts.addEventListener('loadingerror', (event) => {
        console.error('Font loading error:', event);
      });
    }

    // 检查字体是否支持 font-display: swap
    if ('CSS' in window && 'supports' in window.CSS) {
      const supportsSwap = CSS.supports('font-display', 'swap');
      if (!supportsSwap) {
        console.warn('Browser does not support font-display: swap');
      }
    }
  }, []);

  // 这个组件不渲染任何内容
  return null;
}
