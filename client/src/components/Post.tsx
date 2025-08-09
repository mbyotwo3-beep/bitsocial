import { useState } from 'react';
import { Button } from '@/components/ui/button';
import TipModal from './TipModal';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '@/lib/authUtils';
import { Heart, MessageCircle, Share, Zap, MoreHorizontal } from 'lucide-react';

interface PostProps {
  post: {
    id: number;
    authorId: number;
    contentType: string;
    contentUrl?: string;
    text?: string;
    createdAt: string;
    author: {
      id: number;
      username: string;
      email: string;
    };
    _count: {
      reactions: number;
      tips: number;
    };
  };
}

export default function Post({ post }: PostProps) {
  const [showTipModal, setShowTipModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const token = getAuthToken();
      const response = await fetch(`/api/posts/${post.id}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reactionType: 'like' }),
      });
      if (!response.ok) throw new Error('Failed to like post');
      return response.json();
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleTipSent = () => {
    setShowTipModal(false);
    toast({
      title: "Tip sent!",
      description: `Successfully tipped @${post.author.username}`,
    });
    queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <>
      <article className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Post Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {post.author.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {post.author.username}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          
          {/* Post Content */}
          {post.text && (
            <div className="mt-4">
              <p className="text-gray-900 dark:text-white">
                {post.text}
              </p>
            </div>
          )}
        </div>

        {/* Post Media */}
        {post.contentUrl && (
          <div className="w-full">
            {post.contentType === 'image' ? (
              <img
                src={post.contentUrl}
                alt="Post content"
                className="w-full h-64 object-cover"
              />
            ) : post.contentType === 'video' ? (
              <video
                src={post.contentUrl}
                controls
                className="w-full h-64 object-cover"
              />
            ) : null}
          </div>
        )}

        {/* Post Actions */}
        <div className="p-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Like Button */}
              <button
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked 
                    ? 'text-red-500' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{post._count.reactions}</span>
              </button>
              
              {/* Comments */}
              <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">12</span>
              </button>
              
              {/* Share */}
              <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors">
                <Share className="w-5 h-5" />
                <span className="text-sm">Share</span>
              </button>
            </div>
            
            {/* Tip Button */}
            <Button
              onClick={() => setShowTipModal(true)}
              className="flex items-center space-x-2 bg-bitcoin/10 hover:bg-bitcoin/20 text-bitcoin px-4 py-2 rounded-lg transition-colors"
              variant="ghost"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Tip Sats</span>
            </Button>
          </div>
          
          {/* Tip Counter */}
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{(Math.random() * 1000).toFixed(0)} sats</span> tipped by{' '}
            <span>{post._count.tips}</span> users
          </div>
        </div>
      </article>

      {/* Tip Modal */}
      {showTipModal && (
        <TipModal
          recipientId={post.author.id}
          recipientUsername={post.author.username}
          onClose={() => setShowTipModal(false)}
          onTipSent={handleTipSent}
        />
      )}
    </>
  );
}
