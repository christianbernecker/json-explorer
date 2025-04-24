import React from 'react';
import { Link } from 'react-router-dom';

const NavigationBar: React.FC = () => {
  // Enhanced styling for a more modern look
  const linkStyle = "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md mb-4 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand - Using icon instead of text */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="h-12 w-12 mr-3 relative">
                {/* Diamond shape with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg transform rotate-45 shadow-lg"></div>
                {/* Layered effect */}
                <div className="absolute inset-1 bg-gradient-to-tr from-blue-400 to-indigo-600 rounded-lg transform rotate-45"></div>
                {/* Icon in center */}
                <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                    <path d="M3 6.25A2.25 2.25 0 015.25 4h13.5A2.25 2.25 0 0121 6.25v3.5A2.25 2.25 0 0118.75 12H5.25A2.25 2.25 0 013 9.75v-3.5zM5.25 7.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM3 15.25A2.25 2.25 0 015.25 13h13.5A2.25 2.25 0 0121 15.25v3.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75v-3.5zM5.25 16.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
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
      
      {/* Thin gradient line at bottom of header */}
      <div className="h-0.25 bg-gradient-to-r from-blue-500 to-indigo-600 w-full absolute bottom-0"></div>
    </nav>
  );
};

export default NavigationBar; 