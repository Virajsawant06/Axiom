import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Trophy, Users, Calendar, ArrowRight, User, GitBranch, Star } from 'lucide-react';
import { HackathonService } from '../services/hackathonService';
import { mockTeams } from '../data/mockData';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadHackathons();
  }, []);

  const loadHackathons = async () => {
    try {
      setIsLoading(true);
      const data = await HackathonService.getHackathons();
      
      // Filter for upcoming and active hackathons
      const relevantHackathons = data.filter(
        hackathon => hackathon.status === 'upcoming' || hackathon.status === 'active'
      ).slice(0, 3);
      
      setHackathons(relevantHackathons);
    } catch (error) {
      console.error('Error loading hackathons:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mock user stats
  const userStats = {
    hackathonsJoined: 4,
    teamsFormed: 2,
    projectsCompleted: 3,
    currentRanking: user?.ranking || 0,
    rankPercentile: 'Top 10%',
  };
  
  // Mock activity feed
  const activityFeed = [
    {
      id: 1,
      type: 'hackathon',
      title: 'You registered for Climate Hack 2024',
      timestamp: '2 days ago',
    },
    {
      id: 2,
      type: 'team',
      title: 'Maria Chen joined your team ByteBusters',
      timestamp: '5 days ago',
    },
    {
      id: 3,
      type: 'achievement',
      title: 'You earned the "First Hackathon" badge',
      timestamp: '1 week ago',
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Here's what's happening in your developer world
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hackathons Joined</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{userStats.hackathonsJoined}</p>
            </div>
            <div className="bg-axiom-100 dark:bg-axiom-800 p-3 rounded-lg">
              <Trophy size={20} className="text-axiom-600 dark:text-axiom-400" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Teams Formed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{userStats.teamsFormed}</p>
            </div>
            <div className="bg-axiom-100 dark:bg-axiom-800 p-3 rounded-lg">
              <Users size={20} className="text-axiom-600 dark:text-axiom-400" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Projects Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{userStats.projectsCompleted}</p>
            </div>
            <div className="bg-axiom-100 dark:bg-axiom-800 p-3 rounded-lg">
              <GitBranch size={20} className="text-axiom-600 dark:text-axiom-400" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Developer Ranking</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{userStats.currentRanking}</p>
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
                {userStats.rankPercentile}
              </span>
            </div>
            <div className="bg-axiom-100 dark:bg-axiom-800 p-3 rounded-lg">
              <Star size={20} className="text-axiom-600 dark:text-axiom-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-axiom-800 mb-6">
        <nav className="flex space-x-4">
          {['overview', 'teams', 'hackathons', 'projects'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 text-sm font-medium border-b-2 ${
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
      
      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Hackathons */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {hackathons.length > 0 ? 'Upcoming Hackathons' : 'No Upcoming Hackathons'}
              </h2>
              <Link to="/hackathons" className="text-sm text-axiom-600 dark:text-axiom-400 hover:underline flex items-center">
                View all <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto mb-3"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading hackathons...</p>
              </div>
            ) : hackathons.length > 0 ? (
              <div className="space-y-4">
                {hackathons.map((hackathon) => (
                  <div key={hackathon.id} className="card overflow-hidden">
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={hackathon.image_url} 
                        alt={hackathon.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{hackathon.name}</h3>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <Calendar size={14} className="mr-1" />
                            <span>{formatDate(hackathon.start_date)} to {formatDate(hackathon.end_date)}</span>
                          </div>
                        </div>
                        <div className="bg-axiom-100 dark:bg-axiom-800 text-axiom-800 dark:text-axiom-300 text-xs px-2 py-1 rounded-full">
                          {hackathon.location}
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">
                        {hackathon.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {hackathon.hackathon_tag_relations?.slice(0, 4).map((relation: any, index: number) => (
                          <span 
                            key={index} 
                            className="text-xs bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full"
                          >
                            {relation.hackathon_tags.name}
                          </span>
                        ))}
                        {hackathon.hackathon_tag_relations?.length > 4 && (
                          <span className="text-xs bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full">
                            +{hackathon.hackathon_tag_relations.length - 4} more
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Max {hackathon.max_participants} participants</span>
                        </div>
                        <Link 
                          to={`/hackathons/${hackathon.id}`}
                          className="btn btn-primary py-1 px-3 text-sm"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Trophy size={24} className="text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No upcoming hackathons</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  There are currently no upcoming hackathons. Check back later or create your own!
                </p>
                <Link to="/hackathons" className="btn btn-primary">
                  Browse All Hackathons
                </Link>
              </div>
            )}
          </div>
          
          {/* Activity Feed & Teams */}
          <div className="space-y-6">
            {/* Activity Feed */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Activity Feed</h2>
              <div className="card p-4">
                <div className="space-y-4">
                  {activityFeed.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-axiom-800 last:border-b-0 last:pb-0">
                      <div className={`p-2 rounded-full 
                        ${activity.type === 'hackathon' ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                        ${activity.type === 'team' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                        ${activity.type === 'achievement' ? 'bg-amber-100 dark:bg-amber-900/30' : ''}
                      `}>
                        {activity.type === 'hackathon' && <Trophy size={16} className="text-purple-600 dark:text-purple-400" />}
                        {activity.type === 'team' && <Users size={16} className="text-blue-600 dark:text-blue-400" />}
                        {activity.type === 'achievement' && <Star size={16} className="text-amber-600 dark:text-amber-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{activity.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Your Teams */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Teams</h2>
                <Link to="/teams" className="text-sm text-axiom-600 dark:text-axiom-400 hover:underline flex items-center">
                  View all <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
              
              <div className="space-y-3">
                {mockTeams.slice(0, 2).map((team) => (
                  <div key={team.id} className="card p-4">
                    <div className="flex items-center gap-3">
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
                    <div className="mt-3">
                      <div className="flex -space-x-2 overflow-hidden">
                        {team.members.map((member, index) => (
                          <img 
                            key={index}
                            src={member.avatar}
                            alt={member.name}
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-axiom-900"
                          />
                        ))}
                        {team.lookingForMembers && (
                          <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-axiom-100 dark:bg-axiom-800 ring-2 ring-white dark:ring-axiom-900">
                            <User size={14} className="text-axiom-600 dark:text-axiom-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    {team.lookingForMembers && (
                      <div className="mt-2 text-xs text-axiom-600 dark:text-axiom-400">
                        Looking for: {team.openRoles.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Other tabs - placeholder content */}
      {activeTab === 'teams' && (
        <div className="text-center py-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Teams Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Teams content will be displayed here. This tab is under development.
          </p>
        </div>
      )}
      
      {activeTab === 'hackathons' && (
        <div className="text-center py-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hackathons Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Hackathons content will be displayed here. This tab is under development.
          </p>
        </div>
      )}
      
      {activeTab === 'projects' && (
        <div className="text-center py-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Projects Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Projects content will be displayed here. This tab is under development.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;