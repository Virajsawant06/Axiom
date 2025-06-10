import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-axiom-50 dark:from-axiom-950 dark:to-axiom-900 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="bg-axiom-500 text-white h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
          404
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to={isAuthenticated ? "/dashboard" : "/"} 
            className="btn btn-primary w-full sm:w-auto"
          >
            <Home size={18} className="mr-2" />
            {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="btn btn-secondary w-full sm:w-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;