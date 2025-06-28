import { useState, useEffect } from 'react';
import { useAuth, supabase } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserService } from '../services/userService';
import { 
  User, 
  Mail, 
  Lock, 
  Github, 
  Linkedin, 
  Globe, 
  MapPin, 
  FileText, 
  Save, 
  Trash2, 
  AlertTriangle,
  Plus,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [allSkills, setAllSkills] = useState<any[]>([]);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    github_url: '',
    linkedin_url: '',
    website_url: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        github_url: user.github || '',
        linkedin_url: user.linkedin || '',
        website_url: user.website || ''
      });
      loadSkills();
      loadUserSkills();
    }
  }, [user]);

  const loadSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name');

      if (error) throw error;
      setAllSkills(data || []);
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  };

  const loadUserSkills = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select(`
          id,
          proficiency_level,
          skill:skills(id, name, category)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setUserSkills(data || []);
    } catch (error) {
      console.error('Error loading user skills:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          username: profileData.username,
          bio: profileData.bio,
          location: profileData.location,
          github_url: profileData.github_url,
          linkedin_url: profileData.linkedin_url,
          website_url: profileData.website_url
        })
        .eq('id', user.id);

      if (error) throw error;

      showSuccess('Profile updated!', 'Your profile has been updated successfully.');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.message?.includes('duplicate key')) {
        showError('Username taken', 'This username is already in use. Please choose a different one.');
      } else {
        showError('Update failed', 'Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: profileData.email
      });

      if (error) throw error;

      showSuccess('Email update initiated!', 'Please check your new email for confirmation.');
    } catch (error: any) {
      console.error('Error updating email:', error);
      showError('Email update failed', error.message || 'Failed to update email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Passwords do not match', 'Please ensure both password fields match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showError('Password too short', 'Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      showSuccess('Password updated!', 'Your password has been updated successfully.');
    } catch (error: any) {
      console.error('Error updating password:', error);
      showError('Password update failed', error.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim() || !user) return;

    try {
      // Check if skill exists
      let { data: skill, error: skillError } = await supabase
        .from('skills')
        .select('id')
        .eq('name', newSkill.trim())
        .single();

      if (skillError && skillError.code === 'PGRST116') {
        // Create new skill
        const { data: newSkillData, error: createError } = await supabase
          .from('skills')
          .insert({ name: newSkill.trim() })
          .select('id')
          .single();

        if (createError) throw createError;
        skill = newSkillData;
      } else if (skillError) {
        throw skillError;
      }

      // Add to user skills
      const { error: userSkillError } = await supabase
        .from('user_skills')
        .insert({
          user_id: user.id,
          skill_id: skill.id,
          proficiency_level: 3
        });

      if (userSkillError) {
        if (userSkillError.message?.includes('duplicate key')) {
          showError('Skill already added', 'You already have this skill in your profile.');
          return;
        }
        throw userSkillError;
      }

      setNewSkill('');
      loadUserSkills();
      showSuccess('Skill added!', 'The skill has been added to your profile.');
    } catch (error: any) {
      console.error('Error adding skill:', error);
      showError('Failed to add skill', 'Something went wrong. Please try again.');
    }
  };

  const removeSkill = async (userSkillId: string) => {
    try {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', userSkillId);

      if (error) throw error;

      loadUserSkills();
      showSuccess('Skill removed!', 'The skill has been removed from your profile.');
    } catch (error) {
      console.error('Error removing skill:', error);
      showError('Failed to remove skill', 'Something went wrong. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Delete user data (cascading deletes will handle related data)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteError) throw deleteError;

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        console.error('Auth deletion error:', authError);
        // Continue with logout even if auth deletion fails
      }

      showSuccess('Account deleted', 'Your account has been permanently deleted.');
      logout();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      showError('Deletion failed', 'Failed to delete account. Please contact support.');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'account', label: 'Account', icon: <Mail size={18} /> },
    { id: 'security', label: 'Security', icon: <Lock size={18} /> },
    { id: 'skills', label: 'Skills', icon: <FileText size={18} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 dark:text-white">Settings</h1>
        <p className="text-navy-600 dark:text-navy-300 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white shadow-lg shadow-electric-blue-500/25'
                    : 'text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card-elevated p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">
                  Profile Information
                </h2>
                
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Full Name</label>
                      <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className="input pl-10 w-full"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Username</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500 font-medium">@</span>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                          className="input pl-8 w-full"
                          placeholder="Enter username"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      className="input w-full resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label className="form-label">Location</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                        className="input pl-10 w-full"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="form-label">GitHub Profile</label>
                      <div className="relative">
                        <Github size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                        <input
                          type="text"
                          value={profileData.github_url}
                          onChange={(e) => setProfileData(prev => ({ ...prev, github_url: e.target.value }))}
                          className="input pl-10 w-full"
                          placeholder="github.com/username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">LinkedIn Profile</label>
                      <div className="relative">
                        <Linkedin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                        <input
                          type="text"
                          value={profileData.linkedin_url}
                          onChange={(e) => setProfileData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                          className="input pl-10 w-full"
                          placeholder="linkedin.com/in/username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Website</label>
                      <div className="relative">
                        <Globe size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                        <input
                          type="url"
                          value={profileData.website_url}
                          onChange={(e) => setProfileData(prev => ({ ...prev, website_url: e.target.value }))}
                          className="input pl-10 w-full"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="spinner mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">
                  Account Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="form-label">Email Address</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          className="input pl-10 w-full"
                          placeholder="Enter your email"
                        />
                      </div>
                      <button
                        onClick={handleEmailUpdate}
                        disabled={isLoading || profileData.email === user?.email}
                        className="btn btn-secondary"
                      >
                        Update Email
                      </button>
                    </div>
                    <p className="text-sm text-navy-500 dark:text-navy-400 mt-2">
                      You'll receive a confirmation email to verify the new address.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-navy-200 dark:border-navy-800">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                      Danger Zone
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-red-600 dark:text-red-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-800 dark:text-red-300">Delete Account</h4>
                          <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">
                  Security Settings
                </h2>

                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div>
                    <label className="form-label">Current Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="input pl-10 pr-10 w-full"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">New Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="input pl-10 pr-10 w-full"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Confirm New Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 dark:text-navy-500" />
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="input pl-10 w-full"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="btn btn-primary"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="spinner mr-2"></div>
                          Updating...
                        </div>
                      ) : (
                        <>
                          <Save size={18} />
                          Update Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6">
                  Skills & Expertise
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="form-label">Add New Skill</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        className="input flex-1"
                        placeholder="Enter a skill (e.g., React, Python, UI/UX)"
                      />
                      <button
                        onClick={addSkill}
                        disabled={!newSkill.trim()}
                        className="btn btn-primary"
                      >
                        <Plus size={18} />
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">
                      Your Skills ({userSkills.length})
                    </h3>
                    
                    {userSkills.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText size={48} className="mx-auto text-navy-400 dark:text-navy-500 mb-4" />
                        <h4 className="text-lg font-medium text-navy-900 dark:text-white mb-2">No skills added yet</h4>
                        <p className="text-navy-600 dark:text-navy-300">
                          Add your skills to showcase your expertise to other developers.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {userSkills.map((userSkill) => (
                          <div
                            key={userSkill.id}
                            className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-800 rounded-xl"
                          >
                            <div>
                              <span className="font-medium text-navy-900 dark:text-white">
                                {userSkill.skill.name}
                              </span>
                              <div className="flex items-center mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full mr-1 ${
                                      i < userSkill.proficiency_level
                                        ? 'bg-electric-blue-500'
                                        : 'bg-navy-300 dark:bg-navy-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => removeSkill(userSkill.id)}
                              className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
          
          <div className="relative w-full max-w-md card-elevated animate-scale-in">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy-900 dark:text-white">Delete Account</h3>
                  <p className="text-navy-600 dark:text-navy-300 text-sm">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-navy-700 dark:text-navy-300 mb-6">
                Are you sure you want to permanently delete your account? All your data, including teams, projects, and messages will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;