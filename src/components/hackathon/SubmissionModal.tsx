import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { SubmissionService } from '../../services/submissionService';
import { X, Save, Github, ExternalLink, AlertCircle } from 'lucide-react';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathon: any;
  userTeam?: any;
  onSubmissionSuccess: () => void;
}

const SubmissionModal = ({ 
  isOpen, 
  onClose, 
  hackathon, 
  userTeam, 
  onSubmissionSuccess 
}: SubmissionModalProps) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    project_name: '',
    description: '',
    github_url: '',
    demo_url: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.project_name.trim()) {
      newErrors.project_name = 'Project name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (!formData.github_url.trim()) {
      newErrors.github_url = 'GitHub repository URL is required';
    } else if (!formData.github_url.includes('github.com')) {
      newErrors.github_url = 'Please enter a valid GitHub repository URL';
    }

    if (formData.demo_url && !formData.demo_url.startsWith('http')) {
      newErrors.demo_url = 'Demo URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    setIsSubmitting(true);
    try {
      await SubmissionService.submitProject({
        hackathon_id: hackathon.id,
        team_id: userTeam?.id,
        user_id: user.id,
        project_name: formData.project_name.trim(),
        description: formData.description.trim(),
        github_url: formData.github_url.trim(),
        demo_url: formData.demo_url.trim() || undefined
      });

      showSuccess(
        'Project submitted!', 
        `Your project "${formData.project_name}" has been submitted successfully.`
      );
      
      onSubmissionSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error submitting project:', error);
      showError('Submission failed', 'Failed to submit your project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl card-elevated animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-800">
          <div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white">
              Submit Your Project
            </h2>
            <p className="text-navy-600 dark:text-navy-300 text-sm mt-1">
              Submit your project for {hackathon.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {userTeam && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle size={18} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-300">
                    Submitting as team: {userTeam.name}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    This submission will represent your entire team.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              name="project_name"
              value={formData.project_name}
              onChange={handleInputChange}
              className={`input w-full ${errors.project_name ? 'border-red-500' : ''}`}
              placeholder="Enter your project name"
            />
            {errors.project_name && (
              <p className="form-error mt-1">{errors.project_name}</p>
            )}
          </div>

          <div>
            <label className="form-label">Project Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`input w-full resize-none ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe your project, what it does, and the technologies used..."
            />
            {errors.description && (
              <p className="form-error mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="form-label">GitHub Repository URL *</label>
            <div className="relative">
              <Github size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
              <input
                type="url"
                name="github_url"
                value={formData.github_url}
                onChange={handleInputChange}
                className={`input pl-10 w-full ${errors.github_url ? 'border-red-500' : ''}`}
                placeholder="https://github.com/username/repository"
              />
            </div>
            {errors.github_url && (
              <p className="form-error mt-1">{errors.github_url}</p>
            )}
          </div>

          <div>
            <label className="form-label">Demo URL (Optional)</label>
            <div className="relative">
              <ExternalLink size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
              <input
                type="url"
                name="demo_url"
                value={formData.demo_url}
                onChange={handleInputChange}
                className={`input pl-10 w-full ${errors.demo_url ? 'border-red-500' : ''}`}
                placeholder="https://your-demo-site.com"
              />
            </div>
            {errors.demo_url && (
              <p className="form-error mt-1">{errors.demo_url}</p>
            )}
            <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
              Link to your live demo, deployed app, or video demonstration
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-navy-200 dark:border-navy-800">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Submitting...
                </div>
              ) : (
                <>
                  <Save size={18} />
                  Submit Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmissionModal;