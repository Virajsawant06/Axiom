import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { TeamMatchingService, SearchFilters, SkillCategory } from '../services/teamMatchingService';
import { MMRService, CompatibilityScore } from '../services/mmrService';
import { ConversationService } from '../services/conversationService';
import { 
  Search, 
  Filter, 
  Users, 
  Star, 
  MapPin, 
  MessageSquare,
  UserPlus,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  Github,
  Linkedin,
  Globe,
  Trophy,
  Zap,
  Target
} from 'lucide-react';

const TeamMatching = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [compatibilityScores, setCompatibilityScores] = useState<CompatibilityScore[]>([]);
  const [matchedUsers, setMatchedUsers] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showTeamUpModal, setShowTeamUpModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [teamUpMessage, setTeamUpMessage] = useState('');
  
  const [filters, setFilters] = useState<SearchFilters>({
    roles: [],
    skills: [],
    mmrRange: [0, 10000],
    location: '',
    minCompatibility: 50
  });

  const [skillSearch, setSkillSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const skillCategories = TeamMatchingService.getSkillsByCategory();
  const userTier = user ? MMRService.getTierByMMR(user.ranking) : null;

  useEffect(() => {
    if (user) {
      searchTeammates();
    }
  }, [user]);

  const searchTeammates = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const scores = await TeamMatchingService.searchTeammates(user.id, filters);
      setCompatibilityScores(scores);

      if (scores.length > 0) {
        const userIds = scores.map(score => score.userId);
        const users = await TeamMatchingService.getMatchedUsersDetails(userIds);
        
        // Merge compatibility scores with user details
        const mergedData = scores.map(score => {
          const userData = users.find(u => u.id === score.userId);
          return { ...userData, compatibility: score };
        });
        
        setMatchedUsers(mergedData);
      } else {
        setMatchedUsers([]);
      }
    } catch (error) {
      console.error('Error searching teammates:', error);
      showError('Search failed', 'Failed to search for teammates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleRoleToggle = (role: string) => {
    setFilters(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const sendTeamUpRequest = async () => {
    if (!selectedUser || !teamUpMessage.trim()) return;

    try {
      await MMRService.sendTeamUpRequest(
        selectedUser.id,
        teamUpMessage,
        filters.skills
      );

      setShowTeamUpModal(false);
      setSelectedUser(null);
      setTeamUpMessage('');
      showSuccess('Team-up request sent!', `Your request has been sent to ${selectedUser.name}.`);
    } catch (error) {
      console.error('Error sending team-up request:', error);
      showError('Failed to send request', 'Something went wrong. Please try again.');
    }
  };

  const startConversation = async (userId: string, userName: string) => {
    if (!user) return;

    try {
      const conversationId = await ConversationService.getOrCreateDirectConversation(user.id, userId);
      window.location.href = `/messages?conversation=${conversationId}`;
      showSuccess('Chat opened!', `Starting conversation with ${userName}...`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      showError('Failed to start chat', 'Something went wrong. Please try again.');
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCompatibilityBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const filteredSkills = skillSearch
    ? TeamMatchingService.searchSkills(skillSearch)
    : [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 dark:text-white">
          Team Matching
        </h1>
        <p className="text-navy-600 dark:text-navy-300 mt-2">
          Find compatible teammates based on skills and MMR compatibility
        </p>
        
        {userTier && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: `${userTier.color}20` }}>
              <span className="text-lg">{userTier.icon}</span>
              <span className="font-semibold" style={{ color: userTier.color }}>
                {userTier.name} ({user?.ranking} MMR)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card-elevated p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-navy-900 dark:text-white">Search Filters</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            <Filter size={18} className="mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {showFilters ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="form-label mb-3">Looking for roles:</label>
              <div className="flex flex-wrap gap-2">
                {['developer', 'organizer', 'company'].map(role => (
                  <button
                    key={role}
                    onClick={() => handleRoleToggle(role)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filters.roles.includes(role)
                        ? 'bg-electric-blue-500 text-white'
                        : 'bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-navy-200 dark:hover:bg-navy-700'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Categories */}
            <div>
              <label className="form-label mb-3">Required skills:</label>
              
              {/* Skill Search */}
              <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>

              {/* Search Results */}
              {skillSearch && filteredSkills.length > 0 && (
                <div className="mb-4 p-4 bg-navy-50 dark:bg-navy-800 rounded-xl">
                  <h4 className="font-medium text-navy-900 dark:text-white mb-2">Search Results:</h4>
                  <div className="flex flex-wrap gap-2">
                    {filteredSkills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          filters.skills.includes(skill)
                            ? 'bg-electric-blue-500 text-white'
                            : 'bg-white dark:bg-navy-700 text-navy-700 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-600'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Categories */}
              <div className="space-y-3">
                {skillCategories.map(category => (
                  <div key={category.name} className="border border-navy-200 dark:border-navy-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="w-full flex items-center justify-between p-4 bg-navy-50 dark:bg-navy-800 hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-navy-900 dark:text-white">
                          {category.name}
                        </span>
                        <span className="text-sm text-navy-500 dark:text-navy-400">
                          ({category.skills.length} skills)
                        </span>
                      </div>
                      {expandedCategories.has(category.name) ? 
                        <ChevronUp size={18} /> : <ChevronDown size={18} />
                      }
                    </button>
                    
                    {expandedCategories.has(category.name) && (
                      <div className="p-4 bg-white dark:bg-navy-900">
                        <div className="flex flex-wrap gap-2">
                          {category.skills.map(skill => (
                            <button
                              key={skill}
                              onClick={() => handleSkillToggle(skill)}
                              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                filters.skills.includes(skill)
                                  ? 'bg-electric-blue-500 text-white'
                                  : 'bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-navy-200 dark:hover:bg-navy-700'
                              }`}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Skills */}
            {filters.skills.length > 0 && (
              <div>
                <label className="form-label mb-2">Selected skills ({filters.skills.length}):</label>
                <div className="flex flex-wrap gap-2">
                  {filters.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-electric-blue-100 dark:bg-electric-blue-900/30 text-electric-blue-800 dark:text-electric-blue-300 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => handleSkillToggle(skill)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MMR Range */}
            <div>
              <label className="form-label mb-3">MMR Range:</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-navy-600 dark:text-navy-300">Min MMR</label>
                  <input
                    type="number"
                    value={filters.mmrRange[0]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      mmrRange: [parseInt(e.target.value) || 0, prev.mmrRange[1]]
                    }))}
                    className="input w-full"
                    min="0"
                    max="10000"
                  />
                </div>
                <div>
                  <label className="text-sm text-navy-600 dark:text-navy-300">Max MMR</label>
                  <input
                    type="number"
                    value={filters.mmrRange[1]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      mmrRange: [prev.mmrRange[0], parseInt(e.target.value) || 10000]
                    }))}
                    className="input w-full"
                    min="0"
                    max="10000"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="form-label">Location (optional):</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="input pl-10 w-full"
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* Minimum Compatibility */}
            <div>
              <label className="form-label mb-2">
                Minimum Compatibility: {filters.minCompatibility}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minCompatibility}
                onChange={(e) => setFilters(prev => ({ ...prev, minCompatibility: parseInt(e.target.value) }))}
                className="w-full h-2 bg-navy-200 dark:bg-navy-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={searchTeammates}
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    Searching...
                  </div>
                ) : (
                  <>
                    <Target size={18} />
                    Find Teammates
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-navy-900 dark:text-white">
            Compatible Teammates ({matchedUsers.length})
          </h2>
          {matchedUsers.length > 0 && (
            <div className="text-sm text-navy-600 dark:text-navy-300">
              Sorted by compatibility score
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-navy-600 dark:text-navy-300">Searching for compatible teammates...</p>
          </div>
        ) : matchedUsers.length === 0 ? (
          <div className="card p-8 text-center">
            <Users size={48} className="mx-auto text-navy-400 dark:text-navy-500 mb-4" />
            <h3 className="text-lg font-medium text-navy-900 dark:text-white mb-2">No matches found</h3>
            <p className="text-navy-600 dark:text-navy-300 mb-6">
              Try adjusting your filters or expanding your skill requirements to find more teammates.
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="btn btn-primary"
            >
              Adjust Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedUsers.map((matchedUser) => {
              const compatibility = matchedUser.compatibility;
              const tier = MMRService.getTierByMMR(matchedUser.ranking);
              
              return (
                <div key={matchedUser.id} className="card-elevated overflow-hidden hover-lift">
                  {/* Compatibility Score Header */}
                  <div className={`p-4 ${getCompatibilityBg(compatibility.score)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={18} className={getCompatibilityColor(compatibility.score)} />
                        <span className={`font-bold ${getCompatibilityColor(compatibility.score)}`}>
                          {compatibility.score}% Match
                        </span>
                      </div>
                      <div className="flex items-center gap-1" style={{ color: tier.color }}>
                        <span className="text-sm">{tier.icon}</span>
                        <span className="text-xs font-medium">{tier.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={matchedUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedUser.name)}&background=6366f1&color=fff`}
                        alt={matchedUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-navy-900 dark:text-white">
                            {matchedUser.name}
                          </h3>
                          {matchedUser.verified && (
                            <span className="text-electric-blue-500">✓</span>
                          )}
                        </div>
                        <p className="text-sm text-navy-600 dark:text-navy-300">
                          @{matchedUser.username}#{matchedUser.hashtag}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    {matchedUser.bio && (
                      <p className="text-sm text-navy-600 dark:text-navy-300 mb-4 line-clamp-2">
                        {matchedUser.bio}
                      </p>
                    )}

                    {/* Location & MMR */}
                    <div className="flex items-center justify-between mb-4 text-sm text-navy-500 dark:text-navy-400">
                      {matchedUser.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{matchedUser.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Trophy size={14} />
                        <span>{matchedUser.ranking} MMR</span>
                      </div>
                    </div>

                    {/* Skill Matches */}
                    {compatibility.skillMatches.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                          Matching Skills:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {compatibility.skillMatches.slice(0, 3).map(skill => (
                            <span
                              key={skill}
                              className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {compatibility.skillMatches.length > 3 && (
                            <span className="text-xs bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300 px-2 py-1 rounded-full">
                              +{compatibility.skillMatches.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Social Links */}
                    <div className="flex items-center gap-2 mb-4">
                      {matchedUser.github_url && (
                        <a
                          href={`https://${matchedUser.github_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
                        >
                          <Github size={16} />
                        </a>
                      )}
                      {matchedUser.linkedin_url && (
                        <a
                          href={`https://${matchedUser.linkedin_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
                        >
                          <Linkedin size={16} />
                        </a>
                      )}
                      {matchedUser.website_url && (
                        <a
                          href={matchedUser.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
                        >
                          <Globe size={16} />
                        </a>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(matchedUser);
                          setShowTeamUpModal(true);
                        }}
                        className="btn btn-primary flex-1 text-sm py-2"
                      >
                        <UserPlus size={14} />
                        Team Up
                      </button>
                      <button
                        onClick={() => startConversation(matchedUser.id, matchedUser.name)}
                        className="btn btn-secondary text-sm py-2 px-3"
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Up Modal */}
      {showTeamUpModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTeamUpModal(false)}></div>
          
          <div className="relative w-full max-w-md card-elevated animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-800">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">Send Team-Up Request</h2>
              <button
                onClick={() => setShowTeamUpModal(false)}
                className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=6366f1&color=fff`}
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-navy-900 dark:text-white">{selectedUser.name}</h3>
                  <p className="text-sm text-navy-600 dark:text-navy-300">
                    {selectedUser.compatibility.score}% compatibility
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Message:</label>
                <textarea
                  value={teamUpMessage}
                  onChange={(e) => setTeamUpMessage(e.target.value)}
                  rows={4}
                  className="input w-full resize-none"
                  placeholder="Hi! I'd love to team up with you for upcoming hackathons. Your skills in [mention specific skills] would be perfect for our team!"
                />
              </div>

              {filters.skills.length > 0 && (
                <div className="mb-4">
                  <label className="form-label mb-2">Skills we're looking for:</label>
                  <div className="flex flex-wrap gap-1">
                    {filters.skills.map(skill => (
                      <span
                        key={skill}
                        className="text-xs bg-electric-blue-100 dark:bg-electric-blue-900/30 text-electric-blue-800 dark:text-electric-blue-300 px-2 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTeamUpModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={sendTeamUpRequest}
                  disabled={!teamUpMessage.trim()}
                  className="btn btn-primary flex-1"
                >
                  <Send size={18} />
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMatching;