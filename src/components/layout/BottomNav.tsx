import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Trophy, 
  Users, 
  MessageSquare, 
  User
} from 'lucide-react';

const BottomNav = () => {
  const { user } = useAuth();

  const navLinks = [
    { to: '/dashboard', icon: <Home size={20} />, label: 'Home' },
    { to: '/hackathons', icon: <Trophy size={20} />, label: 'Events' },
    { to: '/teams', icon: <Users size={20} />, label: 'Teams' },
    { to: '/messages', icon: <MessageSquare size={20} />, label: 'Chat' },
    { to: `/profile/${user?.id}`, icon: <User size={20} />, label: 'Profile' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around gap-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 
              `flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'text-electric-blue-500 bg-electric-blue-50 dark:bg-electric-blue-900/30' 
                  : 'text-navy-600 dark:text-navy-400 hover:text-electric-blue-500 dark:hover:text-electric-blue-400'
              }`
            }
          >
            <div className="transition-transform duration-300 hover:scale-110">
              {link.icon}
            </div>
            <span className="text-xs font-medium">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;