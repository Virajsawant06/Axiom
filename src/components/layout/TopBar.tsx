import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  MessageSquare, 
  Search, 
  Menu,
  User,
  LogOut,
  Settings,
  Moon,
  Sun,
  Plus
} from 'lucide-react';
import SearchModal from '../search/SearchModal';
import NotificationDropdown from '../notifications/NotificationDropdown';

interface TopBarProps {
  toggleSidebar: () => void;
}

const TopBar = ({ toggleSidebar }: TopBarProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-navy-900 border-b border-navy-100 dark:border-navy-800 py-4 px-6 flex items-center justify-between shadow-md z-40">

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-white/10 dark:hover:bg-navy-800/50 lg:hidden transition-all duration-300 hover:scale-110"
          >
            <Menu size={20} />
          </button>
          
          <div className="relative max-w-md w-full hidden md:block">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/50 dark:bg-navy-900/50 rounded-2xl text-left transition-all duration-300 hover:bg-white/70 dark:hover:bg-navy-900/70"
            >
              <Search size={18} className="text-navy-400 dark:text-navy-500" />
              <span className="text-navy-400 dark:text-navy-500">Search developers, hackathons, teams...</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <button 
            onClick={() => setShowSearchModal(true)}
            className="p-3 rounded-2xl text-navy-500 dark:text-navy-400 hover:bg-white/10 dark:hover:bg-navy-800/50 md:hidden transition-all duration-300 hover:scale-110"
          >
            <Search size={20} />
          </button>
          
          {/* Create Button */}
          <button className="btn btn-primary hidden md:flex">
            <Plus size={18} />
            Create
          </button>
          
          {/* Notifications */}
          <NotificationDropdown />
          
          {/* Messages */}
          <Link 
            to="/messages"
            className="p-3 rounded-2xl text-navy-500 dark:text-navy-400 hover:bg-white/10 dark:hover:bg-navy-800/50 relative transition-all duration-300 hover:scale-110"
          >
            <MessageSquare size={20} />
          </Link>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-2xl text-navy-500 dark:text-navy-400 hover:bg-white/10 dark:hover:bg-navy-800/50 transition-all duration-300 hover:scale-110"
          >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/10 dark:hover:bg-navy-800/50 transition-all duration-300"
            >
              {user && (
                <div className="relative">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="h-10 w-10 rounded-2xl object-cover shadow-lg"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-navy-900"></div>
                </div>
              )}
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 card-elevated z-50 animate-scale-in">
                {user && (
                  <div className="p-4 border-b border-navy-100 dark:border-navy-800">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="h-12 w-12 rounded-2xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-navy-500 dark:text-navy-400">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="py-2">
                  <Link 
                    to={`/profile/${user?.id}`}
                    className="flex items-center gap-3 px-4 py-3 text-navy-700 dark:text-navy-200 hover:bg-electric-blue-50 dark:hover:bg-electric-blue-900/20 transition-all duration-300"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={18} />
                    <span className="font-medium">Your Profile</span>
                  </Link>
                  <Link 
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-navy-700 dark:text-navy-200 hover:bg-electric-blue-50 dark:hover:bg-electric-blue-900/20 transition-all duration-300"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={18} />
                    <span className="font-medium">Settings</span>
                  </Link>
                  <button 
                    className="flex items-center gap-3 px-4 py-3 text-navy-700 dark:text-navy-200 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-all duration-300"
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                  >
                    <LogOut size={18} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={showSearchModal} 
        onClose={() => setShowSearchModal(false)} 
      />
    </>
  );
};

export default TopBar;