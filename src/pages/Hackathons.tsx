import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, Users, Trophy } from 'lucide-react';
import { HackathonService } from '../services/hackathonService';
import { useToast } from '../contexts/ToastContext';

const Hackathons = () => {
  const { showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  useEffect(() => {
    loadHackathons();
  }, []);

  const loadHackathons = async () => {
    try {
      setIsLoading(true);
      const data = await HackathonService.getHackathons();
      setHackathons(data);
      
      // Extract all unique tags
      const tags = new Set<string>();
      data.forEach(hackathon => {
        hackathon.hackathon_tag_relations?.forEach((relation: any) => {
          tags.add(relation.hackathon_tags.name);
        });
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Error loading hackathons:', error);
      showError('Failed to load hackathons', 'Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter hackathons based on search term and selected tags
  const filteredHackathons = hackathons.filter(hackathon => {
    const matchesSearch = 
      searchTerm === '' || 
      hackathon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hackathon.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const hackathonTags = hackathon.hackathon_tag_relations?.map((rel: any) => rel.hackathon_tags.name) || [];
    const matchesTags = 
      selectedTags.length === 0 || 
      selectedTags.some(tag => hackathonTags.includes(tag));
    
    return matchesSearch && matchesTags;
  });
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Enhanced tag color system with more vibrant colors
  const getTagColor = (tagName: string) => {
    const colors = {
      'AI': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25',
      'Climate': 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25',
      'FinTech': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25',
      'Healthcare': 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25',
      'Education': 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25',
      'Gaming': 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25',
      'Social Impact': 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25',
      'Blockchain': 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25',
      'IoT': 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25',
      'Machine Learning': 'bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25',
      'Data': 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25',
      'Mobile': 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25',
      'Web': 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/25',
      'Sustainability': 'bg-gradient-to-r from-lime-500 to-lime-600 text-white shadow-lg shadow-lime-500/25'
    };
    
    return colors[tagName as keyof typeof colors] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25';
  };
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-16">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-navy-600 dark:text-navy-300">Loading hackathons...</p>
        </div>
      </div>
    );
  }
  
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
      {allTags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Popular Tags</h2>
          <div className="flex flex-wrap gap-3">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 transform ${
                  selectedTags.includes(tag)
                    ? 'bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white shadow-xl shadow-electric-blue-500/40 scale-105'
                    : getTagColor(tag) + ' hover:shadow-xl'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Hackathons Grid */}
      {filteredHackathons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((hackathon) => (
            <Link key={hackathon.id} to={`/hackathons/${hackathon.id}`} className="card overflow-hidden group hover-lift">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={hackathon.image_url} 
                  alt={hackathon.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-navy-800/90 text-navy-800 dark:text-navy-300 text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  {hackathon.location}
                </div>
                {hackathon.status === 'upcoming' && (
                  <div className="absolute bottom-3 left-3 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    Upcoming
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-electric-blue-600 dark:group-hover:text-electric-blue-400 transition-colors duration-200">
                  {hackathon.name}
                </h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <Calendar size={14} className="mr-1" />
                  <span>{formatDate(hackathon.start_date)} to {formatDate(hackathon.end_date)}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">
                  {hackathon.description}
                </p>
                
                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {hackathon.hackathon_tag_relations?.slice(0, 3).map((relation: any, index: number) => (
                    <span 
                      key={index} 
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${getTagColor(relation.hackathon_tags.name)}`}
                    >
                      {relation.hackathon_tags.name}
                    </span>
                  ))}
                  {hackathon.hackathon_tag_relations?.length > 3 && (
                    <span className="text-xs bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1 rounded-full font-semibold shadow-lg shadow-gray-500/25">
                      +{hackathon.hackathon_tag_relations.length - 3}
                    </span>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Trophy size={14} className="mr-1" />
                    <span>Prizes Available</span>
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Users size={14} className="mr-1" />
                    <span>Max {hackathon.max_participants}</span>
                  </div>
                </div>
                
                {/* Organizer */}
                {hackathon.organizer && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-navy-800">
                    <div className="flex items-center gap-2">
                      <img
                        src={hackathon.organizer.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(hackathon.organizer.name)}&background=6366f1&color=fff`}
                        alt={hackathon.organizer.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        by {hackathon.organizer.name}
                      </span>
                      {hackathon.organizer.verified && (
                        <span className="text-electric-blue-500">✓</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-navy-800 h-16 w-16 flex items-center justify-center rounded-full mx-auto mb-4">
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