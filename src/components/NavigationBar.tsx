import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface NavigationBarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ isDarkMode, toggleDarkMode }) => {
  // Enhanced styling for a more modern look and better dark mode contrast
  const linkStyle = isDarkMode 
    ? "text-gray-100 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
    : "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
  
  // State to toggle between icons
  const [altIconVisible, setAltIconVisible] = useState(false);
  
  // Toggle icon when clicking on the logo
  const toggleIcon = () => {
    setAltIconVisible(prev => !prev);
  };

  return (
    <nav className={`sticky top-0 z-50 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} shadow-md mb-4 relative`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 pt-2">
          {/* Logo/Brand - Using icon instead of text */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center" onClick={toggleIcon}>
              <div className="h-12 w-12 mr-3 relative">
                {/* Diamond shape with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg transform rotate-45 shadow-lg"></div>
                {/* Layered effect */}
                <div className="absolute inset-1 bg-gradient-to-tr from-blue-400 to-indigo-600 rounded-lg transform rotate-45"></div>
                
                {/* Alternate between two icons */}
                {!altIconVisible ? (
                  // Default icon - Server/Document icon
                  <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                      <path d="M3 6.25A2.25 2.25 0 015.25 4h13.5A2.25 2.25 0 0121 6.25v3.5A2.25 2.25 0 0118.75 12H5.25A2.25 2.25 0 013 9.75v-3.5zM5.25 7.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM3 15.25A2.25 2.25 0 015.25 13h13.5A2.25 2.25 0 0121 15.25v3.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75v-3.5zM5.25 16.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" />
                    </svg>
                  </div>
                ) : (
                  // Alternative icon - Code/Brackets icon
                  <div className="absolute inset-0 flex items-center justify-center transform -rotate-45">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                      <path fillRule="evenodd" d="M14.447 3.027a.75.75 0 01.527.92l-4.5 16.5a.75.75 0 01-1.448-.394l4.5-16.5a.75.75 0 01.921-.526zM16.72 6.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 010-1.06zm-9.44 0a.75.75 0 010 1.06L2.56 12l4.72 4.72a.75.75 0 11-1.06 1.06L.97 12.53a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-300 dark:to-indigo-200">
                AdTech Toolbox
              </span>
            </Link>
          </div>
          
          {/* Main Navigation Links - Direct App Links */}
          <div className="hidden md:block">
            <div className="ml-16 flex items-center space-x-4">
              <Link 
                to="/apps/json-explorer" 
                className={`${linkStyle} ${isDarkMode ? 'border-b-2 border-transparent hover:border-blue-400' : 'border-b-2 border-transparent hover:border-blue-500'}`}
              >
                JSON Explorer
              </Link>
              <Link 
                to="/apps/data-visualizer" 
                className={`${linkStyle} ${isDarkMode ? 'border-b-2 border-transparent hover:border-blue-400' : 'border-b-2 border-transparent hover:border-blue-500'}`}
              >
                Data Visualizer
              </Link>
              
              {/* Dark Mode Toggle Button */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 ml-4 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors duration-200`}
                aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                title="Toggle Dark/Light Mode"
              >
                {isDarkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu and Dark Mode Toggle for mobile */}
          <div className="md:hidden flex items-center">
            {/* Dark Mode Toggle - Mobile */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 mr-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-100' 
                  : 'bg-gray-100 text-gray-700'
              }`}
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {/* Mobile menu button */}
            <button className={`${isDarkMode ? 'text-gray-100 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
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