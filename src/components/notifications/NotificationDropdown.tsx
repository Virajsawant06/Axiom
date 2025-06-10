import { useState, useEffect } from 'react';
import { Bell, Check, X, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationService } from '../../services/notificationService';
import { FriendService } from '../../services/friendService';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  data: any;
  read: boolean;
  created_at: string;
}

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const data = await NotificationService.getUserNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    
    try {
      const count = await NotificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleAcceptFriendRequest = async (requestId: string, notificationId: string) => {
    setIsLoading(true);
    try {
      await FriendService.acceptFriendRequest(requestId);
      await NotificationService.markAsRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectFriendRequest = async (requestId: string, notificationId: string) => {
    setIsLoading(true);
    try {
      await FriendService.rejectFriendRequest(requestId);
      await NotificationService.markAsRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string, data: any) => {
    if (data?.type === 'friend_request') {
      return <User size={16} className="text-electric-blue-500" />;
    }
    
    switch (type) {
      case 'message':
        return <MessageSquare size={16} className="text-green-500" />;
      default:
        return <Bell size={16} className="text-navy-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-2xl text-navy-500 dark:text-navy-400 hover:bg-white/10 dark:hover:bg-navy-800/50 relative transition-all duration-300 hover:scale-110"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          <div className="absolute right-0 mt-2 w-96 card-elevated z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-navy-100 dark:border-navy-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-navy-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={async () => {
                      if (user) {
                        await NotificationService.markAllAsRead(user.id);
                        await loadNotifications();
                        await loadUnreadCount();
                      }
                    }}
                    className="text-sm text-electric-blue-600 dark:text-electric-blue-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="mx-auto text-navy-400 dark:text-navy-500 mb-3" />
                  <p className="text-navy-600 dark:text-navy-300 font-medium">No notifications yet</p>
                  <p className="text-navy-500 dark:text-navy-400 text-sm">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y divide-navy-100 dark:divide-navy-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors ${
                        !notification.read ? 'bg-electric-blue-50 dark:bg-electric-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.data)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-navy-900 dark:text-white text-sm">
                                {notification.title}
                              </p>
                              <p className="text-navy-600 dark:text-navy-300 text-sm mt-1">
                                {notification.content}
                              </p>
                              <p className="text-navy-500 dark:text-navy-400 text-xs mt-2">
                                {formatTimeAgo(notification.created_at)}
                              </p>
                            </div>
                            
                            {!notification.read && (
                              <div className="w-2 h-2 bg-electric-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>

                          {/* Friend Request Actions */}
                          {notification.data?.type === 'friend_request' && !notification.read && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAcceptFriendRequest(notification.data.request_id, notification.id)}
                                disabled={isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Check size={12} />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectFriendRequest(notification.data.request_id, notification.id)}
                                disabled={isLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                              >
                                <X size={12} />
                                Reject
                              </button>
                            </div>
                          )}

                          {/* Mark as read for other notifications */}
                          {notification.data?.type !== 'friend_request' && !notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-electric-blue-600 dark:text-electric-blue-400 hover:underline mt-2"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;