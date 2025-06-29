'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReadingProgress from '@/components/article/reading-progress';
import TableOfContents from '@/components/article/table-of-contents';
import EnhancedShareButtons from '@/components/article/enhanced-share-buttons';
import SimpleBookmarkButton from '@/components/article/simple-bookmark-button';
import { TocItem } from '@/types/article';

interface ClientSideComponentsProps {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  articleContent?: string; // 降级选项
  tableOfContents?: TocItem[]; // 预处理的目录
  articleExcerpt?: string | null;
  articleTags: string[];
}

export default function ClientSideComponents({
  articleId,
  articleSlug,
  articleTitle,
  articleContent,
  tableOfContents,
  articleExcerpt,
  articleTags,
}: ClientSideComponentsProps) {
  // 浏览量追踪
  useEffect(() => {
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

  return (
    <>
      {/* 阅读进度条 */}
      <ReadingProgress />

      {/* 目录组件 - 渲染到侧边栏 */}
      {typeof window !== 'undefined' && document.getElementById('table-of-contents-placeholder') &&
        createPortal(
          <TableOfContents
            tableOfContents={tableOfContents}
            content={articleContent}
          />,
          document.getElementById('table-of-contents-placeholder')!
        )
      }

      {/* 分享按钮 - 渲染到指定位置 */}
      {typeof window !== 'undefined' && document.querySelector('.share-buttons') &&
        createPortal(
          <EnhancedShareButtons
            title={articleTitle}
            description={articleExcerpt || undefined}
            hashtags={articleTags}
          />,
          document.querySelector('.share-buttons')!
        )
      }

      {/* 收藏按钮 - 渲染到指定位置 */}
      {typeof window !== 'undefined' && document.querySelector('.bookmark-button') &&
        createPortal(
          <SimpleBookmarkButton
            articleId={articleId}
            articleTitle={articleTitle}
          />,
          document.querySelector('.bookmark-button')!
        )
      }
    </>
  );
}

// 导出单独的组件供页面使用
export { ReadingProgress, TableOfContents, EnhancedShareButtons, SimpleBookmarkButton };
