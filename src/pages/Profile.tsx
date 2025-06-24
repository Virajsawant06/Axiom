import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserService } from '../services/userService';
import { FriendService } from '../services/friendService';
import { ConversationService } from '../services/conversationService';
import { MapPin, Trophy, Users, Star, Github as GitHub, Linkedin, Globe, Code, MessageSquare, UserPlus, Calendar, Cog, Clock, UserCheck, Check, Copy } from 'lucide-react';
import { mockHackathons, mockTeams } from '../data/mockData';

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [friendshipStatus, setFriendshipStatus] = useState<any>(null);
  const [loadingFriendRequest, setLoadingFriendRequest] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  
  useEffect(() => {
    if (userId) {
      loadUserProfile();
      if (currentUser && userId !== currentUser.id) {
        loadFriendshipStatus();
      }
    }
  }, [userId, currentUser]);

  const loadUserProfile = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      if (userId === currentUser?.id) {
        setProfileUser(currentUser);
      } else {
        const userData = await UserService.getUserById(userId);
        setProfileUser({
          id: userData.id,
          username: userData.username,
          hashtag: userData.hashtag,
          email: userData.email,
          avatar: userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=6366f1&color=fff`,
          role: userData.role,
          verified: userData.verified,
          name: userData.name,
          ranking: userData.ranking,
          bio: userData.bio,
          location: userData.location,
          github: userData.github_url,
          linkedin: userData.linkedin_url,
          website: userData.website_url,
          skills: userData.user_skills?.map((us: any) => us.skill.name) || [],
          teams: [],
          hackathons: [],
          projects: []
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      showError('Profile not found', 'The user profile you are looking for does not exist.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriendshipStatus = async () => {
    if (!currentUser || !userId || userId === currentUser.id) return;
    
    try {
      const status = await FriendService.getFriendshipStatus(currentUser.id, userId);
      setFriendshipStatus(status);
    } catch (error) {
      console.error('Error loading friendship status:', error);
    }
  };

  const sendFriendRequest = async () => {
    if (!currentUser || !profileUser) return;
    
    setLoadingFriendRequest(true);
    try {
      await FriendService.sendFriendRequest(profileUser.id);
      setFriendshipStatus({
        sender_id: currentUser.id,
        receiver_id: profileUser.id,
        status: 'pending'
      });
      showSuccess('Friend request sent!', `Your friend request has been sent to ${profileUser.name}.`);
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      if (error.message?.includes('duplicate key')) {
        showError('Request already sent', 'You have already sent a friend request to this user.');
      } else {
        showError('Failed to send request', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoadingFriendRequest(false);
    }
  };

  const acceptFriendRequest = async () => {
    if (!friendshipStatus) return;
    
    setLoadingFriendRequest(true);
    try {
      await FriendService.acceptFriendRequest(friendshipStatus.id);
      setFriendshipStatus({
        ...friendshipStatus,
        status: 'accepted'
      });
      showSuccess('Friend request accepted!', `You are now friends with ${profileUser.name}.`);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      showError('Failed to accept request', 'Something went wrong. Please try again.');
    } finally {
      setLoadingFriendRequest(false);
    }
  };

  const startConversation = async () => {
    if (!currentUser || !profileUser || profileUser.id === currentUser.id) return;
    
    setLoadingMessage(true);
    try {
      const conversationId = await ConversationService.getOrCreateDirectConversation(
        currentUser.id,
        profileUser.id
      );
      
      navigate(`/messages?conversation=${conversationId}`);
      showSuccess('Chat opened!', `Starting conversation with ${profileUser.name}...`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      showError('Failed to start chat', 'Something went wrong. Please try again.');
    } finally {
      setLoadingMessage(false);
    }
  };

  const copyUserIdToClipboard = async () => {
    if (!profileUser) return;
    
    const userId = `${profileUser.username}#${profileUser.hashtag}`;
    try {
      await navigator.clipboard.writeText(userId);
      showSuccess('User ID copied!', `${userId} has been copied to your clipboard.`);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showError('Failed to copy', 'Could not copy user ID to clipboard.');
    }
  };

  const getFriendButtonContent = () => {
    if (!friendshipStatus) {
      return {
        icon: <UserPlus size={18} />,
        text: 'Connect',
        onClick: sendFriendRequest,
        disabled: false,
        className: 'btn bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
      };
    }

    if (friendshipStatus.status === 'pending') {
      if (friendshipStatus.sender_id === currentUser?.id) {
        return {
          icon: <Clock size={18} />,
          text: 'Pending',
          onClick: () => {},
          disabled: true,
          className: 'btn bg-white/10 text-white/70 backdrop-blur-sm cursor-not-allowed'
        };
      } else {
        return {
          icon: <Check size={18} />,
          text: 'Accept',
          onClick: acceptFriendRequest,
          disabled: false,
          className: 'btn bg-green-500/20 text-white backdrop-blur-sm hover:bg-green-500/30'
        };
      }
    }

    if (friendshipStatus.status === 'accepted') {
      return {
        icon: <UserCheck size={18} />,
        text: 'Friends',
        onClick: () => {},
        disabled: true,
        className: 'btn bg-green-500/20 text-white backdrop-blur-sm cursor-not-allowed'
      };
    }

    return {
      icon: <UserPlus size={18} />,
      text: 'Connect',
      onClick: sendFriendRequest,
      disabled: false,
      className: 'btn bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
    };
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-navy-600 dark:text-navy-300">Loading profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          User not found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The user profile you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }
  
  const isOwnProfile = profileUser.id === currentUser?.id;
  const friendButton = getFriendButtonContent();
  
  // Get user teams
  const userTeams = mockTeams.filter(team => 
    team.members.some(member => member.id === profileUser.id)
  );
  
  // Get user hackathons (use mock data for now)
  const userHackathons = mockHackathons.slice(0, 2);
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="relative mb-6">
        <div className="h-48 rounded-xl bg-gradient-to-r from-axiom-500 to-axiom-600 overflow-hidden">
          {/* Cover Photo */}
        </div>
        
        <div className="absolute -bottom-16 left-6 h-32 w-32 rounded-full border-4 border-white dark:border-axiom-900 overflow-hidden">
          <img 
            src={profileUser.avatar} 
            alt={profileUser.name} 
            className="h-full w-full object-cover"
          />
        </div>
        
        <div className="absolute bottom-4 right-6 flex gap-2">
          {isOwnProfile ? (
            <Link to="/settings" className="btn bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
              <Cog size={18} className="mr-2" />
              Edit Profile
            </Link>
          ) : (
            <>
              <button 
                onClick={friendButton.onClick}
                disabled={friendButton.disabled || loadingFriendRequest}
                className={`${friendButton.className} ${loadingFriendRequest ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loadingFriendRequest ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  friendButton.icon
                )}
                {friendButton.text}
              </button>
              <button 
                onClick={startConversation}
                disabled={loadingMessage}
                className={`btn bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 ${loadingMessage ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loadingMessage ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <MessageSquare size={18} className="mr-2" />
                )}
                Message
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - User Info */}
        <div className="space-y-6">
          <div className="card p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profileUser.name}
              {profileUser.verified && (
                <span className="ml-2 inline-block h-5 w-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                  ✓
                </span>
              )}
            </h1>
            
            {/* User ID with Copy Button */}
            <div className="flex items-center gap-2 mt-2">
              <p className="text-gray-600 dark:text-gray-300">
                {profileUser.username}#{profileUser.hashtag}
              </p>
              <button
                onClick={copyUserIdToClipboard}
                className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:text-electric-blue-600 dark:hover:text-electric-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Copy User ID"
              >
                <Copy size={14} />
              </button>
            </div>
            
            {profileUser.location && (
              <div className="flex items-center mt-3 text-gray-600 dark:text-gray-300">
                <MapPin size={16} className="mr-2" />
                {profileUser.location}
              </div>
            )}
            
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="badge badge-primary">
                <Star size={12} className="mr-1" />
                {profileUser.ranking} MMR
              </div>
              <div className="badge badge-success">
                Top 10%
              </div>
              <div className="badge badge-primary">
                <Trophy size={12} className="mr-1" />
                {profileUser.hackathons.length} Hackathons
              </div>
              <div className="badge badge-primary">
                <Users size={12} className="mr-1" />
                {userTeams.length} Teams
              </div>
            </div>
            
            {profileUser.bio && (
              <div className="mt-4">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">About</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {profileUser.bio}
                </p>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-axiom-800">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profileUser.skills.map((skill: string, index: number) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-axiom-800 flex flex-wrap gap-3">
              {profileUser.github && (
                <a 
                  href={`https://${profileUser.github}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-300 hover:text-axiom-600 dark:hover:text-axiom-400"
                >
                  <GitHub size={20} />
                </a>
              )}
              {profileUser.linkedin && (
                <a 
                  href={`https://${profileUser.linkedin}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-300 hover:text-axiom-600 dark:hover:text-axiom-400"
                >
                  <Linkedin size={20} />
                </a>
              )}
              {profileUser.website && (
                <a 
                  href={profileUser.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-300 hover:text-axiom-600 dark:hover:text-axiom-400"
                >
                  <Globe size={20} />
                </a>
              )}
            </div>
          </div>
          
          {/* Teams */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Teams</h2>
              <Link to="/teams" className="text-sm text-axiom-600 dark:text-axiom-400 hover:underline">
                View all
              </Link>
            </div>
            
            <div className="space-y-4">
              {userTeams.length > 0 ? (
                userTeams.map(team => (
                  <div key={team.id} className="flex items-center gap-3">
                    <img 
                      src={team.avatar} 
                      alt={team.name} 
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{team.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{team.members.length} members</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No teams yet
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-axiom-800 mb-6">
            <nav className="flex space-x-8">
              {['overview', 'hackathons', 'projects', 'achievements'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 text-sm font-medium border-b-2 ${
                    activeTab === tab 
                      ? 'border-axiom-500 text-axiom-600 dark:text-axiom-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Recent Hackathons */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Recent Hackathons
                </h2>
                
                {userHackathons.length > 0 ? (
                  <div className="space-y-4">
                    {userHackathons.map((hackathon) => (
                      <div key={hackathon.id} className="card overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-1/3 h-40 md:h-auto">
                            <img 
                              src={hackathon.image} 
                              alt={hackathon.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4 md:w-2/3">
                            <h3 className="font-bold text-gray-900 dark:text-white">{hackathon.name}</h3>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <Calendar size={14} className="mr-1" />
                              <span>{hackathon.startDate} to {hackathon.endDate}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">
                              {hackathon.description}
                            </p>
                            
                            {/* Placeholder for user's result */}
                            <div className="mt-3 flex items-center">
                              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-1 rounded-full">
                                🥇 1st Place
                              </span>
                              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                with team ByteBusters
                              </span>
                            </div>
                            
                            <div className="mt-3">
                              <Link 
                                to={`/hackathons/${hackathon.id}`}
                                className="text-sm text-axiom-600 dark:text-axiom-400 hover:underline"
                              >
                                View Hackathon
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No hackathons participated yet
                    </p>
                  </div>
                )}
              </div>
              
              {/* Projects Showcase */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Projects Showcase
                </h2>
                
                {profileUser.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileUser.projects.map((project: any) => (
                      <div key={project.id} className="card p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-axiom-100 dark:bg-axiom-800">
                            <Code size={18} className="text-axiom-600 dark:text-axiom-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {project.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No projects added yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Other tabs - placeholder content */}
          {activeTab === 'hackathons' && (
            <div className="text-center py-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hackathons History</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed hackathon history will be displayed here. This tab is under development.
              </p>
            </div>
          )}
          
          {activeTab === 'projects' && (
            <div className="text-center py-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Projects Portfolio</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed projects portfolio will be displayed here. This tab is under development.
              </p>
            </div>
          )}
          
          {activeTab === 'achievements' && (
            <div className="text-center py-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Achievements & Badges</h2>
              <p className="text-gray-600 dark:text-gray-300">
                User achievements will be displayed here. This tab is under development.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;