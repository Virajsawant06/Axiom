import { Github, ExternalLink, Calendar, Trophy, Users } from 'lucide-react';

interface SubmissionCardProps {
  submission: any;
  showPlacement?: boolean;
  onPlacementUpdate?: (submissionId: string, placement: number) => void;
}

const SubmissionCard = ({ submission, showPlacement = false, onPlacementUpdate }: SubmissionCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlacementColor = (placement: number) => {
    if (placement === 1) return 'text-yellow-600 dark:text-yellow-400';
    if (placement === 2) return 'text-gray-600 dark:text-gray-400';
    if (placement === 3) return 'text-amber-600 dark:text-amber-400';
    return 'text-navy-600 dark:text-navy-400';
  };

  const getPlacementIcon = (placement: number) => {
    if (placement === 1) return '🥇';
    if (placement === 2) return '🥈';
    if (placement === 3) return '🥉';
    return `#${placement}`;
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-navy-900 dark:text-white text-lg mb-2">
            {submission.project?.name || 'Untitled Project'}
          </h3>
          
          {submission.team ? (
            <div className="flex items-center gap-3 mb-3">
              <img
                src={submission.team.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.team.name)}&background=6366f1&color=fff`}
                alt={submission.team.name}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="font-medium text-navy-900 dark:text-white">
                  {submission.team.name}
                </p>
                <div className="flex items-center gap-1 text-sm text-navy-500 dark:text-navy-400">
                  <Users size={14} />
                  <span>{submission.team.team_members?.length || 0} members</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3">
              <img
                src={submission.submitted_by_user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.submitted_by_user?.name || 'User')}&background=6366f1&color=fff`}
                alt={submission.submitted_by_user?.name}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="font-medium text-navy-900 dark:text-white">
                  {submission.submitted_by_user?.name}
                </p>
                <p className="text-sm text-navy-500 dark:text-navy-400">
                  Individual submission
                </p>
              </div>
            </div>
          )}
        </div>

        {submission.placement && (
          <div className={`flex items-center gap-1 font-bold ${getPlacementColor(submission.placement)}`}>
            <Trophy size={18} />
            <span>{getPlacementIcon(submission.placement)}</span>
          </div>
        )}
      </div>

      <p className="text-navy-600 dark:text-navy-300 text-sm mb-4 line-clamp-3">
        {submission.project?.description || 'No description provided.'}
      </p>

      <div className="flex items-center gap-2 text-sm text-navy-500 dark:text-navy-400 mb-4">
        <Calendar size={14} />
        <span>Submitted {formatDate(submission.submitted_at)}</span>
      </div>

      {submission.team && submission.team.team_members && (
        <div className="mb-4">
          <p className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">Team Members:</p>
          <div className="flex flex-wrap gap-2">
            {submission.team.team_members.map((member: any, index: number) => (
              <div key={index} className="flex items-center gap-2 bg-navy-50 dark:bg-navy-800 rounded-lg px-3 py-1">
                <img
                  src={member.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.name || 'User')}&background=6366f1&color=fff`}
                  alt={member.user?.name}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-sm text-navy-700 dark:text-navy-300">
                  {member.user?.name}
                </span>
                {member.user?.verified && (
                  <span className="text-electric-blue-500 text-xs">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {submission.project?.github_url && (
          <a
            href={submission.project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary flex-1 text-sm py-2"
          >
            <Github size={16} />
            View Code
          </a>
        )}
        
        {submission.project?.demo_url && (
          <a
            href={submission.project.demo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary flex-1 text-sm py-2"
          >
            <ExternalLink size={16} />
            Live Demo
          </a>
        )}
      </div>

      {showPlacement && onPlacementUpdate && (
        <div className="mt-4 pt-4 border-t border-navy-200 dark:border-navy-800">
          <label className="form-label text-sm">Set Placement:</label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map(place => (
              <button
                key={place}
                onClick={() => onPlacementUpdate(submission.id, place)}
                className={`btn text-sm py-1 px-3 ${
                  submission.placement === place 
                    ? 'btn-primary' 
                    : 'btn-secondary'
                }`}
              >
                {getPlacementIcon(place)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionCard;