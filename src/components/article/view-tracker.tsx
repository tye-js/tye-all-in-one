'use client';

import { useEffect } from 'react';

interface ViewTrackerProps {
  articleSlug: string;
}

export default function ViewTracker({ articleSlug }: ViewTrackerProps) {
  useEffect(() => {
    // 增加浏览次数
    const incrementView = async () => {
      try {
        // 检查是否已经在这个会话中查看过这篇文章
        const viewedArticles = JSON.parse(sessionStorage.getItem('viewedArticles') || '[]');
        
        if (!viewedArticles.includes(articleSlug)) {
          // 调用 API 增加浏览次数
          await fetch(`/api/articles/${articleSlug}/view`, {
            method: 'POST',
          });
          
          // 记录已查看
          viewedArticles.push(articleSlug);
          sessionStorage.setItem('viewedArticles', JSON.stringify(viewedArticles));
        }
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    };

    // 延迟执行，确保用户真的在阅读文章
    const timer = setTimeout(incrementView, 3000);
    
    return () => clearTimeout(timer);
  }, [articleSlug]);

  return null; // 这个组件不渲染任何内容
}
