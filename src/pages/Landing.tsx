import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Code, Users, Trophy, ArrowRight, Github, Linkedin, Moon, Sun, Sparkles, Zap, Star } from 'lucide-react';
import { useEffect } from 'react';


const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-navy-50 to-electric-blue-50 dark:from-navy-950 dark:via-navy-900 dark:to-navy-800">
      {/* Floating Bolt Badge */}
      <a 
        href="https://bolt.new" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed top-6 right-6 z-50 transition-transform hover:scale-110 hover-glow"
      >
        <img 
          src={theme === 'dark' ? '/white_circle_360x360.png' : '/black_circle_360x360.png'} 
          alt="Made with Bolt" 
          className="h-16 w-16 rounded-2xl shadow-lg"
        />
      </a>

      <header className="py-6 px-6 md:px-10 flex justify-between items-center glass dark:glass-dark border-b border-white/20 dark:border-navy-800/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-electric-blue-500/25">
            <img
              src='/logo.png'
              alt="Axiom Logo"
              className="h-full w-full object-contain p-1" // Adjust styling and padding as needed
            />
          </div>
          <div>
            <span className="text-2xl font-bold gradient-text">Axiom</span>
            <p className="text-xs text-navy-500 dark:text-navy-400 font-medium">Social Dev Platform</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-2xl text-navy-500 dark:text-navy-400 hover:bg-white/10 dark:hover:bg-navy-800/50 transition-all duration-300 hover:scale-110"
          >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <Link to="/login" className="btn btn-secondary">
            Sign In
          </Link>
          
          <Link to="/register" className="btn btn-primary">
            Join Axiom
          </Link>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-6 md:px-10 max-w-7xl mx-auto">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass dark:glass-dark mb-8">
              <Zap size={16} className="text-electric-blue-500" />
              <span className="text-sm font-semibold text-navy-700 dark:text-navy-300">
                The Future of Developer Collaboration
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-navy-900 dark:text-white mb-8 leading-tight">
              Where <span className="gradient-text">developers</span><br />
              build winning teams
            </h1>
            
            <p className="text-xl md:text-2xl text-navy-600 dark:text-navy-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              Axiom is a social platform where developers connect, form teams, 
              and compete in hackathons to build amazing projects together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-4 hover-lift">
                <Sparkles size={20} />
                Create Your Profile
              </Link>
              <Link to="/hackathons" className="btn btn-secondary text-lg px-8 py-4 hover-lift">
                Browse Hackathons
                <ArrowRight size={20} />
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="animate-slide-up">
              <p className="text-sm text-navy-500 dark:text-navy-400 mb-6 font-medium">Trusted by developers from</p>
              <div className="flex flex-wrap gap-8 items-center justify-center opacity-60 dark:opacity-40">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/512px-Microsoft_logo_%282012%29.svg.png" 
                  alt="Microsoft" className="h-8 dark:brightness-200 hover:opacity-100 transition-opacity" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/512px-Google_2015_logo.svg.png" 
                  alt="Google" className="h-8 dark:brightness-200 hover:opacity-100 transition-opacity" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/505px-Apple_logo_black.svg.png" 
                  alt="Apple" className="h-8 dark:brightness-200 hover:opacity-100 transition-opacity" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/512px-IBM_logo.svg.png" 
                  alt="IBM" className="h-8 dark:brightness-200 hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 px-6 md:px-10 glass dark:glass-dark">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold text-navy-900 dark:text-white mb-6">
                How Axiom Works
              </h2>
              <p className="text-xl text-navy-600 dark:text-navy-300 max-w-2xl mx-auto">
                Three simple steps to join the most innovative developer community
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card-elevated p-8 text-center hover-lift animate-slide-up">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 flex items-center justify-center mb-6 mx-auto shadow-lg shadow-electric-blue-500/25">
                  <Code size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-navy-900 dark:text-white">Create Your Profile</h3>
                <p className="text-navy-600 dark:text-navy-300 leading-relaxed">
                  Showcase your skills, projects, and hackathon history to connect with like-minded developers.
                </p>
              </div>
              
              <div className="card-elevated p-8 text-center hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 flex items-center justify-center mb-6 mx-auto shadow-lg shadow-electric-blue-500/25">
                  <Users size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-navy-900 dark:text-white">Form Your Dream Team</h3>
                <p className="text-navy-600 dark:text-navy-300 leading-relaxed">
                  Our smart matching algorithm helps you find the perfect teammates based on skills and experience.
                </p>
              </div>
              
              <div className="card-elevated p-8 text-center hover-lift animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 flex items-center justify-center mb-6 mx-auto shadow-lg shadow-electric-blue-500/25">
                  <Trophy size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-navy-900 dark:text-white">Compete & Win</h3>
                <p className="text-navy-600 dark:text-navy-300 leading-relaxed">
                  Join hackathons, build amazing projects, and climb the global developer rankings.
                </p>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-4 hover-lift">
                <span>Get Started</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 md:py-32 px-6 md:px-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-electric-blue-500 to-electric-blue-600"></div>
          <div className="absolute inset-0 bg-dots"></div>

          
          <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-8">
              <Star size={16} />
              <span className="text-sm font-semibold">Join 10,000+ Developers</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Ready to join your next<br />winning hackathon team?
            </h2>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed">
              Axiom connects you with talented developers, designers, and innovators 
              to build amazing projects together and climb the global rankings.
            </p>
            
            <Link to="/register" className="btn bg-white text-electric-blue-600 hover:bg-white/90 text-lg px-8 py-4 hover-lift shadow-2xl">
              Create Your Developer Profile
            </Link>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="glass dark:glass-dark border-t border-white/20 dark:border-navy-800/50 py-12 px-6 md:px-10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 text-white h-10 w-10 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg shadow-electric-blue-500/25">
                  <Sparkles size={20} />
                </div>
                <span className="text-xl font-bold gradient-text">Axiom</span>
              </div>
              <p className="text-navy-600 dark:text-navy-300 text-sm leading-relaxed mb-6">
                The social platform for developers to connect, form teams, and win hackathons together.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-navy-500 dark:text-navy-400 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">
                  <Github size={20} />
                </a>
                <a href="#" className="text-navy-500 dark:text-navy-400 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-navy-900 dark:text-white mb-4">Platform</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Hackathons</a></li>
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Teams</a></li>
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Projects</a></li>
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Rankings</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-navy-900 dark:text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">API</a></li>
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Community</a></li>
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-navy-900 dark:text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">About</a></li>
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Blog</a></li>
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Careers</a></li>
                <li><a href="#" className="text-navy-600 dark:text-navy-300 hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 dark:border-navy-800/50 text-sm text-navy-500 dark:text-navy-400 flex flex-col md:flex-row justify-between items-center">
            <p>© 2025 Axiom. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-electric-blue-500 dark:hover:text-electric-blue-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
  
};

export default Landing;