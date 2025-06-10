import { User as UserType } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { UserCheck, Star, Award, MapPin, ExternalLink, Github, Linkedin } from 'lucide-react';

interface UserCardProps {
  user: UserType;
  compact?: boolean;
}

const UserCard = ({ user, compact = false }: UserCardProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <img 
          src={user.avatar} 
          alt={user.name} 
          className="h-10 w-10 rounded-full"
        />
        <div>
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
            {user.verified && (
              <span className="ml-1 text-blue-500">
                <UserCheck size={14} />
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="bg-gradient-to-r from-axiom-500 to-axiom-600 h-24"></div>
      <div className="px-4 pb-4 relative">
        <div className="flex justify-between">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="h-16 w-16 rounded-full border-4 border-white dark:border-axiom-900 -mt-8"
          />
          <div className="mt-2 flex gap-1">
            <div className="px-2 py-1 bg-axiom-100 dark:bg-axiom-800 text-axiom-800 dark:text-axiom-300 rounded-full text-xs font-medium flex items-center">
              <Star size={12} className="mr-1" />
              {user.ranking} MMR
            </div>
          </div>
        </div>
        
        <div className="mt-2">
          <div className="flex items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
            {user.verified && (
              <span className="ml-1 text-blue-500">
                <UserCheck size={14} />
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
        </div>
        
        {user.location && (
          <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-300">
            <MapPin size={14} className="mr-1" />
            {user.location}
          </div>
        )}
        
        {user.bio && (
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {user.bio}
          </p>
        )}
        
        <div className="mt-3 flex flex-wrap gap-2">
          {user.skills.slice(0, 4).map((skill, index) => (
            <span 
              key={index} 
              className="text-xs bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full"
            >
              {skill}
            </span>
          ))}
          {user.skills.length > 4 && (
            <span className="text-xs bg-gray-100 dark:bg-axiom-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full">
              +{user.skills.length - 4} more
            </span>
          )}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="flex gap-2">
            {user.github && (
              <a 
                href={`https://${user.github}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-axiom-600 dark:hover:text-axiom-400"
              >
                <Github size={18} />
              </a>
            )}
            {user.linkedin && (
              <a 
                href={`https://${user.linkedin}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-axiom-600 dark:hover:text-axiom-400"
              >
                <Linkedin size={18} />
              </a>
            )}
            {user.website && (
              <a 
                href={user.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-axiom-600 dark:hover:text-axiom-400"
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
          
          <Link 
            to={`/profile/${user.id}`}
            className="btn btn-primary py-1 px-3 text-sm"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserCard;