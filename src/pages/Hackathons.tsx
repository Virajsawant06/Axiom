import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, Users, Trophy } from 'lucide-react';
import { mockHackathons } from '../data/mockData';

const Hackathons = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Get all unique tags from hackathons
  const allTags = Array.from(
    new Set(mockHackathons.flatMap(hackathon => hackathon.tags))
  );
  
  // Filter hackathons based on search term and selected tags
  const filteredHackathons = mockHackathons.filter(hackathon => {
    const matchesSearch = 
      searchTerm === '' || 
      hackathon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hackathon.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.some(tag => hackathon.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Discover Hackathons
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Find and join upcoming hackathons to showcase your skills and meet fellow developers
        </p>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search hackathons..." 
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex-shrink-0">
          <button className="btn btn-secondary">
            <Filter size={18} className="mr-2" />
            Filters
          </button>
        </div>
      </div>
      
      {/* Tags */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Popular Tags</h2>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTags.includes(tag)
                  ? 'bg-axiom-500 text-white'
                  : 'bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      {/* Hackathons Grid */}
      {filteredHackathons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((hackathon) => (
            <Link key={hackathon.id} to={`/hackathons/${hackathon.id}`} className="card overflow-hidden group">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={hackathon.image} 
                  alt={hackathon.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-axiom-100 dark:bg-axiom-800 text-axiom-800 dark:text-axiom-300 text-xs px-2 py-1 rounded-full">
                  {hackathon.location}
                </div>
                {hackathon.status === 'upcoming' && (
                  <div className="absolute bottom-3 left-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                    Upcoming
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-axiom-600 dark:group-hover:text-axiom-400 transition-colors duration-200">
                  {hackathon.name}
                </h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <Calendar size={14} className="mr-1" />
                  <span>{hackathon.startDate} to {hackathon.endDate}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">
                  {hackathon.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hackathon.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index} 
                      className="text-xs bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {hackathon.tags.length > 3 && (
                    <span className="text-xs bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full">
                      +{hackathon.tags.length - 3}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Trophy size={14} className="mr-1" />
                    <span>
                      {hackathon.prizes.length} {hackathon.prizes.length === 1 ? 'prize' : 'prizes'}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Users size={14} className="mr-1" />
                    <span>{hackathon.teams} teams</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-axiom-800 h-16 w-16 flex items-center justify-center rounded-full mx-auto mb-4">
            <Trophy size={24} className="text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No hackathons found</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
};

export default Hackathons;