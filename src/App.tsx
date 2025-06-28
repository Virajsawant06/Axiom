import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Hackathons from './pages/Hackathons';
import HackathonDetails from './pages/HackathonDetails';
import Teams from './pages/Teams';
import TeamMatching from './pages/TeamMatching';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import MMRDebug from './pages/MMRDebug';
import OrganizerPanel from './pages/OrganizerPanel';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-axiom-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-axiom-600 border-t-axiom-400 rounded-full animate-spin"></div>
          <h1 className="text-2xl font-bold text-white">Loading Axiom...</h1>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={<Layout />}>
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile/:userId" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/hackathons" 
                  element={
                    <ProtectedRoute>
                      <Hackathons />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/hackathons/:hackathonId" 
                  element={
                    <ProtectedRoute>
                      <HackathonDetails />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/teams" 
                  element={
                    <ProtectedRoute>
                      <Teams />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/team-matching" 
                  element={
                    <ProtectedRoute>
                      <TeamMatching />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/messages" 
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/mmr-debug" 
                  element={
                    <ProtectedRoute>
                      <MMRDebug />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/organizer" 
                  element={
                    <ProtectedRoute requiredRole={['organizer']}>
                      <OrganizerPanel />
                    </ProtectedRoute>
                  } 
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;