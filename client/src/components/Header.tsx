import { Link } from 'wouter';
import { useAuthContext } from '@/contexts/AuthContext';
import { Bitcoin, Bell, Zap } from 'lucide-react';

export default function Header() {
  const { user } = useAuthContext();

  return (
    <header className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bitcoin-gradient rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">SatStream</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-bitcoin transition-colors">
              Feed
            </Link>
            <a href="#live" className="text-gray-600 dark:text-gray-300 hover:text-bitcoin transition-colors">
              Live
            </a>
            <a href="#discover" className="text-gray-600 dark:text-gray-300 hover:text-bitcoin transition-colors">
              Discover
            </a>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {/* Balance */}
            <Link href="/wallet">
              <div className="hidden sm:flex items-center space-x-2 bg-bitcoin/10 px-3 py-1 rounded-full cursor-pointer hover:bg-bitcoin/20 transition-colors">
                <Bitcoin className="w-4 h-4 text-bitcoin" />
                <span className="text-sm font-medium text-bitcoin">
                  {user?.balance?.toLocaleString() || 0} sats
                </span>
              </div>
            </Link>
            
            {/* Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-white">
                {user?.username}
              </span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-bitcoin transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-bitcoin rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
