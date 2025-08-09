import { Link } from 'wouter';

interface LiveStreamCardProps {
  stream: {
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
  };
}

export default function LiveStreamCard({ stream }: LiveStreamCardProps) {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-sm p-1">
      <div className="bg-white dark:bg-dark-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-red-500">LIVE NOW</span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {stream.viewerCount.toLocaleString()} viewers
          </span>
        </div>
        
        {/* Live stream thumbnail/preview */}
        <div className="relative mb-4">
          <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-sm font-medium">Live Stream</p>
            </div>
          </div>
          
          <div className="absolute bottom-3 left-3 flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {stream.streamer.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-white font-medium text-sm">
              {stream.streamer.username}
            </span>
          </div>
          
          <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded text-sm">
            ⚡ {Math.floor(stream.totalTips / stream.viewerCount || 0)} sats/min
          </div>
        </div>
        
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          {stream.title}
        </h3>
        {stream.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            {stream.description}
          </p>
        )}
        
        <Link href={`/live/${stream.id}`}>
          <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Join Stream
          </button>
        </Link>
      </div>
    </div>
  );
}
