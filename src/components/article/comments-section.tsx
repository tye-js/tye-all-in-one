'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Heart, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Comment {
  id: string;
  author: string;
  email: string;
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

interface CommentsSectionProps {
  articleId: string;
}

export default function CommentsSection({ articleId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({
    author: '',
    email: '',
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 从 localStorage 加载评论
  useEffect(() => {
    const savedComments = localStorage.getItem(`comments-${articleId}`);
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, [articleId]);

  // 保存评论到 localStorage
  const saveComments = (updatedComments: Comment[]) => {
    localStorage.setItem(`comments-${articleId}`, JSON.stringify(updatedComments));
    setComments(updatedComments);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.author.trim() || !newComment.email.trim() || !newComment.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        author: newComment.author.trim(),
        email: newComment.email.trim(),
        content: newComment.content.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
        replies: [],
      };

      const updatedComments = [comment, ...comments];
      saveComments(updatedComments);

      setNewComment({ author: '', email: '', content: '' });
      toast.success('Comment posted successfully!');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = (commentId: string) => {
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
        const isLiked = likedComments.includes(commentId);
        
        if (isLiked) {
          // 取消点赞
          const newLikedComments = likedComments.filter((id: string) => id !== commentId);
          localStorage.setItem('likedComments', JSON.stringify(newLikedComments));
          return { ...comment, likes: Math.max(0, comment.likes - 1) };
        } else {
          // 点赞
          const newLikedComments = [...likedComments, commentId];
          localStorage.setItem('likedComments', JSON.stringify(newLikedComments));
          return { ...comment, likes: comment.likes + 1 };
        }
      }
      return comment;
    });
    
    saveComments(updatedComments);
  };

  const isCommentLiked = (commentId: string) => {
    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
    return likedComments.includes(commentId);
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 评论表单 */}
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="author">Name *</Label>
              <Input
                id="author"
                value={newComment.author}
                onChange={(e) => setNewComment(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newComment.email}
                onChange={(e) => setNewComment(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="content">Comment *</Label>
            <Textarea
              id="content"
              value={newComment.content}
              onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts..."
              rows={4}
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>

        {/* 评论列表 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {comment.author.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{comment.author}</div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                
                <div className="flex items-center space-x-4 text-sm">
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className={`flex items-center space-x-1 transition-colors ${
                      isCommentLiked(comment.id) 
                        ? 'text-red-600' 
                        : 'text-gray-500 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isCommentLiked(comment.id) ? 'fill-current' : ''}`} />
                    <span>{comment.likes}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                    <Reply className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
