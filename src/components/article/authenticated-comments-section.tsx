'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, Heart, Reply, LogIn } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

interface AuthenticatedCommentsSectionProps {
  articleId: string;
}

export default function AuthenticatedCommentsSection({ articleId }: AuthenticatedCommentsSectionProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

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
    
    if (!session?.user) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: session.user.id || '',
        userName: session.user.name || 'Anonymous',
        userAvatar: session.user.avatar || undefined,
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
        replies: [],
      };

      const updatedComments = [comment, ...comments];
      saveComments(updatedComments);

      setNewComment('');
      toast.success('Comment posted successfully!');
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!session?.user) {
      toast.error('Please sign in to reply');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      const reply: Comment = {
        id: Date.now().toString(),
        userId: session.user.id || '',
        userName: session.user.name || 'Anonymous',
        userAvatar: session.user.avatar || undefined,
        content: replyContent.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
      };

      const updatedComments = comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply]
          };
        }
        return comment;
      });

      saveComments(updatedComments);
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply posted successfully!');
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  const handleLikeComment = (commentId: string) => {
    if (!session?.user) {
      toast.error('Please sign in to like comments');
      return;
    }

    const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
    const isLiked = likedComments.includes(commentId);
    
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
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

  if (status === 'loading') {
    return (
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        {session?.user ? (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={session.user.avatar || undefined} alt={session.user.name || 'User'} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {session.user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <LogIn className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 mb-4">Sign in to join the conversation</p>
            <Button asChild>
              <Link href="/auth/signin">
                Sign In
              </Link>
            </Button>
          </div>
        )}

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
                      <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {comment.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{comment.userName}</div>
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
                    disabled={!session?.user}
                  >
                    <Heart className={`w-4 h-4 ${isCommentLiked(comment.id) ? 'fill-current' : ''}`} />
                    <span>{comment.likes}</span>
                  </button>
                  
                  {session?.user && (
                    <button 
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                  )}
                </div>

                {/* 回复表单 */}
                {replyingTo === comment.id && session?.user && (
                  <div className="ml-8 mt-3 space-y-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className="resize-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={!replyContent.trim()}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                )}

                {/* 回复列表 */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-3 border-l-2 border-gray-100 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={reply.userAvatar} alt={reply.userName} />
                            <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                              {reply.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{reply.userName}</span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
