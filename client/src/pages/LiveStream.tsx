import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TipModal from '@/components/TipModal';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAuthToken, isUnauthorizedError } from '@/lib/authUtils';
import { X, Send } from 'lucide-react';

interface LiveStream {
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

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'tip';
  amount?: number;
}

export default function LiveStream() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuthContext();
  const { socket, sendMessage } = useSocket();
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showTipModal, setShowTipModal] = useState(false);
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: stream, isLoading } = useQuery<LiveStream>({
    queryKey: ['/api/streams', id],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch(`/api/streams/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stream');
      return response.json();
    },
    enabled: !!id && !!user,
  });

  const tipMutation = useMutation({
    mutationFn: async (amount: number) => {
      const token = getAuthToken();
      const response = await fetch('/api/lightning/tip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: stream?.streamerId,
          amount,
          message: `Live stream tip`
        }),
      });
      if (!response.ok) throw new Error('Failed to send tip');
      return response.json();
    },
    onSuccess: (_, amount) => {
      toast({
        title: "Tip sent!",
        description: `Successfully tipped ${amount} sats to @${stream?.streamer.username}`,
      });
      
      // Add tip to chat
      const tipMessage: ChatMessage = {
        id: Date.now().toString(),
        username: user?.username || 'Anonymous',
        message: `Tipped ${amount} sats! 🚀`,
        timestamp: new Date().toISOString(),
        type: 'tip',
        amount
      };
      setChatMessages(prev => [...prev, tipMessage]);

      // Broadcast tip via WebSocket
      sendMessage({
        type: 'tip-notification',
        data: {
          streamId: id,
          username: user?.username,
          amount
        }
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Tip failed",
        description: error.message || "Failed to send tip",
        variant: "destructive",
      });
    },
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'chat-message':
            setChatMessages(prev => [...prev, data.data]);
            break;
          case 'tip-received':
            const tipMsg: ChatMessage = {
              id: Date.now().toString(),
              username: data.data.username,
              message: `Tipped ${data.data.amount} sats! ⚡`,
              timestamp: new Date().toISOString(),
              type: 'tip',
              amount: data.data.amount
            };
            setChatMessages(prev => [...prev, tipMsg]);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    
    // Join stream
    if (stream) {
      sendMessage({
        type: 'join-stream',
        streamId: id,
        userId: user?.id
      });
    }

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, stream, id, user?.id, sendMessage]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      username: user?.username || 'Anonymous',
      message: chatInput,
      timestamp: new Date().toISOString(),
      type: 'message'
    };

    setChatMessages(prev => [...prev, message]);
    
    sendMessage({
      type: 'chat-message',
      data: message
    });

    setChatInput('');
  };

  const handleQuickTip = (amount: number) => {
    tipMutation.mutate(amount);
  };

  const handleCloseLivestream = () => {
    window.history.back();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    return `${Math.floor(diffInMinutes / 60)}h`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-bitcoin border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading live stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Stream not found</h2>
          <Button onClick={handleCloseLivestream} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black z-50">
        <div className="flex h-full">
          {/* Video Area */}
          <div className="flex-1 relative">
            {/* Close button */}
            <Button
              onClick={handleCloseLivestream}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              size="sm"
            >
              <X className="w-5 h-5" />
            </Button>
            
            {/* Live indicator */}
            <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-black/50 px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">LIVE</span>
              <span className="text-white/80 text-sm">{stream.viewerCount.toLocaleString()} viewers</span>
            </div>
            
            {/* Streamer info overlay */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-3 bg-black/50 backdrop-blur-sm px-4 py-3 rounded-xl">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {stream.streamer.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{stream.streamer.username}</p>
                <p className="text-white/80 text-sm">{stream.title}</p>
              </div>
            </div>
            
            {/* Tip rain overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="tip-animation absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-bitcoin text-white px-3 py-1 rounded-full text-sm font-medium opacity-0">
                +500 sats ⚡
              </div>
            </div>
            
            {/* Video placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">{stream.title}</h2>
                <p className="text-white/80">{stream.description}</p>
              </div>
            </div>
          </div>
          
          {/* Chat Sidebar */}
          <div className="w-80 bg-gray-900 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Live Chat</h3>
              <p className="text-gray-400 text-sm">
                {stream.viewerCount.toLocaleString()} viewers • Be respectful
              </p>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-gray-300">
                      {message.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-bitcoin text-sm font-medium">{message.username}</span>
                      <span className="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
                    </div>
                    {message.type === 'tip' ? (
                      <div className="bg-bitcoin/20 border border-bitcoin/30 rounded-lg p-2 mt-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-lightning font-bold text-sm">{message.amount} sats</span>
                          <svg className="w-3 h-3 text-lightning" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                          </svg>
                        </div>
                        <p className="text-gray-200 text-sm">{message.message}</p>
                      </div>
                    ) : (
                      <p className="text-gray-200 text-sm">{message.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2 mb-3">
                {[100, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => handleQuickTip(amount)}
                    disabled={tipMutation.isPending}
                    className="flex-1 bg-bitcoin/20 hover:bg-bitcoin/30 text-bitcoin text-sm font-medium"
                    size="sm"
                  >
                    ⚡ {amount}
                  </Button>
                ))}
              </div>
              
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-gray-800 border-gray-600 text-white focus:ring-bitcoin focus:border-bitcoin text-sm"
                />
                <Button
                  type="submit"
                  className="bg-bitcoin hover:bg-bitcoin/90 text-white"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <TipModal
          recipientId={stream.streamerId}
          recipientUsername={stream.streamer.username}
          onClose={() => setShowTipModal(false)}
          onTipSent={() => setShowTipModal(false)}
        />
      )}
    </>
  );
}
