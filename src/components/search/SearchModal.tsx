import { useState, useEffect, useRef } from 'react';
import { Search, X, UserPlus, MessageSquare, User, Check, Clock, UserCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, useAuth } from '../../contexts/AuthContext';
import { FriendService } from '../../services/friendService';
import { ConversationService } from '../../services/conversationService';
import { useToast } from '../../contexts/ToastContext';

interface SearchUser {
  id: string;
  username: string;
  name: string;
  avatar_url: string;
  verified: boolean;
  role: string;
  ranking: number;
  bio: string;
  location: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchUser[]>([]);
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, any>>({});
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('axiom-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Search users in database
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, name, avatar_url, verified, role, ranking, bio, location')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('id', currentUser?.id) // Exclude current user
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        return;
      }

      const users = data || [];
      setSearchResults(users);

      // Check friendship status for each user
      if (currentUser && users.length > 0) {
        const statuses: Record<string, any> = {};
        await Promise.all(
          users.map(async (user) => {
            try {
              const status = await FriendService.getFriendshipStatus(currentUser.id, user.id);
              statuses[user.id] = status;
            } catch (error) {
              console.error('Error checking friendship status:', error);
            }
          })
        );
        setFriendshipStatuses(statuses);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, currentUser]);

  // Save to recent searches
  const addToRecentSearches = (user: SearchUser) => {
    const updated = [user, ...recentSearches.filter(u => u.id !== user.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('axiom-recent-searches', JSON.stringify(updated));
  };

  // Send friend request
  const sendFriendRequest = async (userId: string) => {
    if (!currentUser) return;

    setLoadingActions(prev => ({ ...prev, [userId]: true }));
    try {
      await FriendService.sendFriendRequest(userId);
      
      // Update friendship status locally
      setFriendshipStatuses(prev => ({
        ...prev,
        [userId]: { sender_id: currentUser.id, receiver_id: userId, status: 'pending' }
      }));

      showSuccess('Friend request sent!', 'Your friend request has been sent successfully.');
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.message?.includes('duplicate key')) {
        showError('Request already sent', 'You have already sent a friend request to this user.');
      } else {
        showError('Failed to send request', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoadingActions(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Start conversation
  const startConversation = async (userId: string) => {
    if (!currentUser) return;

    setLoadingActions(prev => ({ ...prev, [`msg_${userId}`]: true }));
    try {
      const conversationId = await ConversationService.getOrCreateDirectConversation(
        currentUser.id,
        userId
      );
      
      onClose();
      navigate(`/messages?conversation=${conversationId}`);
      showSuccess('Chat opened!', 'Starting conversation...');
    } catch (error) {
      console.error('Error starting conversation:', error);
      showError('Failed to start chat', 'Something went wrong. Please try again.');
    } finally {
      setLoadingActions(prev => ({ ...prev, [`msg_${userId}`]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl card-elevated animate-scale-in">
        {/* Search Header */}
        <div className="flex items-center gap-3 p-6 border-b border-navy-200 dark:border-navy-800">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search developers, teams, hackathons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 pr-4 w-full"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="spinner mx-auto mb-3"></div>
              <p className="text-navy-500 dark:text-navy-400">Searching...</p>
            </div>
          ) : searchTerm && searchResults.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center mx-auto mb-3">
                <User size={24} className="text-navy-400 dark:text-navy-500" />
              </div>
              <p className="text-navy-600 dark:text-navy-300 font-medium">No users found</p>
              <p className="text-navy-500 dark:text-navy-400 text-sm">Try searching with a different name or username</p>
            </div>
          ) : searchTerm ? (
            <div className="p-3">
              <h3 className="text-sm font-semibold text-navy-500 dark:text-navy-400 uppercase tracking-wider px-3 mb-3">
                Search Results
              </h3>
              <div className="space-y-1">
                {searchResults.map((user) => (
                  <UserSearchItem
                    key={user.id}
                    user={user}
                    friendshipStatus={friendshipStatuses[user.id]}
                    currentUserId={currentUser?.id}
                    isLoadingFriend={loadingActions[user.id]}
                    isLoadingMessage={loadingActions[`msg_${user.id}`]}
                    onSelect={() => {
                      addToRecentSearches(user);
                      onClose();
                    }}
                    onSendFriendRequest={() => sendFriendRequest(user.id)}
                    onStartConversation={() => startConversation(user.id)}
                  />
                ))}
              </div>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="p-3">
              <h3 className="text-sm font-semibold text-navy-500 dark:text-navy-400 uppercase tracking-wider px-3 mb-3">
                Recent Searches
              </h3>
              <div className="space-y-1">
                {recentSearches.map((user) => (
                  <UserSearchItem
                    key={user.id}
                    user={user}
                    friendshipStatus={friendshipStatuses[user.id]}
                    currentUserId={currentUser?.id}
                    isLoadingFriend={loadingActions[user.id]}
                    isLoadingMessage={loadingActions[`msg_${user.id}`]}
                    onSelect={() => onClose()}
                    onSendFriendRequest={() => sendFriendRequest(user.id)}
                    onStartConversation={() => startConversation(user.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center mx-auto mb-3">
                <Search size={24} className="text-navy-400 dark:text-navy-500" />
              </div>
              <p className="text-navy-600 dark:text-navy-300 font-medium">Start typing to search</p>
              <p className="text-navy-500 dark:text-navy-400 text-sm">Find developers, teams, and hackathons</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface UserSearchItemProps {
  user: SearchUser;
  friendshipStatus?: any;
  currentUserId?: string;
  isLoadingFriend?: boolean;
  isLoadingMessage?: boolean;
  onSelect: () => void;
  onSendFriendRequest: () => void;
  onStartConversation: () => void;
}

const UserSearchItem = ({ 
  user, 
  friendshipStatus, 
  currentUserId, 
  isLoadingFriend,
  isLoadingMessage,
  onSelect, 
  onSendFriendRequest,
  onStartConversation 
}: UserSearchItemProps) => {
  const getFriendButtonContent = () => {
    if (!friendshipStatus) {
      return {
        icon: <UserPlus size={16} />,
        text: 'Connect',
        disabled: false,
        className: 'hover:bg-electric-blue-50 dark:hover:bg-electric-blue-900/20 hover:text-electric-blue-600 dark:hover:text-electric-blue-400'
      };
    }

    if (friendshipStatus.status === 'pending') {
      if (friendshipStatus.sender_id === currentUserId) {
        return {
          icon: <Clock size={16} />,
          text: 'Pending',
          disabled: true,
          className: 'text-amber-600 dark:text-amber-400'
        };
      } else {
        return {
          icon: <Check size={16} />,
          text: 'Accept',
          disabled: false,
          className: 'hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400'
        };
      }
    }

    if (friendshipStatus.status === 'accepted') {
      return {
        icon: <UserCheck size={16} />,
        text: 'Friends',
        disabled: true,
        className: 'text-green-600 dark:text-green-400'
      };
    }

    return {
      icon: <UserPlus size={16} />,
      text: 'Connect',
      disabled: false,
      className: 'hover:bg-electric-blue-50 dark:hover:bg-electric-blue-900/20 hover:text-electric-blue-600 dark:hover:text-electric-blue-400'
    };
  };

  const friendButton = getFriendButtonContent();

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors group">
      <Link
        to={`/profile/${user.id}`}
        onClick={onSelect}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div className="relative">
          <img
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
            alt={user.name}
            className="w-12 h-12 rounded-2xl object-cover"
          />
          {user.verified && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-electric-blue-500 rounded-full border-2 border-white dark:border-navy-900 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-navy-900 dark:text-white truncate">
              {user.name}
            </h3>
            <span className="text-xs bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 px-2 py-0.5 rounded-full capitalize">
              {user.role}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-navy-500 dark:text-navy-400">
            <span>@{user.username}</span>
            {user.ranking > 0 && (
              <>
                <span>•</span>
                <span>{user.ranking} MMR</span>
              </>
            )}
            {user.location && (
              <>
                <span>•</span>
                <span className="truncate">{user.location}</span>
              </>
            )}
          </div>
          {user.bio && (
            <p className="text-sm text-navy-600 dark:text-navy-300 truncate mt-1">
              {user.bio}
            </p>
          )}
        </div>
      </Link>
      
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!friendButton.disabled && !isLoadingFriend) {
              onSendFriendRequest();
            }
          }}
          disabled={friendButton.disabled || isLoadingFriend}
          className={`p-2 rounded-xl text-navy-500 dark:text-navy-400 transition-colors ${friendButton.className} ${
            friendButton.disabled || isLoadingFriend ? 'cursor-not-allowed opacity-75' : ''
          }`}
          title={friendButton.text}
        >
          {isLoadingFriend ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            friendButton.icon
          )}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!isLoadingMessage) {
              onStartConversation();
            }
          }}
          disabled={isLoadingMessage}
          className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-electric-blue-50 dark:hover:bg-electric-blue-900/20 hover:text-electric-blue-600 dark:hover:text-electric-blue-400 transition-colors disabled:cursor-not-allowed disabled:opacity-75"
          title="Send message"
        >
          {isLoadingMessage ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <MessageSquare size={16} />
          )}
        </button>
      </div>
    </div>
  );
};

export default SearchModal;