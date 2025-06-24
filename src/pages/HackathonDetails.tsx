import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Users, Clock, ArrowLeft, Share2, Heart, MessageSquare, UserPlus, X, AlertCircle } from 'lucide-react';
import { HackathonService } from '../services/hackathonService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import UserCard from '../components/ui/UserCard';

const HackathonDetails = () => {
  const { hackathonId } = useParams<{ hackathonId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [hackathon, setHackathon] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    username: '',
    hashtag: '',
    teamMembers: ['']
  });
  const [isRegistering, setIsRegistering] = useState(false);
  
  useEffect(() => {
    if (hackathonId) {
      loadHackathon();
    }
  }, [hackathonId]);

  const loadHackathon = async () => {
    if (!hackathonId) return;
    
    setIsLoading(true);
    try {
      const data = await HackathonService.getHackathonById(hackathonId);
      setHackathon(data);
    } catch (error) {
      console.error('Error loading hackathon:', error);
      showError('Hackathon not found', 'The hackathon you are looking for does not exist.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (!user || !hackathon) return;
    
    setIsRegistering(true);
    try {
      // Validate user exists
      const userExists = await validateUser(registrationData.username, registrationData.hashtag);
      if (!userExists) {
        showError('User not found', `User ${registrationData.username}#${registrationData.hashtag} is not registered on Axiom.`);
        setIsRegistering(false);
        return;
      }

      // Validate team members if any
      const validTeamMembers = [];
      for (const member of registrationData.teamMembers) {
        if (member.trim()) {
          const [username, hashtag] = member.split('#');
          if (!username || !hashtag) {
            showError('Invalid format', `Please use the format username#hashtag for team members.`);
            setIsRegistering(false);
            return;
          }
          
          const memberExists = await validateUser(username.trim(), hashtag.trim());
          if (!memberExists) {
            showError('Team member not found', `User ${username.trim()}#${hashtag.trim()} is not registered on Axiom.`);
            setIsRegistering(false);
            return;
          }
          validTeamMembers.push(member.trim());
        }
      }

      // Register for hackathon
      await HackathonService.registerForHackathon(hackathon.id, user.id);
      
      showSuccess('Registration successful!', `You have been registered for ${hackathon.name}.`);
      setShowRegistrationModal(false);
      setRegistrationData({ username: '', hashtag: '', teamMembers: [''] });
    } catch (error: any) {
      console.error('Error registering for hackathon:', error);
      if (error.message?.includes('duplicate key')) {
        showError('Already registered', 'You are already registered for this hackathon.');
      } else {
        showError('Registration failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const validateUser = async (username: string, hashtag: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .eq('hashtag', hashtag)
        .single();

      return !error && data;
    } catch (error) {
      return false;
    }
  };

  const addTeamMember = () => {
    setRegistrationData(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, '']
    }));
  };

  const removeTeamMember = (index: number) => {
    setRegistrationData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const updateTeamMember = (index: number, value: string) => {
    setRegistrationData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => i === index ? value : member)
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-navy-600 dark:text-navy-300">Loading hackathon...</p>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Hackathon not found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The hackathon you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/hackathons" className="btn btn-primary">
          <ArrowLeft size={18} className="mr-2" />
          Back to Hackathons
        </Link>
      </div>
    );
  }
  
  // Format registration deadline
  const today = new Date();
  const deadline = new Date(hackathon.registration_deadline);
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate time until hackathon starts
  const startDate = new Date(hackathon.start_date);
  const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/hackathons" className="inline-flex items-center text-axiom-600 dark:text-axiom-400 hover:underline">
          <ArrowLeft size={20} className="mr-2" />
          Back to Hackathons
        </Link>
      </div>
      
      {/* Hackathon Header */}
      <div className="relative">
        <div className="h-64 md:h-80 rounded-xl overflow-hidden">
          <img 
            src={hackathon.image_url} 
            alt={hackathon.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>
        
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {hackathon.status === 'upcoming' ? 'Upcoming' : 'Active'}
                </span>
                <span className="bg-axiom-100 dark:bg-axiom-800 text-axiom-800 dark:text-axiom-300 text-xs px-2 py-1 rounded-full">
                  {hackathon.location}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {hackathon.name}
              </h1>
              <div className="flex items-center text-sm text-white/80">
                <Calendar size={14} className="mr-1" />
                <span>{formatDate(hackathon.start_date)} to {formatDate(hackathon.end_date)}</span>
              </div>
            </div>
            
            <div className="flex mt-4 md:mt-0 gap-2">
              <button className="btn bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
                <Share2 size={18} />
              </button>
              <button className="btn bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
                <Heart size={18} />
              </button>
              <button 
                onClick={() => setShowRegistrationModal(true)}
                className="btn bg-axiom-500 text-white"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-axiom-100 dark:bg-axiom-800">
              <Calendar size={18} className="text-axiom-600 dark:text-axiom-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Registration Ends</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(hackathon.registration_deadline)}
                {daysLeft > 0 && <span className="text-xs text-green-600 dark:text-green-400 ml-1">({daysLeft} days left)</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-axiom-100 dark:bg-axiom-800">
              <Clock size={18} className="text-axiom-600 dark:text-axiom-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Starts In</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {daysUntilStart > 0 
                  ? `${daysUntilStart} days` 
                  : 'Started'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-axiom-100 dark:bg-axiom-800">
              <Trophy size={18} className="text-axiom-600 dark:text-axiom-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Prize Pool</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {hackathon.prize_pool || 'TBA'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-axiom-100 dark:bg-axiom-800">
              <Users size={18} className="text-axiom-600 dark:text-axiom-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Max Participants</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {hackathon.max_participants}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="mt-8">
        <div className="border-b border-gray-200 dark:border-axiom-800">
          <nav className="flex space-x-8">
            {['overview', 'teams', 'discussions'].map((tab) => (
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
      </div>
      
      {/* Tab Content */}
      <div className="mt-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  About this Hackathon
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300">
                    {hackathon.description}
                  </p>
                </div>
              </div>
              
              {/* Rules */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Rules & Guidelines
                </h2>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-axiom-100 dark:bg-axiom-800 flex items-center justify-center text-axiom-600 dark:text-axiom-400 text-sm font-medium">
                      1
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">Teams must consist of 1-{hackathon.max_team_size} members</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-axiom-100 dark:bg-axiom-800 flex items-center justify-center text-axiom-600 dark:text-axiom-400 text-sm font-medium">
                      2
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">All code must be written during the hackathon period</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-axiom-100 dark:bg-axiom-800 flex items-center justify-center text-axiom-600 dark:text-axiom-400 text-sm font-medium">
                      3
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">Use of open source libraries and APIs is allowed</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-axiom-100 dark:bg-axiom-800 flex items-center justify-center text-axiom-600 dark:text-axiom-400 text-sm font-medium">
                      4
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">Projects must address the hackathon theme</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-axiom-100 dark:bg-axiom-800 flex items-center justify-center text-axiom-600 dark:text-axiom-400 text-sm font-medium">
                      5
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">Submissions must include source code and a demo</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Organizer */}
              {hackathon.organizer && (
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Organized by
                  </h3>
                  <div className="flex items-center gap-3">
                    <img
                      src={hackathon.organizer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(hackathon.organizer.name)}&background=6366f1&color=fff`}
                      alt={hackathon.organizer.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{hackathon.organizer.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Organizer</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button className="btn btn-outline w-full">
                      <MessageSquare size={18} className="mr-2" />
                      Contact Organizer
                    </button>
                  </div>
                </div>
              )}
              
              {/* Need a Team? */}
              <div className="card p-6 bg-gradient-to-br from-axiom-500 to-axiom-600 text-white">
                <h3 className="text-lg font-bold mb-2">
                  Need a team?
                </h3>
                <p className="text-axiom-100 mb-4">
                  Axiom can help you find the perfect teammates based on skills and interests
                </p>
                <button className="btn bg-white text-axiom-600 hover:bg-axiom-50 w-full">
                  <UserPlus size={18} className="mr-2" />
                  Find Teammates
                </button>
              </div>
              
              {/* Tags */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hackathon.hackathon_tag_relations?.map((relation: any, index: number) => (
                    <span 
                      key={index} 
                      className="text-sm bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full"
                    >
                      {relation.hackathon_tags.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Other tabs */}
        {activeTab === 'teams' && (
          <div className="text-center py-16">
            <div className="bg-gray-100 dark:bg-axiom-800 h-16 w-16 flex items-center justify-center rounded-full mx-auto mb-4">
              <Users size={24} className="text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Teams will appear here</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Registered teams will be displayed once registration opens.
            </p>
          </div>
        )}
        
        {activeTab === 'discussions' && (
          <div className="text-center py-16">
            <div className="bg-gray-100 dark:bg-axiom-800 h-16 w-16 flex items-center justify-center rounded-full mx-auto mb-4">
              <MessageSquare size={24} className="text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Join the conversation</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
              Discussions will be available once you register for this hackathon.
            </p>
            <button 
              onClick={() => setShowRegistrationModal(true)}
              className="btn btn-primary"
            >
              Register Now
            </button>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRegistrationModal(false)}></div>
          
          <div className="relative w-full max-w-md card-elevated animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-800">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">Register for Hackathon</h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Registration Requirements</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      Enter your Axiom User ID and team members' User IDs in the format: username#hashtag
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Your User ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="username"
                    value={registrationData.username}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, username: e.target.value }))}
                    className="input flex-1"
                  />
                  <span className="flex items-center text-navy-500 dark:text-navy-400">#</span>
                  <input
                    type="text"
                    placeholder="0000"
                    value={registrationData.hashtag}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, hashtag: e.target.value }))}
                    className="input w-20"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label">Team Members (Optional)</label>
                  <button
                    onClick={addTeamMember}
                    className="text-sm text-electric-blue-600 dark:text-electric-blue-400 hover:underline"
                  >
                    + Add Member
                  </button>
                </div>
                <div className="space-y-2">
                  {registrationData.teamMembers.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="username#0000"
                        value={member}
                        onChange={(e) => updateTeamMember(index, e.target.value)}
                        className="input flex-1"
                      />
                      {registrationData.teamMembers.length > 1 && (
                        <button
                          onClick={() => removeTeamMember(index)}
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-navy-200 dark:border-navy-800">
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleRegistration}
                disabled={isRegistering || !registrationData.username || !registrationData.hashtag}
                className="btn btn-primary flex-1"
              >
                {isRegistering ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Registering...
                  </div>
                ) : (
                  'Register'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HackathonDetails;