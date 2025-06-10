import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Users, Trophy, Star } from 'lucide-react';
import { mockTeams, mockUsers } from '../data/mockData';

const Teams = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // Get all unique skills from teams
  const allSkills = Array.from(
    new Set(mockTeams.flatMap(team => team.skills))
  );
  
  // Filter teams based on search term and selected skills
  const filteredTeams = mockTeams.filter(team => {
    const matchesSearch = 
      searchTerm === '' || 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkills = 
      selectedSkills.length === 0 || 
      selectedSkills.some(skill => team.skills.includes(skill));
    
    return matchesSearch && matchesSkills;
  });
  
  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill) 
        : [...prev, skill]
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Find Your Team
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Connect with other developers to form the perfect hackathon team
        </p>
      </div>
      
      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
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
          <button className="btn btn-primary">
            <Plus size={18} className="mr-2" />
            Create Team
          </button>
        </div>
      </div>
      
      {/* Skills Filter */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Filter by Skills</h2>
        <div className="flex flex-wrap gap-2">
          {allSkills.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedSkills.includes(skill)
                  ? 'bg-axiom-500 text-white'
                  : 'bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>
      
      {/* Teams Grid */}
      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div key={team.id} className="card overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={team.avatar} 
                    alt={team.name} 
                    className="h-12 w-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{team.name}</h3>
                    <div className="flex items-center text-sm">
                      <Users size={14} className="mr-1 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">{team.members.length} members</span>
                      <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                      <Star size={14} className="mr-1 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">{team.ranking} MMR</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {team.description}
                </p>
                
                <div className="flex -space-x-2 overflow-hidden mb-4">
                  {team.members.map((member, index) => (
                    <img 
                      key={index}
                      src={member.avatar}
                      alt={member.name}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-axiom-900"
                      title={member.name}
                    />
                  ))}
                  {team.lookingForMembers && (
                    <>
                      {team.openRoles.slice(0, 2).map((role, index) => (
                        <div 
                          key={index}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-axiom-100 dark:bg-axiom-800 ring-2 ring-white dark:ring-axiom-900"
                          title={role}
                        >
                          <Plus size={14} className="text-axiom-600 dark:text-axiom-400" />
                        </div>
                      ))}
                      {team.openRoles.length > 2 && (
                        <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-axiom-800 ring-2 ring-white dark:ring-axiom-900">
                          <span className="text-xs text-gray-600 dark:text-gray-300">+{team.openRoles.length - 2}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {team.skills.slice(0, 3).map((skill, index) => (
                    <span 
                      key={index} 
                      className="text-xs bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {team.skills.length > 3 && (
                    <span className="text-xs bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full">
                      +{team.skills.length - 3}
                    </span>
                  )}
                </div>
                
                {team.lookingForMembers && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-axiom-600 dark:text-axiom-400 mb-1">Looking for:</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {team.openRoles.join(', ')}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button className="btn btn-primary flex-1">
                    {team.lookingForMembers ? 'Request to Join' : 'View Team'}
                  </button>
                  <button className="btn btn-secondary">
                    Contact
                  </button>
                </div>
              </div>
              
              {team.hackathons.length > 0 && (
                <div className="bg-gray-50 dark:bg-axiom-950 p-4 border-t border-gray-200 dark:border-axiom-800">
                  <div className="flex items-center">
                    <Trophy size={16} className="text-axiom-600 dark:text-axiom-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {team.hackathons[0].name}
                    </span>
                    {team.hackathons[0].placement && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        team.hackathons[0].placement === 1 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' 
                          : team.hackathons[0].placement === 2 
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300' 
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                      }`}>
                        {team.hackathons[0].placement === 1 
                          ? '🥇 1st Place' 
                          : team.hackathons[0].placement === 2 
                            ? '🥈 2nd Place' 
                            : '🥉 3rd Place'
                        }
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-axiom-800 h-16 w-16 flex items-center justify-center rounded-full mx-auto mb-4">
            <Users size={24} className="text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No teams found</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
};

export default Teams;