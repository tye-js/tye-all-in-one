'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  articleId: string;
  articleTitle: string;
}

export default function BookmarkButton({ articleId, articleTitle }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 检查文章是否已收藏
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
    setIsBookmarked(bookmarks.includes(articleId));
  }, [articleId]);

  const toggleBookmark = async () => {
    setIsLoading(true);
    
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
      
      if (isBookmarked) {
        // 移除收藏
        const updatedBookmarks = bookmarks.filter((id: string) => id !== articleId);
        localStorage.setItem('bookmarkedArticles', JSON.stringify(updatedBookmarks));
        setIsBookmarked(false);
        toast.success('Removed from bookmarks');
      } else {
        // 添加收藏
        const updatedBookmarks = [...bookmarks, articleId];
        localStorage.setItem('bookmarkedArticles', JSON.stringify(updatedBookmarks));
        setIsBookmarked(true);
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleBookmark}
      disabled={isLoading}
      className={isBookmarked ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
    >
      {isBookmarked ? (
        <BookmarkCheck className="w-4 h-4 mr-2" />
      ) : (
        <Bookmark className="w-4 h-4 mr-2" />
      )}
      {isBookmarked ? 'Saved' : 'Save'}
    </Button>
  );
}
