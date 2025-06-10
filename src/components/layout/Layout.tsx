import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useState } from 'react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-navy-50 to-electric-blue-50 dark:from-navy-950 dark:via-navy-900 dark:to-navy-800 text-navy-900 dark:text-white">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <TopBar toggleSidebar={toggleSidebar} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default Layout;