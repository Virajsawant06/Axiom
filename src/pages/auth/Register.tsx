import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, User, Mail, Lock, ChevronRight, ChevronLeft, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import { UserRole } from '../../contexts/AuthContext';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'developer' as UserRole,
    skills: [] as string[],
    location: '',
    bio: '',
    github: '',
    linkedin: '',
    website: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Validation functions
  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    
    if (formData.skills.length === 0) {
      errors.skills = 'Please select at least one skill';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSkillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      skills: checked 
        ? [...prev.skills, value] 
        : prev.skills.filter(skill => skill !== value)
    }));
    
    // Clear skills validation error
    if (validationErrors.skills) {
      setValidationErrors(prev => ({ ...prev, skills: '' }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
      return;
    }
    
    if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
      return;
    }
    
    // Step 3 - Final submission
    setIsLoading(true);
    
    try {
      console.log('Submitting registration with data:', formData);
      
      await register({
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        github: formData.github.trim(),
        linkedin: formData.linkedin.trim(),
        website: formData.website.trim(),
        skills: formData.skills
      }, formData.password);
      
      console.log('Registration successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.message?.includes('duplicate key value violates unique constraint')) {
        if (err.message.includes('username')) {
          setError('This username is already taken. Please choose a different one.');
        } else if (err.message.includes('email')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setError('This information is already in use. Please try different values.');
        }
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password format.');
      } else if (err.message?.includes('Password should be at least 6 characters')) {
        setError('Password must be at least 6 characters long.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      setValidationErrors({});
    }
  };
  
  // Common skills for selection
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 
    'Node.js', 'Python', 'Java', 'C#', 'Go', 'Rust',
    'UI/UX Design', 'Product Management', 'DevOps',
    'Machine Learning', 'Data Science', 'Cloud Computing',
    'Mobile Development', 'Blockchain', 'Game Development'
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-navy-50 to-electric-blue-50 dark:from-navy-950 dark:via-navy-900 dark:to-navy-800">
      <div className="p-6">
        <Link to="/" className="inline-flex items-center text-navy-600 dark:text-navy-400 hover:text-electric-blue-600 dark:hover:text-electric-blue-400 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-8 card-elevated p-8 animate-scale-in">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white h-16 w-16 rounded-3xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-electric-blue-500/25">
                <Sparkles size={28} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-navy-900 dark:text-white">
              Join Axiom
            </h2>
            <p className="mt-3 text-navy-600 dark:text-navy-400">
              Create your developer profile
            </p>
            
            {/* Progress Indicator */}
            <div className="flex justify-center mt-8">
              <div className="flex items-center">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div 
                      className={`rounded-full h-10 w-10 flex items-center justify-center font-semibold transition-all duration-300 ${
                        s === step 
                          ? 'bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white shadow-lg shadow-electric-blue-500/25' 
                          : s < step 
                            ? 'bg-emerald-500 text-white' 
                            : 'glass dark:glass-dark text-navy-700 dark:text-navy-300'
                      }`}
                    >
                      {s < step ? <CheckCircle size={20} /> : s}
                    </div>
                    {s < 3 && (
                      <div 
                        className={`w-12 h-1 rounded-full transition-all duration-300 ${
                          s < step ? 'bg-emerald-500' : 'bg-navy-200 dark:bg-navy-700'
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-2xl text-sm flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User size={18} className="text-navy-400 dark:text-navy-500" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`input pl-12 w-full ${validationErrors.name ? 'border-red-500' : ''}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="form-error">
                      <AlertCircle size={14} />
                      {validationErrors.name}
                    </p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-navy-400 dark:text-navy-500 font-medium">@</span>
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className={`input pl-12 w-full ${validationErrors.username ? 'border-red-500' : ''}`}
                      placeholder="Choose a username"
                    />
                  </div>
                  {validationErrors.username && (
                    <p className="form-error">
                      <AlertCircle size={14} />
                      {validationErrors.username}
                    </p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-navy-400 dark:text-navy-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`input pl-12 w-full ${validationErrors.email ? 'border-red-500' : ''}`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="form-error">
                      <AlertCircle size={14} />
                      {validationErrors.email}
                    </p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-navy-400 dark:text-navy-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`input pl-12 w-full ${validationErrors.password ? 'border-red-500' : ''}`}
                      placeholder="Create a password"
                    />
                  </div>
                  {validationErrors.password && (
                    <p className="form-error">
                      <AlertCircle size={14} />
                      {validationErrors.password}
                    </p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input w-full ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Confirm your password"
                  />
                  {validationErrors.confirmPassword && (
                    <p className="form-error">
                      <AlertCircle size={14} />
                      {validationErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 2: Role & Skills */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    I am joining as a *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="input w-full"
                    required
                  >
                    <option value="developer">Developer/Student</option>
                    <option value="organizer">Hackathon Organizer</option>
                    <option value="company">Company/Recruiter</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label mb-3">
                    Select your skills (choose at least one) *
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 glass dark:glass-dark rounded-2xl">
                    {commonSkills.map(skill => (
                      <div key={skill} className="flex items-center">
                        <input
                          id={`skill-${skill}`}
                          name="skills"
                          type="checkbox"
                          value={skill}
                          checked={formData.skills.includes(skill)}
                          onChange={handleSkillChange}
                          className="h-4 w-4 text-electric-blue-600 focus:ring-electric-blue-500 border-navy-300 rounded"
                        />
                        <label htmlFor={`skill-${skill}`} className="ml-3 block text-sm text-navy-700 dark:text-navy-300 font-medium">
                          {skill}
                        </label>
                      </div>
                    ))}
                  </div>
                  {validationErrors.skills && (
                    <p className="form-error">
                      <AlertCircle size={14} />
                      {validationErrors.skills}
                    </p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="location" className="form-label">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="City, Country"
                  />
                </div>
              </div>
            )}
            
            {/* Step 3: Profile Details */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="form-group">
                  <label htmlFor="bio" className="form-label">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="input w-full resize-none"
                    placeholder="Tell us a bit about yourself..."
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="github" className="form-label">
                    GitHub Profile (optional)
                  </label>
                  <input
                    id="github"
                    name="github"
                    type="text"
                    value={formData.github}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="github.com/username"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="linkedin" className="form-label">
                    LinkedIn Profile (optional)
                  </label>
                  <input
                    id="linkedin"
                    name="linkedin"
                    type="text"
                    value={formData.linkedin}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="linkedin.com/in/username"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="website" className="form-label">
                    Personal Website (optional)
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    value={formData.website}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
              )}
              
              <button
                type="submit"
                className={`btn btn-primary ${step === 1 ? 'ml-auto' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-3"></div>
                    Creating Account...
                  </div>
                ) : step < 3 ? (
                  <span className="flex items-center">
                    Next
                    <ChevronRight size={18} className="ml-2" />
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-navy-600 dark:text-navy-400">
              Already have an account?{' '}
              <Link to="/login" className="text-electric-blue-600 dark:text-electric-blue-400 hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;