import React from 'react';
import { Link } from 'react-router-dom';

const NavigationBar: React.FC = () => {
  // Enhanced styling for a more modern look
  const linkStyle = "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md mb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                AdTech Toolbox
              </span>
            </Link>
          </div>
          
          {/* Main Navigation Links - Direct App Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                to="/apps/json-explorer" 
                className={`${linkStyle} border-b-2 border-transparent hover:border-blue-500`}
              >
                JSON Explorer
              </Link>
              <Link 
                to="/apps/data-visualizer" 
                className={`${linkStyle} border-b-2 border-transparent hover:border-blue-500`}
              >
                Data Visualizer
              </Link>
              {/* All Apps Link */}
              <Link 
                to="/apps" 
                className={`${linkStyle} border-b-2 border-transparent hover:border-blue-500`}
              >
                All Apps
              </Link>
            </div>
          </div>
          
          {/* Right side links - moved from footer */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              <Link 
                to="/legal/privacy" 
                className={`${linkStyle} text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`}
              >
                Privacy
              </Link>
              <Link 
                to="/legal/imprint" 
                className={`${linkStyle} text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`}
              >
                Imprint
              </Link>
            </div>
          </div>

          {/* Mobile menu button - can be implemented later if needed */}
          <div className="md:hidden">
            <button className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar; 