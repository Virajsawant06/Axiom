import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Users, Clock, ArrowLeft, Share2, Heart, MessageSquare, UserPlus } from 'lucide-react';
import { mockHackathons, mockUsers } from '../data/mockData';
import UserCard from '../components/ui/UserCard';

const HackathonDetails = () => {
  const { hackathonId } = useParams<{ hackathonId: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Find the hackathon with the matching ID
  const hackathon = mockHackathons.find(h => h.id === hackathonId);
  
  // If hackathon is not found, show an error message
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
  const deadline = new Date(hackathon.registrationDeadline);
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate time until hackathon starts
  const startDate = new Date(hackathon.startDate);
  const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
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
            src={hackathon.image} 
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
                <span>{hackathon.startDate} to {hackathon.endDate}</span>
              </div>
            </div>
            
            <div className="flex mt-4 md:mt-0 gap-2">
              <button className="btn bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
                <Share2 size={18} />
              </button>
              <button className="btn bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
                <Heart size={18} />
              </button>
              <button className="btn bg-axiom-500 text-white">
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
                {hackathon.registrationDeadline}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Prizes</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {hackathon.prizes.length} Categories
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {hackathon.participants} / {hackathon.teams} teams
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="mt-8">
        <div className="border-b border-gray-200 dark:border-axiom-800">
          <nav className="flex space-x-8">
            {['overview', 'prizes', 'teams', 'discussions'].map((tab) => (
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
                  <p className="text-gray-700 dark:text-gray-300 mt-4">
                    Join us for an exciting opportunity to showcase your skills, work on innovative projects, and compete for amazing prizes. This hackathon brings together developers, designers, and problem solvers from around the world to create solutions that address real-world challenges.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-4">
                    Whether you're an experienced developer or just starting out, this hackathon offers a supportive environment to learn, collaborate, and build something meaningful. Form a team or join one through Axiom's team matching feature!
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
                    <p className="text-gray-700 dark:text-gray-300">Teams must consist of 1-4 members</p>
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
              
              {/* Timeline */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Timeline
                </h2>
                <div className="space-y-6">
                  <div className="relative pl-8 pb-6 border-l-2 border-axiom-200 dark:border-axiom-800">
                    <div className="absolute left-[-8px] top-0 h-4 w-4 rounded-full bg-axiom-500"></div>
                    <div>
                      <p className="text-sm text-axiom-600 dark:text-axiom-400 font-medium">
                        Registration Opens
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        Teams can register and start forming
                      </p>
                    </div>
                  </div>
                  <div className="relative pl-8 pb-6 border-l-2 border-axiom-200 dark:border-axiom-800">
                    <div className="absolute left-[-8px] top-0 h-4 w-4 rounded-full bg-axiom-500"></div>
                    <div>
                      <p className="text-sm text-axiom-600 dark:text-axiom-400 font-medium">
                        Registration Deadline: {hackathon.registrationDeadline}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        Last day to register and form teams
                      </p>
                    </div>
                  </div>
                  <div className="relative pl-8 pb-6 border-l-2 border-axiom-200 dark:border-axiom-800">
                    <div className="absolute left-[-8px] top-0 h-4 w-4 rounded-full bg-axiom-500"></div>
                    <div>
                      <p className="text-sm text-axiom-600 dark:text-axiom-400 font-medium">
                        Hackathon Starts: {hackathon.startDate}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        Coding begins! Kickoff meeting and theme announcement
                      </p>
                    </div>
                  </div>
                  <div className="relative pl-8">
                    <div className="absolute left-[-8px] top-0 h-4 w-4 rounded-full bg-axiom-500"></div>
                    <div>
                      <p className="text-sm text-axiom-600 dark:text-axiom-400 font-medium">
                        Hackathon Ends: {hackathon.endDate}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        Submission deadline and final presentations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Organizer */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Organized by
                </h3>
                <UserCard user={hackathon.organizer} compact={true} />
                <div className="mt-4">
                  <button className="btn btn-outline w-full">
                    <MessageSquare size={18} className="mr-2" />
                    Contact Organizer
                  </button>
                </div>
              </div>
              
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
                  {hackathon.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="text-sm bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Prizes Tab */}
        {activeTab === 'prizes' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Prizes & Rewards
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {hackathon.prizes.map((prize, index) => (
                  <div key={index} className={`card p-6 border-t-4 ${
                    prize.place === 1 
                      ? 'border-t-yellow-400' 
                      : prize.place === 2 
                        ? 'border-t-gray-400' 
                        : 'border-t-amber-600'
                  }`}>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {prize.place === 1 
                          ? '🥇 First Place' 
                          : prize.place === 2 
                            ? '🥈 Second Place' 
                            : '🥉 Third Place'
                        }
                      </h3>
                    </div>
                    <p className="mt-3 text-gray-700 dark:text-gray-300">
                      {prize.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Additional Benefits
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4 flex items-start gap-3">
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Trophy size={18} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">MMR Points</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Earn ranking points based on your performance
                    </p>
                  </div>
                </div>
                
                <div className="card p-4 flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Users size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Networking</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Connect with industry professionals and peers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Participating Teams
              </h2>
              <button className="btn btn-primary">
                <UserPlus size={18} className="mr-2" />
                Create a Team
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Placeholder teams */}
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-axiom-500 flex items-center justify-center text-white font-bold">
                    BB
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">ByteBusters</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">3 members • Frontend focused</p>
                  </div>
                </div>
                <div className="mt-3 flex -space-x-2 overflow-hidden">
                  {mockUsers.slice(0, 2).map((user, index) => (
                    <img 
                      key={index}
                      src={user.avatar}
                      alt={user.name}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-axiom-900"
                    />
                  ))}
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-axiom-100 dark:bg-axiom-800 ring-2 ring-white dark:ring-axiom-900">
                    <User size={14} className="text-axiom-600 dark:text-axiom-400" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-axiom-600 dark:text-axiom-400">
                  Looking for: Backend Developer
                </div>
                <button className="btn btn-outline w-full mt-3 text-sm py-1.5">
                  View Team
                </button>
              </div>
              
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold">
                    PP
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">PixelPerfect</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 members • Design focused</p>
                  </div>
                </div>
                <div className="mt-3 flex -space-x-2 overflow-hidden">
                  {mockUsers.slice(1, 2).map((user, index) => (
                    <img 
                      key={index}
                      src={user.avatar}
                      alt={user.name}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-axiom-900"
                    />
                  ))}
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-axiom-100 dark:bg-axiom-800 ring-2 ring-white dark:ring-axiom-900">
                    <User size={14} className="text-axiom-600 dark:text-axiom-400" />
                  </div>
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-axiom-100 dark:bg-axiom-800 ring-2 ring-white dark:ring-axiom-900">
                    <User size={14} className="text-axiom-600 dark:text-axiom-400" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-axiom-600 dark:text-axiom-400">
                  Looking for: Frontend Developer, Backend Developer
                </div>
                <button className="btn btn-outline w-full mt-3 text-sm py-1.5">
                  View Team
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="text-center py-16">
            <div className="bg-gray-100 dark:bg-axiom-800 h-16 w-16 flex items-center justify-center rounded-full mx-auto mb-4">
              <MessageSquare size={24} className="text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Join the conversation</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
              Discussions will be available once you register for this hackathon.
            </p>
            <button className="btn btn-primary">
              Register Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HackathonDetails;