import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Users, Clock, ArrowLeft, Share2, Heart, MessageSquare, UserPlus, X, AlertCircle, Github, ExternalLink, Upload } from 'lucide-react';
import { HackathonService } from '../services/hackathonService';
import { SubmissionService } from '../services/submissionService';
import { TeamService } from '../services/teamService';
import { EmailService } from '../services/emailService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import SubmissionModal from '../components/hackathon/SubmissionModal';
import SubmissionCard from '../components/hackathon/SubmissionCard';

const HackathonDetails = () => {
  const { hackathonId } = useParams<{ hackathonId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [hackathon, setHackathon] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [userSubmission, setUserSubmission] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  const [registrationData, setRegistrationData] = useState({
    username: '',
    hashtag: '',
    teamMembers: ['']
  });
  const [isRegistering, setIsRegistering] = useState(false);
  
  useEffect(() => {
    if (hackathonId) {
      loadHackathon();
      if (user) {
        checkRegistrationStatus();
        loadUserTeam();
      }
    }
  }, [hackathonId, user]);

  useEffect(() => {
    if (user && hackathon && isRegistered) {
      checkSubmissionStatus();
    }
  }, [user, hackathon, isRegistered]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      loadSubmissions();
    }
  }, [activeTab]);

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

  const checkRegistrationStatus = async () => {
    if (!user || !hackathonId) return;

    try {
      const registrations = await HackathonService.getUserRegistrations(user.id);
      const registration = registrations.find(r => r.hackathon_id === hackathonId);
      
      if (registration) {
        setIsRegistered(true);
        setUserRegistration(registration);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const loadUserTeam = async () => {
    if (!user) return;

    try {
      const teams = await TeamService.getUserTeams(user.id);
      // Find team associated with this hackathon
      const hackathonTeam = teams.find(team => team.hackathon_id === hackathonId);
      if (hackathonTeam) {
        setUserTeam(hackathonTeam);
      }
    } catch (error) {
      console.error('Error loading user team:', error);
    }
  };

  const checkSubmissionStatus = async () => {
    if (!user || !hackathonId) return;

    try {
      const submitted = await SubmissionService.hasUserSubmitted(
        hackathonId, 
        user.id, 
        userTeam?.id
      );
      setHasSubmitted(submitted);

      if (submitted) {
        const submission = await SubmissionService.getUserSubmission(
          hackathonId,
          user.id,
          userTeam?.id
        );
        setUserSubmission(submission);
      }
    } catch (error) {
      console.error('Error checking submission status:', error);
    }
  };

  const loadSubmissions = async () => {
    if (!hackathonId) return;

    try {
      const data = await SubmissionService.getHackathonSubmissions(hackathonId);
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleRegistration = async () => {
    if (!user || !hackathon) return;
    
    setIsRegistering(true);
    try {
      // Validate user exists
      const userExists = await validateUser(registrationData.username, registrationData.hashtag);
      if (!userExists.exists) {
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
          if (!memberExists.exists) {
            showError('Team member not found', `User ${username.trim()}#${hashtag.trim()} is not registered on Axiom.`);
            setIsRegistering(false);
            return;
          }
          validTeamMembers.push(memberExists.user);
        }
      }

      // Register for hackathon
      await HackathonService.registerForHackathon(hackathon.id, user.id);
      
      // Send registration emails
      try {
        await EmailService.sendRegistrationEmails(
          hackathon,
          userExists.user,
          validTeamMembers,
          validTeamMembers.length > 0 ? 'team' : 'individual'
        );
        showSuccess('Registration successful!', `You have been registered for ${hackathon.name}. Check your email for confirmation details.`);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        showSuccess('Registration successful!', `You have been registered for ${hackathon.name}. (Email notification failed to send)`);
      }
      
      setShowRegistrationModal(false);
      setRegistrationData({ username: '', hashtag: '', teamMembers: [''] });
      setIsRegistered(true);
      checkRegistrationStatus();
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
        .select('id, name, email, username, hashtag, avatar_url')
        .eq('username', username)
        .eq('hashtag', hashtag)
        .single();

      if (error) {
        console.error('User validation error:', error);
        return { exists: false, user: null };
      }

      return { exists: !!data, user: data };
    } catch (error) {
      console.error('Error validating user:', error);
      return { exists: false, user: null };
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

  const handleSubmissionSuccess = () => {
    setHasSubmitted(true);
    checkSubmissionStatus();
    if (activeTab === 'submissions') {
      loadSubmissions();
    }
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

  // Get tag color based on tag name
  const getTagColor = (tagName: string) => {
    const colors = {
      'AI': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      'Climate': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      'FinTech': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'Healthcare': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      'Education': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      'Gaming': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      'Social Impact': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      'Blockchain': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      'IoT': 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
      'Machine Learning': 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300',
      'Data': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
      'Mobile': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
      'Web': 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300',
      'Sustainability': 'bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300'
    };
    
    return colors[tagName as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  };

  // Check if hackathon is active (between start and end date)
  const endDate = new Date(hackathon.end_date);
  const isActive = today >= startDate && today <= endDate;
  const hasEnded = today > endDate;
  
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
                <span className={`text-white text-xs px-2 py-1 rounded-full ${
                  hasEnded ? 'bg-gray-500' : isActive ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  {hasEnded ? 'Ended' : isActive ? 'Active' : 'Upcoming'}
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
              
              {/* Dynamic Action Button */}
              {!isRegistered ? (
                <button 
                  onClick={() => setShowRegistrationModal(true)}
                  disabled={hasEnded || daysLeft < 0}
                  className="btn bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white shadow-lg shadow-electric-blue-500/25 hover:shadow-xl hover:shadow-electric-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasEnded ? 'Registration Closed' : daysLeft < 0 ? 'Registration Ended' : 'Register Now'}
                </button>
              ) : hasSubmitted ? (
                <div className="flex items-center gap-2 bg-green-500/20 text-white px-4 py-2 rounded-xl backdrop-blur-sm">
                  <Upload size={18} />
                  <span>Project Submitted</span>
                </div>
              ) : isActive ? (
                <button 
                  onClick={() => setShowSubmissionModal(true)}
                  className="btn bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40"
                >
                  <Upload size={18} />
                  Submit Project
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-blue-500/20 text-white px-4 py-2 rounded-xl backdrop-blur-sm">
                  <span>Registered</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Participant Status Banner */}
      {isRegistered && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300">
                You are registered for this hackathon
              </p>
              {userTeam && (
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Team: {userTeam.name}
                </p>
              )}
              {hasSubmitted && userSubmission && (
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Project submitted: {userSubmission.project?.name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hasEnded ? 'Ended' : isActive ? 'Time Left' : 'Starts In'}
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {hasEnded 
                  ? 'Completed' 
                  : isActive 
                    ? `${Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days`
                    : daysUntilStart > 0 
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
            {['overview', 'teams', 'submissions'].map((tab) => (
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
              {isRegistered && !userTeam && (
                <div className="card p-6 bg-gradient-to-br from-axiom-500 to-axiom-600 text-white">
                  <h3 className="text-lg font-bold mb-2">
                    Need a team?
                  </h3>
                  <p className="text-axiom-100 mb-4">
                    Axiom can help you find the perfect teammates based on skills and interests
                  </p>
                  <Link to="/team-matching" className="btn bg-white text-axiom-600 hover:bg-axiom-50 w-full">
                    <UserPlus size={18} className="mr-2" />
                    Find Teammates
                  </Link>
                </div>
              )}
              
              {/* Tags */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hackathon.hackathon_tag_relations?.map((relation: any, index: number) => (
                    <span 
                      key={index} 
                      className={`text-sm px-3 py-1 rounded-full font-medium ${getTagColor(relation.hackathon_tags.name)}`}
                    >
                      {relation.hackathon_tags.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Teams Tab */}
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
        
        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Project Submissions ({submissions.length})
              </h2>
              {isRegistered && !hasSubmitted && isActive && (
                <button 
                  onClick={() => setShowSubmissionModal(true)}
                  className="btn btn-primary"
                >
                  <Upload size={18} />
                  Submit Project
                </button>
              )}
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 dark:bg-axiom-800 h-16 w-16 flex items-center justify-center rounded-full mx-auto mb-4">
                  <Upload size={24} className="text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No submissions yet</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {isActive 
                    ? 'Be the first to submit your project!' 
                    : 'Submissions will appear here once the hackathon starts.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {submissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                  />
                ))}
              </div>
            )}
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

      {/* Submission Modal */}
      <SubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        hackathon={hackathon}
        userTeam={userTeam}
        onSubmissionSuccess={handleSubmissionSuccess}
      />
    </div>
  );
};

export default HackathonDetails;