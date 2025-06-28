import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { TeamService } from '../services/teamService';
import { HackathonService } from '../services/hackathonService';
import { ConversationService } from '../services/conversationService';
import { 
  Search, 
  Filter, 
  Plus, 
  Users, 
  Trophy, 
  Star, 
  MessageSquare,
  UserPlus,
  X,
  Save,
  Calendar,
  MapPin
} from 'lucide-react';

const Teams = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [createTeamData, setCreateTeamData] = useState({
    name: '',
    description: '',
    hackathon_id: '',
    looking_for_members: true,
    max_members: 4
  });

  useEffect(() => {
    loadTeams();
    loadUserTeams();
    loadHackathons();
  }, []);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const data = await TeamService.getTeams({ lookingForMembers: true });
      setTeams(data);
    } catch (error) {
      console.error('Error loading teams:', error);
      showError('Failed to load teams', 'Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserTeams = async () => {
    if (!user) return;
    
    try {
      const data = await TeamService.getUserTeams(user.id);
      setUserTeams(data);
    } catch (error) {
      console.error('Error loading user teams:', error);
    }
  };

  const loadHackathons = async () => {
    try {
      const data = await HackathonService.getHackathons({ status: 'upcoming' });
      setHackathons(data);
    } catch (error) {
      console.error('Error loading hackathons:', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);
    try {
      const teamData = {
        ...createTeamData,
        created_by: user.id,
        hackathon_id: createTeamData.hackathon_id || null
      };

      const newTeam = await TeamService.createTeam(teamData);

      // Create team conversation
      await ConversationService.createTeamConversation(newTeam.id, user.id, createTeamData.name);

      setCreateTeamData({
        name: '',
        description: '',
        hackathon_id: '',
        looking_for_members: true,
        max_members: 4
      });
      setShowCreateModal(false);
      loadTeams();
      loadUserTeams();
      
      showSuccess('Team created!', `${createTeamData.name} has been created successfully.`);
    } catch (error: any) {
      console.error('Error creating team:', error);
      if (error.message?.includes('duplicate key')) {
        showError('Team name taken', 'A team with this name already exists. Please choose a different name.');
      } else {
        showError('Failed to create team', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    if (!user) return;

    try {
      await TeamService.joinTeam(teamId, user.id);
      loadTeams();
      loadUserTeams();
      showSuccess('Joined team!', 'You have successfully joined the team.');
    } catch (error: any) {
      console.error('Error joining team:', error);
      if (error.message?.includes('duplicate key')) {
        showError('Already a member', 'You are already a member of this team.');
      } else {
        showError('Failed to join team', 'Something went wrong. Please try again.');
      }
    }
  };

  const openTeamChat = async (teamId: string, teamName: string) => {
    if (!user) return;

    try {
      const conversationId = await ConversationService.getOrCreateTeamConversation(teamId, user.id, teamName);
      window.location.href = `/messages?conversation=${conversationId}`;
    } catch (error) {
      console.error('Error opening team chat:', error);
      showError('Failed to open chat', 'Something went wrong. Please try again.');
    }
  };

  // Filter teams based on search term
  const filteredTeams = teams.filter(team => {
    const matchesSearch = 
      searchTerm === '' || 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 dark:text-white">
          Teams
        </h1>
        <p className="text-navy-600 dark:text-navy-300 mt-2">
          Join existing teams or create your own to collaborate on hackathons
        </p>
      </div>

      {/* User Teams Section */}
      {userTeams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4">
            Your Teams ({userTeams.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTeams.map((team) => (
              <div key={team.id} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img 
                    src={team.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(team.name)}&background=6366f1&color=fff`} 
                    alt={team.name} 
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-bold text-navy-900 dark:text-white">{team.name}</h3>
                    <span className="text-xs text-electric-blue-600 dark:text-electric-blue-400 font-medium">
                      {team.user_role === 'leader' ? 'Team Leader' : 'Member'}
                    </span>
                  </div>
                </div>
                
                <p className="text-navy-600 dark:text-navy-300 text-sm mb-3 line-clamp-2">
                  {team.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-500 dark:text-navy-400">
                    {team.team_members?.length || 0} members
                  </span>
                  <button
                    onClick={() => openTeamChat(team.id, team.name)}
                    className="btn btn-primary text-sm py-1 px-3"
                  >
                    <MessageSquare size={14} className="mr-1" />
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-navy-400 dark:text-navy-500" />
          </div>
          <input 
            type="text" 
            placeholder="Search teams..." 
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button className="btn btn-secondary">
            <Filter size={18} className="mr-2" />
            Filters
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={18} className="mr-2" />
            Create Team
          </button>
        </div>
      </div>
      
      {/* Teams Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-navy-600 dark:text-navy-300">Loading teams...</p>
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div key={team.id} className="card overflow-hidden hover-lift">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={team.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(team.name)}&background=6366f1&color=fff`} 
                    alt={team.name} 
                    className="h-12 w-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-bold text-navy-900 dark:text-white">{team.name}</h3>
                    <div className="flex items-center text-sm">
                      <Users size={14} className="mr-1 text-navy-500 dark:text-navy-400" />
                      <span className="text-navy-500 dark:text-navy-400">
                        {team.team_members?.length || 0}/{team.max_members} members
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-navy-600 dark:text-navy-300 text-sm mb-4 line-clamp-3">
                  {team.description}
                </p>
                
                {/* Team Members */}
                <div className="flex -space-x-2 overflow-hidden mb-4">
                  {team.team_members?.slice(0, 4).map((member: any, index: number) => (
                    <img 
                      key={index}
                      src={member.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.name || 'User')}&background=6366f1&color=fff`}
                      alt={member.user?.name}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-navy-900"
                      title={member.user?.name}
                    />
                  ))}
                  {team.looking_for_members && (team.team_members?.length || 0) < team.max_members && (
                    <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-electric-blue-100 dark:bg-electric-blue-900/30 ring-2 ring-white dark:ring-navy-900">
                      <Plus size={14} className="text-electric-blue-600 dark:text-electric-blue-400" />
                    </div>
                  )}
                </div>
                
                {/* Hackathon Info */}
                {team.hackathon && (
                  <div className="mb-4 p-3 bg-navy-50 dark:bg-navy-800 rounded-xl">
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy size={14} className="text-electric-blue-500" />
                      <span className="font-medium text-navy-900 dark:text-white">
                        {team.hackathon.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-navy-500 dark:text-navy-400 mt-1">
                      <Calendar size={12} />
                      <span>{formatDate(team.hackathon.start_date)}</span>
                      <MapPin size={12} className="ml-2" />
                      <span>{team.hackathon.location}</span>
                    </div>
                  </div>
                )}
                
                {team.looking_for_members && (team.team_members?.length || 0) < team.max_members ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleJoinTeam(team.id)}
                      className="btn btn-primary flex-1"
                    >
                      <UserPlus size={16} />
                      Join Team
                    </button>
                    <button 
                      onClick={() => openTeamChat(team.id, team.name)}
                      className="btn btn-secondary"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-sm text-navy-500 dark:text-navy-400">
                      Team is full
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-navy-100 dark:bg-navy-800 h-16 w-16 flex items-center justify-center rounded-full mx-auto mb-4">
            <Users size={24} className="text-navy-500 dark:text-navy-400" />
          </div>
          <h3 className="text-xl font-medium text-navy-900 dark:text-white mb-2">No teams found</h3>
          <p className="text-navy-600 dark:text-navy-300 mb-6">
            {searchTerm ? 'Try adjusting your search terms.' : 'Be the first to create a team!'}
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={18} className="mr-2" />
            Create Team
          </button>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          
          <div className="relative w-full max-w-md card-elevated animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-800">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">Create New Team</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
              <div>
                <label className="form-label">Team Name *</label>
                <input
                  type="text"
                  value={createTeamData.name}
                  onChange={(e) => setCreateTeamData(prev => ({ ...prev, name: e.target.value }))}
                  className="input w-full"
                  placeholder="Enter team name"
                  required
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={createTeamData.description}
                  onChange={(e) => setCreateTeamData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="input w-full resize-none"
                  placeholder="Describe your team and what you're looking for..."
                />
              </div>

              <div>
                <label className="form-label">Hackathon (Optional)</label>
                <select
                  value={createTeamData.hackathon_id}
                  onChange={(e) => setCreateTeamData(prev => ({ ...prev, hackathon_id: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">Select a hackathon</option>
                  {hackathons.map((hackathon) => (
                    <option key={hackathon.id} value={hackathon.id}>
                      {hackathon.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Maximum Members</label>
                <select
                  value={createTeamData.max_members}
                  onChange={(e) => setCreateTeamData(prev => ({ ...prev, max_members: parseInt(e.target.value) }))}
                  className="input w-full"
                >
                  {[2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} members</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="looking_for_members"
                  checked={createTeamData.looking_for_members}
                  onChange={(e) => setCreateTeamData(prev => ({ ...prev, looking_for_members: e.target.checked }))}
                  className="h-4 w-4 text-electric-blue-600 focus:ring-electric-blue-500 border-navy-300 rounded"
                />
                <label htmlFor="looking_for_members" className="text-sm text-navy-700 dark:text-navy-300">
                  Looking for new members
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !createTeamData.name.trim()}
                  className="btn btn-primary flex-1"
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Save size={18} />
                      Create Team
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;