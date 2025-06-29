import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { HackathonService } from '../services/hackathonService';
import { SubmissionService } from '../services/submissionService';
import { Navigate } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  Image as ImageIcon, 
  X, 
  Save,
  Eye,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  UserCheck,
  Github,
  Linkedin,
  Globe,
  Star,
  Upload,
  ExternalLink
} from 'lucide-react';
import SubmissionCard from '../components/hackathon/SubmissionCard';

interface HackathonForm {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  location: string;
  image_url: string;
  max_participants: number;
  max_team_size: number;
  prize_pool: string;
  tags: string[];
}

const OrganizerPanel = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('create');
  const [isLoading, setIsLoading] = useState(false);
  const [myHackathons, setMyHackathons] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState<any>(null);
  const [selectedHackathonRegistrations, setSelectedHackathonRegistrations] = useState<any[]>([]);
  const [selectedHackathonSubmissions, setSelectedHackathonSubmissions] = useState<any[]>([]);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  
  const [formData, setFormData] = useState<HackathonForm>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    location: '',
    image_url: '',
    max_participants: 1000,
    max_team_size: 4,
    prize_pool: '',
    tags: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  // Redirect if not organizer
  if (!user || user.role !== 'organizer') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    if (activeTab === 'manage') {
      loadMyHackathons();
    }
  }, [activeTab]);

  useEffect(() => {
    // Load registration and submission counts for all hackathons
    loadCounts();
  }, [myHackathons]);

  const loadMyHackathons = async () => {
    try {
      setIsLoading(true);
      const hackathons = await HackathonService.getHackathons();
      const myHackathons = hackathons.filter(h => h.organizer_id === user?.id);
      setMyHackathons(myHackathons);
    } catch (error) {
      console.error('Error loading hackathons:', error);
      showError('Failed to load hackathons', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCounts = async () => {
    try {
      const regCounts: Record<string, number> = {};
      const subCounts: Record<string, number> = {};
      
      await Promise.all(
        myHackathons.map(async (hackathon) => {
          // Load registrations grouped by teams
          const registrations = await HackathonService.getHackathonRegistrations(hackathon.id);
          const teamRegistrations = registrations.filter(r => r.registration_type === 'team');
          const individualRegistrations = registrations.filter(r => r.registration_type === 'individual');
          regCounts[hackathon.id] = teamRegistrations.length + individualRegistrations.length;

          // Load submissions
          const submissions = await SubmissionService.getHackathonSubmissions(hackathon.id);
          subCounts[hackathon.id] = submissions.length;
        })
      );
      
      setRegistrationCounts(regCounts);
      setSubmissionCounts(subCounts);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const loadHackathonRegistrations = async (hackathonId: string) => {
    try {
      setIsLoading(true);
      const registrations = await HackathonService.getHackathonRegistrations(hackathonId);
      
      // Group registrations by teams and individuals
      const teamRegistrations = registrations.filter(r => r.registration_type === 'team');
      const individualRegistrations = registrations.filter(r => r.registration_type === 'individual');
      
      // For team registrations, we want to show unique teams, not individual team members
      const uniqueTeams = teamRegistrations.reduce((acc: any[], reg) => {
        if (reg.team && !acc.find(t => t.team?.id === reg.team.id)) {
          acc.push(reg);
        }
        return acc;
      }, []);
      
      setSelectedHackathonRegistrations([...uniqueTeams, ...individualRegistrations]);
      setShowRegistrationsModal(true);
    } catch (error) {
      console.error('Error loading registrations:', error);
      showError('Failed to load registrations', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHackathonSubmissions = async (hackathonId: string) => {
    try {
      setIsLoading(true);
      const submissions = await SubmissionService.getHackathonSubmissions(hackathonId);
      setSelectedHackathonSubmissions(submissions);
      setShowSubmissionsModal(true);
    } catch (error) {
      console.error('Error loading submissions:', error);
      showError('Failed to load submissions', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlacementUpdate = async (submissionId: string, placement: number) => {
    try {
      await SubmissionService.updateSubmissionPlacement(submissionId, placement);
      
      // Update local state
      setSelectedHackathonSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, placement }
            : sub
        )
      );
      
      showSuccess('Placement updated!', `Submission has been ranked #${placement}.`);
    } catch (error) {
      console.error('Error updating placement:', error);
      showError('Failed to update placement', 'Please try again.');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Hackathon name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.end_date) newErrors.end_date = 'End date is required';
    if (!formData.registration_deadline) newErrors.registration_deadline = 'Registration deadline is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.image_url.trim()) newErrors.image_url = 'Banner image URL is required';
    if (formData.max_participants < 1) newErrors.max_participants = 'Must allow at least 1 participant';
    if (formData.max_team_size < 1) newErrors.max_team_size = 'Team size must be at least 1';

    // Date validations
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const regDeadline = new Date(formData.registration_deadline);
    const today = new Date();

    if (regDeadline <= today) {
      newErrors.registration_deadline = 'Registration deadline must be in the future';
    }
    if (startDate <= regDeadline) {
      newErrors.start_date = 'Start date must be after registration deadline';
    }
    if (endDate <= startDate) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const hackathonData = {
        ...formData,
        organizer_id: user!.id,
        status: 'upcoming' as const
      };

      if (editingHackathon) {
        await HackathonService.updateHackathon(editingHackathon.id, hackathonData);
        showSuccess('Hackathon updated!', 'Your hackathon has been updated successfully.');
      } else {
        await HackathonService.createHackathon(hackathonData);
        showSuccess('Hackathon created!', 'Your hackathon has been created and is now live.');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        registration_deadline: '',
        location: '',
        image_url: '',
        max_participants: 1000,
        max_team_size: 4,
        prize_pool: '',
        tags: []
      });
      setEditingHackathon(null);
      setShowForm(false);
      setActiveTab('manage');
      loadMyHackathons();
    } catch (error: any) {
      console.error('Error saving hackathon:', error);
      showError('Failed to save hackathon', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (hackathon: any) => {
    setFormData({
      name: hackathon.name,
      description: hackathon.description,
      start_date: hackathon.start_date,
      end_date: hackathon.end_date,
      registration_deadline: hackathon.registration_deadline,
      location: hackathon.location,
      image_url: hackathon.image_url,
      max_participants: hackathon.max_participants,
      max_team_size: hackathon.max_team_size,
      prize_pool: hackathon.prize_pool || '',
      tags: hackathon.hackathon_tag_relations?.map((rel: any) => rel.hackathon_tags.name) || []
    });
    setEditingHackathon(hackathon);
    setShowForm(true);
    setActiveTab('create');
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 dark:text-white">
          Organizer Panel
        </h1>
        <p className="text-navy-600 dark:text-navy-300 mt-2">
          Create and manage your hackathons
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-navy-200 dark:border-navy-800 mb-8">
        <nav className="flex space-x-8">
          {['create', 'manage'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'create') {
                  setShowForm(true);
                  setEditingHackathon(null);
                  setFormData({
                    name: '',
                    description: '',
                    start_date: '',
                    end_date: '',
                    registration_deadline: '',
                    location: '',
                    image_url: '',
                    max_participants: 1000,
                    max_team_size: 4,
                    prize_pool: '',
                    tags: []
                  });
                } else {
                  setShowForm(false);
                }
              }}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-electric-blue-500 text-electric-blue-600 dark:text-electric-blue-400' 
                  : 'border-transparent text-navy-500 hover:text-navy-700 dark:text-navy-400 dark:hover:text-navy-300'
              }`}
            >
              {tab === 'create' ? 'Create Hackathon' : 'Manage Hackathons'}
            </button>
          ))}
        </nav>
      </div>

      {/* Create Tab */}
      {activeTab === 'create' && showForm && (
        <div className="card-elevated p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white">
              {editingHackathon ? 'Edit Hackathon' : 'Create New Hackathon'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingHackathon(null);
                setActiveTab('manage');
              }}
              className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="form-label">Hackathon Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter hackathon name"
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>

              <div className="lg:col-span-2">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`input w-full resize-none ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Describe your hackathon, its goals, and what participants can expect..."
                />
                {errors.description && <p className="form-error">{errors.description}</p>}
              </div>

              <div>
                <label className="form-label">Location *</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`input pl-10 w-full ${errors.location ? 'border-red-500' : ''}`}
                    placeholder="Virtual, San Francisco, etc."
                  />
                </div>
                {errors.location && <p className="form-error">{errors.location}</p>}
              </div>

              <div>
                <label className="form-label">Prize Pool</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                  <input
                    type="text"
                    name="prize_pool"
                    value={formData.prize_pool}
                    onChange={handleInputChange}
                    className="input pl-10 w-full"
                    placeholder="$10,000 in prizes"
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="form-label">Registration Deadline *</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                  <input
                    type="date"
                    name="registration_deadline"
                    value={formData.registration_deadline}
                    onChange={handleInputChange}
                    className={`input pl-10 w-full ${errors.registration_deadline ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.registration_deadline && <p className="form-error">{errors.registration_deadline}</p>}
              </div>

              <div>
                <label className="form-label">Start Date *</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={`input pl-10 w-full ${errors.start_date ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.start_date && <p className="form-error">{errors.start_date}</p>}
              </div>

              <div>
                <label className="form-label">End Date *</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`input pl-10 w-full ${errors.end_date ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.end_date && <p className="form-error">{errors.end_date}</p>}
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Max Participants *</label>
                <div className="relative">
                  <Users size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                  <input
                    type="number"
                    name="max_participants"
                    value={formData.max_participants}
                    onChange={handleInputChange}
                    min="1"
                    className={`input pl-10 w-full ${errors.max_participants ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.max_participants && <p className="form-error">{errors.max_participants}</p>}
              </div>

              <div>
                <label className="form-label">Max Team Size *</label>
                <div className="relative">
                  <Users size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                  <input
                    type="number"
                    name="max_team_size"
                    value={formData.max_team_size}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    className={`input pl-10 w-full ${errors.max_team_size ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.max_team_size && <p className="form-error">{errors.max_team_size}</p>}
              </div>
            </div>

            {/* Banner Image */}
            <div>
              <label className="form-label">Banner Image URL *</label>
              <div className="relative">
                <ImageIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className={`input pl-10 w-full ${errors.image_url ? 'border-red-500' : ''}`}
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
              {errors.image_url && <p className="form-error">{errors.image_url}</p>}
              {formData.image_url && (
                <div className="mt-3">
                  <img
                    src={formData.image_url}
                    alt="Banner preview"
                    className="w-full h-32 object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="form-label">Tags</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="input flex-1"
                  placeholder="Add a tag (e.g., AI, Climate, FinTech)"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="btn btn-secondary"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-electric-blue-100 dark:bg-electric-blue-900/30 text-electric-blue-800 dark:text-electric-blue-300 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t border-navy-200 dark:border-navy-800">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingHackathon(null);
                  setActiveTab('manage');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="spinner mr-2"></div>
                    {editingHackathon ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <>
                    <Save size={18} />
                    {editingHackathon ? 'Update Hackathon' : 'Create Hackathon'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="animate-fade-in">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-navy-600 dark:text-navy-300">Loading your hackathons...</p>
            </div>
          ) : myHackathons.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center mx-auto mb-4">
                <Trophy size={24} className="text-navy-400 dark:text-navy-500" />
              </div>
              <h3 className="text-xl font-medium text-navy-900 dark:text-white mb-2">No hackathons yet</h3>
              <p className="text-navy-600 dark:text-navy-300 mb-6">
                Create your first hackathon to get started
              </p>
              <button
                onClick={() => {
                  setActiveTab('create');
                  setShowForm(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={18} />
                Create Hackathon
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                  Your Hackathons ({myHackathons.length})
                </h2>
                <button
                  onClick={() => {
                    setActiveTab('create');
                    setShowForm(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus size={18} />
                  Create New
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myHackathons.map((hackathon) => (
                  <div key={hackathon.id} className="card-elevated overflow-hidden">
                    <div className="h-48 overflow-hidden">
                      <img
                        src={hackathon.image_url}
                        alt={hackathon.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-navy-900 dark:text-white text-lg">
                            {hackathon.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              hackathon.status === 'upcoming' 
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                : hackathon.status === 'active'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                            }`}>
                              {hackathon.status}
                            </span>
                            <span className="text-sm text-navy-500 dark:text-navy-400">
                              {hackathon.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-electric-blue-600 dark:text-electric-blue-400">
                            {registrationCounts[hackathon.id] || 0}
                          </div>
                          <div className="text-xs text-navy-500 dark:text-navy-400">
                            registered
                          </div>
                        </div>
                      </div>

                      <p className="text-navy-600 dark:text-navy-300 text-sm mb-4 line-clamp-2">
                        {hackathon.description}
                      </p>

                      <div className="space-y-2 text-sm text-navy-500 dark:text-navy-400 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{hackathon.start_date} to {hackathon.end_date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={14} />
                          <span>Max {hackathon.max_participants} participants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>Registration until {hackathon.registration_deadline}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Upload size={14} />
                          <span>{submissionCounts[hackathon.id] || 0} submissions</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => window.open(`/hackathons/${hackathon.id}`, '_blank')}
                          className="btn btn-secondary text-sm py-2"
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button
                          onClick={() => loadHackathonRegistrations(hackathon.id)}
                          className="btn btn-primary text-sm py-2"
                        >
                          <Users size={16} />
                          Teams
                        </button>
                        <button
                          onClick={() => loadHackathonSubmissions(hackathon.id)}
                          className="btn btn-primary text-sm py-2"
                        >
                          <Upload size={16} />
                          Submissions
                        </button>
                        <button
                          onClick={() => handleEdit(hackathon)}
                          className="btn btn-secondary text-sm py-2"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRegistrationsModal(false)}></div>
          
          <div className="relative w-full max-w-4xl card-elevated animate-scale-in max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-800">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                Registered Teams & Participants ({selectedHackathonRegistrations.length})
              </h2>
              <button
                onClick={() => setShowRegistrationsModal(false)}
                className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-96 p-6">
              {selectedHackathonRegistrations.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-navy-400 dark:text-navy-500 mb-4" />
                  <h3 className="text-lg font-medium text-navy-900 dark:text-white mb-2">No registrations yet</h3>
                  <p className="text-navy-600 dark:text-navy-300">
                    Participants will appear here once they register for your hackathon.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedHackathonRegistrations.map((registration) => (
                    <div key={registration.id} className="card p-4">
                      {registration.team ? (
                        // Team Registration
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <img
                              src={registration.team.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(registration.team.name)}&background=6366f1&color=fff`}
                              alt={registration.team.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <h3 className="font-bold text-navy-900 dark:text-white">
                                {registration.team.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-electric-blue-600 dark:text-electric-blue-400 font-medium">
                                  Team Registration
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  registration.status === 'approved' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : registration.status === 'pending'
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                }`}>
                                  {registration.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Team Members */}
                          <div className="ml-15">
                            <h4 className="font-medium text-navy-700 dark:text-navy-300 mb-2">
                              Team Members ({registration.team.team_members?.length || 0}):
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {registration.team.team_members?.map((member: any, index: number) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-navy-50 dark:bg-navy-800 rounded-xl">
                                  <img
                                    src={member.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.name || 'User')}&background=6366f1&color=fff`}
                                    alt={member.user?.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-navy-900 dark:text-white">
                                        {member.user?.name}
                                      </span>
                                      {member.user?.verified && (
                                        <UserCheck size={14} className="text-electric-blue-500" />
                                      )}
                                    </div>
                                    <div className="text-sm text-navy-600 dark:text-navy-300">
                                      @{member.user?.username}#{member.user?.hashtag}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Individual Registration
                        <div className="flex items-start gap-4">
                          <img
                            src={registration.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(registration.user?.name || 'User')}&background=6366f1&color=fff`}
                            alt={registration.user?.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-navy-900 dark:text-white">
                                {registration.user?.name}
                              </h3>
                              {registration.user?.verified && (
                                <UserCheck size={16} className="text-electric-blue-500" />
                              )}
                              <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                Individual
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                registration.status === 'approved' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : registration.status === 'pending'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              }`}>
                                {registration.status}
                              </span>
                            </div>
                            
                            <div className="text-sm text-navy-600 dark:text-navy-300 mb-2">
                              @{registration.user?.username}#{registration.user?.hashtag}
                            </div>
                            
                            {registration.user?.bio && (
                              <p className="text-sm text-navy-600 dark:text-navy-300 mb-3">
                                {registration.user.bio}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm">
                              {registration.user?.location && (
                                <span className="text-navy-500 dark:text-navy-400">
                                  📍 {registration.user.location}
                                </span>
                              )}
                              {registration.user?.ranking && (
                                <span className="text-navy-500 dark:text-navy-400 flex items-center gap-1">
                                  <Star size={12} />
                                  {registration.user.ranking} MMR
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {registration.user?.github_url && (
                              <a
                                href={`https://${registration.user.github_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
                              >
                                <Github size={16} />
                              </a>
                            )}
                            {registration.user?.linkedin_url && (
                              <a
                                href={`https://${registration.user.linkedin_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
                              >
                                <Linkedin size={16} />
                              </a>
                            )}
                            {registration.user?.website_url && (
                              <a
                                href={registration.user.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
                              >
                                <Globe size={16} />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSubmissionsModal(false)}></div>
          
          <div className="relative w-full max-w-6xl card-elevated animate-scale-in max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-navy-200 dark:border-navy-800">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">
                Project Submissions ({selectedHackathonSubmissions.length})
              </h2>
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="p-2 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-96 p-6">
              {selectedHackathonSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <Upload size={48} className="mx-auto text-navy-400 dark:text-navy-500 mb-4" />
                  <h3 className="text-lg font-medium text-navy-900 dark:text-white mb-2">No submissions yet</h3>
                  <p className="text-navy-600 dark:text-navy-300">
                    Project submissions will appear here once participants submit their work.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedHackathonSubmissions.map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      showPlacement={true}
                      onPlacementUpdate={handlePlacementUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerPanel;