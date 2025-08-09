import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthContext } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/authUtils';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Video, Radio } from 'lucide-react';

export default function CreatePost() {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = getAuthToken();
      const response = await fetch('/api/posts/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
      setText('');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    const formData = new FormData();
    formData.append('text', text);
    if (selectedFile) {
      formData.append('content', selectedFile);
      formData.append('contentType', selectedFile.type.startsWith('image/') ? 'image' : 'video');
    }

    createPostMutation.mutate(formData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="Share something with the community..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-bitcoin focus:border-transparent dark:bg-gray-800 dark:text-white min-h-[100px]"
            />
            
            {selectedFile && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <label className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
              <Image className="w-4 h-4" />
              <span className="text-sm">Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <label className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
              <Video className="w-4 h-4" />
              <span className="text-sm">Video</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <button
              type="button"
              className="flex items-center space-x-2 px-3 py-2 text-bitcoin hover:bg-bitcoin/10 rounded-lg transition-colors"
            >
              <Radio className="w-4 h-4" />
              <span className="text-sm font-medium">Go Live</span>
            </button>
          </div>
          <Button
            type="submit"
            className="bg-bitcoin hover:bg-bitcoin/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            disabled={(!text.trim() && !selectedFile) || createPostMutation.isPending}
          >
            {createPostMutation.isPending ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>
    </div>
  );
}
