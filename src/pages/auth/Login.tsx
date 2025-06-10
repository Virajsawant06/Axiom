import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const loginAsDemoUser = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login('demo@axiom.dev', 'demo123456');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Demo login error:', err);
      setError('Demo login temporarily unavailable. Please create an account or use your own credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
              Welcome back
            </h2>
            <p className="mt-3 text-navy-600 dark:text-navy-400">
              Sign in to your Axiom account
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-2xl text-sm flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-5">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email address
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-12 w-full"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <a href="#" className="text-sm text-electric-blue-600 dark:text-electric-blue-400 hover:underline font-medium">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-navy-400 dark:text-navy-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-12 w-full"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-navy-200 dark:border-navy-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-navy-900 text-navy-500 dark:text-navy-400 font-medium">Or</span>
              </div>
            </div>
            
            <div>
              <button
                type="button"
                onClick={loginAsDemoUser}
                className="btn btn-secondary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Try Demo Account
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-navy-600 dark:text-navy-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-electric-blue-600 dark:text-electric-blue-400 hover:underline font-semibold">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;