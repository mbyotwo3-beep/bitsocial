import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import CreatePost from '@/components/CreatePost';
import Post from '@/components/Post';
import LiveStreamCard from '@/components/LiveStreamCard';
import { useQuery } from '@tanstack/react-query';
import { getAuthToken } from '@/lib/authUtils';

interface PostType {
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
}

interface LiveStreamType {
  id: number;
  streamerId: number;
  title: string;
  description?: string;
  viewerCount: number;
  totalTips: number;
  streamer: {
    id: number;
    username: string;
    email: string;
  };
}

export default function Home() {
  const { data: posts = [], isLoading: postsLoading } = useQuery<PostType[]>({
    queryKey: ['/api/posts/feed'],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch('/api/posts/feed', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
  });

  const { data: liveStreams = [] } = useQuery<LiveStreamType[]>({
    queryKey: ['/api/streams/active'],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch('/api/streams/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch live streams');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      <Header />
      
      <div className="flex max-w-7xl mx-auto">
        <Sidebar />
        
        <main className="flex-1 lg:pl-64 pb-20">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <CreatePost />
              
              {/* Live Streams */}
              {liveStreams.length > 0 && (
                <div className="space-y-4">
                  {liveStreams.map((stream) => (
                    <LiveStreamCard key={stream.id} stream={stream} />
                  ))}
                </div>
              )}
              
              {/* Posts Feed */}
              {postsLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/6"></div>
                          </div>
                        </div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No posts yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Be the first to share something with the community!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <Post key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-700 lg:hidden z-40">
        <div className="grid grid-cols-5 h-16">
          <button className="flex flex-col items-center justify-center text-bitcoin">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-xs mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4m0 0H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2"/>
            </svg>
            <span className="text-xs mt-1">Live</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-300">
            <div className="w-8 h-8 bg-bitcoin rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
            </div>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            <span className="text-xs mt-1">Wallet</span>
          </button>
          <button className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
