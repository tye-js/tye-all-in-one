'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Share2, 
  Copy, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Check, 
  Bookmark, 
  BookmarkCheck,
  Eye,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ArticleActionsProps {
  articleId: string;
  title: string;
  description?: string;
  viewCount: number;
}

export default function ArticleActions({ 
  articleId, 
  title, 
  description, 
  viewCount 
}: ArticleActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // 检查收藏状态
  useEffect(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
    setIsBookmarked(bookmarks.includes(articleId));

    // 获取点赞数据
    const likesData = JSON.parse(localStorage.getItem('articleLikes') || '{}');
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
    
    setLikes(likesData[articleId] || 0);
    setIsLiked(likedArticles.includes(articleId));
  }, [articleId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: currentUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    }
  };

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedArticles') || '[]');
    
    if (isBookmarked) {
      const updatedBookmarks = bookmarks.filter((id: string) => id !== articleId);
      localStorage.setItem('bookmarkedArticles', JSON.stringify(updatedBookmarks));
      setIsBookmarked(false);
      toast.success('Removed from bookmarks');
    } else {
      const updatedBookmarks = [...bookmarks, articleId];
      localStorage.setItem('bookmarkedArticles', JSON.stringify(updatedBookmarks));
      setIsBookmarked(true);
      toast.success('Added to bookmarks');
    }
  };

  const toggleLike = () => {
    const likesData = JSON.parse(localStorage.getItem('articleLikes') || '{}');
    const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
    
    if (isLiked) {
      // 取消点赞
      const newLikes = Math.max(0, (likesData[articleId] || 0) - 1);
      likesData[articleId] = newLikes;
      const updatedLiked = likedArticles.filter((id: string) => id !== articleId);
      
      localStorage.setItem('articleLikes', JSON.stringify(likesData));
      localStorage.setItem('likedArticles', JSON.stringify(updatedLiked));
      
      setLikes(newLikes);
      setIsLiked(false);
    } else {
      // 点赞
      const newLikes = (likesData[articleId] || 0) + 1;
      likesData[articleId] = newLikes;
      const updatedLiked = [...likedArticles, articleId];
      
      localStorage.setItem('articleLikes', JSON.stringify(likesData));
      localStorage.setItem('likedArticles', JSON.stringify(updatedLiked));
      
      setLikes(newLikes);
      setIsLiked(true);
      toast.success('Thanks for liking!');
    }
  };

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
  };

  return (
    <div className="flex items-center gap-2">
      {/* 浏览次数 */}
      <div className="flex items-center text-sm text-gray-500 mr-2">
        <Eye className="w-4 h-4 mr-1" />
        {viewCount.toLocaleString()}
      </div>

      {/* 点赞按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLike}
        className={isLiked ? 'bg-red-50 border-red-200 text-red-700' : ''}
      >
        <ThumbsUp className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
        {likes > 0 && <span className="ml-1">{likes}</span>}
      </Button>

      {/* 收藏按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleBookmark}
        className={isBookmarked ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-4 h-4 mr-1" />
        ) : (
          <Bookmark className="w-4 h-4 mr-1" />
        )}
        {isBookmarked ? 'Saved' : 'Save'}
      </Button>

      {/* 分享按钮 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && (
            <>
              <DropdownMenuItem onClick={handleNativeShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <Check className="w-4 h-4 mr-2 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <a 
              href={shareUrls.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </a>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <a 
              href={shareUrls.facebook} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Facebook
            </a>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <a 
              href={shareUrls.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
