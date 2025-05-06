import React from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

interface GlobalHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode?: () => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ isDarkMode, toggleDarkMode }) => {
  const location = useLocation();
  const isJSONExplorer = location.pathname.includes('/apps/json-explorer');

  return (
    <header className={`w-full fixed top-0 left-0 right-0 z-30 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'} shadow-md`}>
      <div className="relative">
        {/* Top header strip - gradient highlight for branding */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        {/* Main header content */}
        <div className="container mx-auto py-3 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* AdTech Toolbox Logo und Brand */}
              <div className="flex items-center mr-6">
                <div className="h-10 w-10 relative mr-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                      <path d="M3 6.25A2.25 2.25 0 015.25 4h13.5A2.25 2.25 0 0121 6.25v3.5A2.25 2.25 0 0118.75 12H5.25A2.25 2.25 0 013 9.75v-3.5zM5.25 7.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM3 15.25A2.25 2.25 0 015.25 13h13.5A2.25 2.25 0 0121 15.25v3.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75v-3.5zM5.25 16.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold">
                    <span className={isDarkMode ? 'text-white' : 'text-slate-800'}>AdTech Toolbox</span>
                  </h1>
                </div>
              </div>
              <div className="h-8 border-l border-gray-300 dark:border-gray-600 mx-2"></div>
              <h1 className="text-xl font-bold">
                <span className={`bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600`}>
                  JSON Toolkit
                </span>
              </h1>
              <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Validate, Compare & Explore VAST/JSON
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {toggleDarkMode && (
                <button 
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'} transition-colors`}
                  aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
              )}
            </div>
          </div>
        </div>
        
        {/* Tab navigation */}
        {isJSONExplorer && (
          <div className={`px-6 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
            <div className="container mx-auto flex border-b border-gray-300">
              <Link 
                to="/apps/json-explorer/validator"
                className={`py-3 px-4 flex items-center space-x-2 border-b-2 ${location.pathname.includes('/validator') ? `border-blue-500 ${isDarkMode ? 'text-white' : 'text-blue-600'}` : `border-transparent ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-blue-600'}`} transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>JSON Validator & VAST Explorer</span>
              </Link>
              
              <Link 
                to="/apps/json-explorer/diff"
                className={`py-3 px-4 flex items-center space-x-2 border-b-2 ${location.pathname.includes('/diff') ? `border-blue-500 ${isDarkMode ? 'text-white' : 'text-blue-600'}` : `border-transparent ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-blue-600'}`} transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>JSON Diff Comparison Tool</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default GlobalHeader; 