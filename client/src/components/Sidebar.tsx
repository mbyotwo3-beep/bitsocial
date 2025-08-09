import { Link } from 'wouter';
import { useAuthContext } from '@/contexts/AuthContext';
import { Home, Radio, Wallet, User, Shield } from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuthContext();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:border-r lg:border-gray-200 dark:lg:border-gray-700">
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-dark-card">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {/* Main Navigation */}
            <Link href="/">
              <a className="bg-bitcoin/10 text-bitcoin group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                <Home className="mr-3 h-5 w-5" />
                Home Feed
              </a>
            </Link>
            
            <a href="#live" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
              <Radio className="mr-3 h-5 w-5" />
              Live Streams
            </a>
            
            <Link href="/wallet">
              <a className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                <Wallet className="mr-3 h-5 w-5" />
                Wallet
              </a>
            </Link>
            
            <a href="#profile" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
              <User className="mr-3 h-5 w-5" />
              Profile
            </a>
            
            {/* Admin Section */}
            {user?.isAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin</p>
                <Link href="/admin">
                  <a className="mt-1 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                    <Shield className="mr-3 h-5 w-5" />
                    Dashboard
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
                  </a>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
