import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Trophy, 
  Users, 
  Code, 
  MessageSquare, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Hash,
  Sparkles,
  PlusCircle,
  Target
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const { user } = useAuth();

  const navLinks = [
    { to: '/dashboard', text: 'Home', icon: <Home size={20} /> },
    { to: '/hackathons', text: 'Hackathons', icon: <Trophy size={20} /> },
    { to: '/teams', text: 'Teams', icon: <Users size={20} /> },
    { to: '/team-matching', text: 'Find Teammates', icon: <Target size={20} /> },
    
    { to: '/messages', text: 'Messages', icon: <MessageSquare size={20} /> },
    ...(user?.role === 'organizer' ? [{ to: '/organizer', text: 'Organizer Panel', icon: <PlusCircle size={20} /> }] : []),
    { to: '/settings', text: 'Settings', icon: <Settings size={20} /> },
  ];

  const channels = [
    { id: 'hack-1', name: 'Climate Hack 2024' },
    { id: 'hack-2', name: 'AI for Good' },
    { id: 'hack-3', name: 'HealthTech Innovate' },
  ];

  return (
    <aside 
      className={`glass dark:glass-dark border-r border-white/20 dark:border-navy-800/50 transition-all duration-300 flex flex-col h-full
      ${isOpen ? 'w-72' : 'w-20'}`}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/10 dark:border-navy-800/50">
        <div className="flex items-center">
          <img
            src="/logo.png" // Reference to your new logo
            alt="Axiom Logo"
            className={`h-12 w-12 object-contain ${isOpen ? 'mr-4' : ''}`} // Adjust styling and margin based on sidebar state
          />
          {isOpen && (
            <div>
              <span className="text-xl font-bold gradient-text">Axiom</span>
              <p className="text-xs text-navy-500 dark:text-navy-400 font-medium">Social Dev Platform</p>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-white/10 dark:hover:bg-navy-800/50 transition-all duration-300 hover:scale-110"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* User Profile */}
      {user && (
        <div className={`p-6 border-b border-white/10 dark:border-navy-800/50 ${!isOpen && 'flex justify-center'}`}>
          <div className="flex items-center">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="h-12 w-12 rounded-2xl object-cover shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-navy-900"></div>
            </div>
            {isOpen && (
              <div className="ml-4">
                <p className="font-semibold text-navy-900 dark:text-white">{user.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${user.verified ? 'bg-emerald-500' : 'bg-navy-400'}`}></span>
                  <span className="text-sm text-navy-500 dark:text-navy-400 capitalize font-medium">
                    {user.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-6 flex-1 overflow-y-auto px-4">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''} ${!isOpen ? 'justify-center px-3' : ''}`
                }
              >
                <div className="transition-transform duration-300 hover:scale-110">
                  {link.icon}
                </div>
                {isOpen && <span className="font-medium">{link.text}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {isOpen && (
          <>
            <div className="mt-8 px-2">
              <h3 className="text-xs font-bold text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-4">
                Your Hackathons
              </h3>
            </div>
            <ul className="space-y-1">
              {channels.map((channel) => (
                <li key={channel.id}>
                  <NavLink
                    to={`/hackathons/${channel.id}`}
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-navy-600 dark:text-navy-300 hover:text-electric-blue-600 dark:hover:text-electric-blue-400 hover:bg-electric-blue-50 dark:hover:bg-electric-blue-900/20 transition-all duration-300 ${
                        isActive ? 'bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white shadow-lg shadow-electric-blue-500/25' : ''
                      }`
                    }
                  >
                    <Hash size={16} />
                    <span className="truncate font-medium">{channel.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* User Stats */}
      {user && isOpen && (
        <div className="p-6 border-t border-white/10 dark:border-navy-800/50">
          <div className="flex items-center gap-3">
            <div className="badge badge-primary">
              {user.ranking} MMR
            </div>
            <div className="badge badge-success">
              Top 10%
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;