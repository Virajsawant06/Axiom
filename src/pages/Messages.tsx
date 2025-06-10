import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { ConversationService, Message } from '../services/conversationService';
import { Search, Send, MoreVertical, Phone, Video, Info } from 'lucide-react';

interface Conversation {
  id: string;
  type: 'direct' | 'team' | 'hackathon';
  name?: string;
  participants: any[];
  last_message?: any;
  updated_at: string;
}

const Messages = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    // Check for conversation parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const conversationParam = urlParams.get('conversation');
    if (conversationParam) {
      setSelectedConversation(conversationParam);
      // Clean up URL
      window.history.replaceState({}, '', '/messages');
    }
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    const messageSubscription = supabase
      .channel(`messages:conversation_id=eq.${selectedConversation}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages',  filter: `conversation_id=eq.${selectedConversation}` },
        (payload) => {
          console.log('New message received:', payload.new);
          // Add the new message to the state
          setMessages((prevMessages) => [...prevMessages, payload.new as Message]);

          // Update the last_message in the conversations state for the sidebar
          setConversations(prevConversations => {
            return prevConversations.map(conversation => {
              if (conversation.id === payload.new.conversation_id) {
                return {
                  ...conversation,
                  last_message: payload.new as Message, // Update last_message with the new message
                  updated_at: payload.new.sent_at // Update updated_at as well
                };
              }
              return conversation;
            });
          });
        }
      )
      .subscribe();

    // Cleanup function to unsubscribe when the component unmounts or selectedConversation changes
    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [selectedConversation]); // Re-run effect when selectedConversation changes

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const data = await ConversationService.getUserConversations(user.id);
      setConversations(data);
      
      // Auto-select first conversation if none selected
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      showError('Failed to load conversations', 'Please try refreshing the page.');
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;
    
    try {
      const data = await ConversationService.getConversationMessages(selectedConversation);
      setMessages(data);
      
      // Mark as read
      if (user) {
        await ConversationService.updateLastRead(selectedConversation, user.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      showError('Failed to load messages', 'Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    setIsLoading(true);
    try {
      const message = await ConversationService.sendMessage(
        selectedConversation,
        user.id,
 newMessage.trim(),
 'text' as 'text', // Pass messageType
 undefined // Pass fileUrl (or replace with actual fileUrl variable if implemented)
      );
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Refresh conversations to update last message
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Failed to send message', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
      return otherParticipant?.name || 'Unknown User';
    }
    
    return 'Group Chat';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
      return otherParticipant?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'User')}&background=6366f1&color=fff`;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.name || 'Group')}&background=6366f1&color=fff`;
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  const filteredConversations = conversations.filter(conversation =>
    getConversationName(conversation).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-12rem)]">
      <div className="flex h-full card-elevated overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r border-navy-200 dark:border-navy-800 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-navy-200 dark:border-navy-800">
            <h1 className="text-xl font-bold text-navy-900 dark:text-white mb-4">Messages</h1>
            
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center mx-auto mb-3">
                  <Search size={24} className="text-navy-400 dark:text-navy-500" />
                </div>
                <p className="text-navy-600 dark:text-navy-300 font-medium">No conversations found</p>
                <p className="text-navy-500 dark:text-navy-400 text-sm">Start a conversation with someone!</p>
              </div>
            ) : (
              <div className="divide-y divide-navy-100 dark:divide-navy-800">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`w-full p-4 text-left hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-electric-blue-50 dark:bg-electric-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={getConversationAvatar(conversation)}
                          alt={getConversationName(conversation)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-navy-900"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-navy-900 dark:text-white truncate">
                            {getConversationName(conversation)}
                          </h3>
                          <span className="text-xs text-navy-500 dark:text-navy-400">
                            {formatMessageTime(conversation.updated_at)}
                          </span>
                        </div>
                        
                        {conversation.last_message && (
                          <p className="text-sm text-navy-600 dark:text-navy-300 truncate mt-1">
                            {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                            {conversation.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversationData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-navy-200 dark:border-navy-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={getConversationAvatar(selectedConversationData)}
                    alt={getConversationName(selectedConversationData)}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="font-semibold text-navy-900 dark:text-white">
                      {getConversationName(selectedConversationData)}
                    </h2>
                    <p className="text-sm text-navy-500 dark:text-navy-400">
                      {selectedConversationData.type === 'direct' ? 'Online' : `${selectedConversationData.participants.length} members`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors">
                    <Phone size={18} />
                  </button>
                  <button className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors">
                    <Video size={18} />
                  </button>
                  <button className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors">
                    <Info size={18} />
                  </button>
                  <button className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwnMessage && showAvatar && (
                        <img
                          src={message.sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=6366f1&color=fff`}
                          alt={message.sender?.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      
                      {!isOwnMessage && !showAvatar && (
                        <div className="w-8"></div>
                      )}
                      
                      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : ''}`}>
                        {showAvatar && !isOwnMessage && (
                          <p className="text-xs text-navy-500 dark:text-navy-400 mb-1 ml-3">
                            {message.sender?.name}
                          </p>
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white'
                              : 'bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        
                        <p className={`text-xs text-navy-500 dark:text-navy-400 mt-1 ${isOwnMessage ? 'text-right' : 'ml-3'}`}>
                          {formatMessageTime(message.sent_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-navy-200 dark:border-navy-800">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      className="input w-full pr-12"
                      disabled={isLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isLoading}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-xl bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-navy-400 dark:text-navy-500" />
                </div>
                <h3 className="text-xl font-medium text-navy-900 dark:text-white mb-2">Select a conversation</h3>
                <p className="text-navy-600 dark:text-navy-300">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;