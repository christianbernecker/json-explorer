import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import InfoPanel from './InfoPanel';

interface GlobalHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode?: () => void;
  showHistory?: boolean;
  setShowHistory?: (value: boolean | ((prev: boolean) => boolean)) => void;
  historyLength?: number;
  activeTab?: string;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ 
  isDarkMode, 
  toggleDarkMode, 
  showHistory, 
  setShowHistory,
  historyLength = 0,
  activeTab 
}) => {
  const location = useLocation();
  const isJSONExplorer = location.pathname.includes('/apps/json-explorer');
  const isDataVisualizer = location.pathname.includes('/apps/data-visualizer');
  const isTCFDecoder = activeTab === 'tcf-decoder' || location.pathname.includes('/apps/tcf-decoder');
  const [showInfo, setShowInfo] = useState(false);

  // App-specific icons and text
  const getAppIcon = () => {
    if (isTCFDecoder) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
        </svg>
      );
    } else if (isJSONExplorer) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (isDataVisualizer) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M3 6.25A2.25 2.25 0 015.25 4h13.5A2.25 2.25 0 0121 6.25v3.5A2.25 2.25 0 0118.75 12H5.25A2.25 2.25 0 013 9.75v-3.5zM5.25 7.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zM3 15.25A2.25 2.25 0 015.25 13h13.5A2.25 2.25 0 0121 15.25v3.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75v-3.5zM5.25 16.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" />
        </svg>
      );
    }
  };

  const getAppTitle = () => {
    if (isTCFDecoder) {
      return "TCF Decoder";
    } else if (isJSONExplorer) {
      return "JSON Toolkit";
    } else if (isDataVisualizer) {
      return "Data Visualizer";
    } else {
      return "AdTech Toolbox";
    }
  };

  const getAppSubtitle = () => {
    if (isTCFDecoder) {
      return "Decode and analyze IAB TCF consent strings";
    } else if (isJSONExplorer) {
      return "Validate, Compare & Explore VAST/JSON";
    } else if (isDataVisualizer) {
      return "Visualize and analyze data with AI support";
    } else {
      return "Tools for AdTech professionals";
    }
  };

  return (
    <>
      <header className={`w-full fixed top-0 left-0 right-0 z-30 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-md`}>
        <div className="relative">
          {/* Top header strip - gradient highlight for branding */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          
          {/* Main header content - Angepasst für links-ausgerichtete Inhalte */}
          <div className="ml-28 py-3 px-10 max-w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* App-specific content - Das Toolbox Logo entfernen, da wir das bereits in der Sidebar haben */}
                <div className="flex items-center">
                  <div className="h-8 w-8 relative mr-3">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 rounded-md"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      {getAppIcon()}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">
                      <span className={`bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600`}>
                        {getAppTitle()}
                      </span>
                    </h1>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {getAppSubtitle()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {toggleDarkMode && (
                  <button 
                    onClick={toggleDarkMode}
                    className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
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
                
                {setShowHistory && (
                  <button 
                    onClick={() => setShowHistory(prev => !prev)}
                    className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors ${showHistory ? 'ring-2 ring-blue-500' : ''}`}
                    aria-label="View History"
                    title="View History"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {historyLength > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {historyLength}
                      </span>
                    )}
                  </button>
                )}
                
                <button 
                  onClick={() => setShowInfo(true)}
                  className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                  aria-label="Information"
                  title="Information"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Tab navigation for JSON Explorer - Angepasst für links-ausgerichtete Inhalte */}
          {isJSONExplorer && (
            <div className={`ml-28 px-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex border-b border-gray-300">
                <Link 
                  to="/apps/json-explorer/validator"
                  className={`py-3 px-4 flex items-center space-x-2 border-b-2 ${location.pathname.includes('/validator') ? `border-blue-500 ${isDarkMode ? 'text-white' : 'text-blue-600'}` : `border-transparent ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'}`} transition-colors`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>JSON Validator & VAST Explorer</span>
                </Link>
                
                <Link 
                  to="/apps/json-explorer/diff"
                  className={`py-3 px-4 flex items-center space-x-2 border-b-2 ${location.pathname.includes('/diff') ? `border-blue-500 ${isDarkMode ? 'text-white' : 'text-blue-600'}` : `border-transparent ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'}`} transition-colors`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>JSON Diff Comparison Tool</span>
                </Link>
              </div>
            </div>
          )}
          
          {/* Tab navigation for TCF Decoder could be added here if needed */}
        </div>
      </header>

      {/* Standard space holder - ensures content doesn't hide behind fixed header */}
      <div className="h-20"></div>

      {/* Info-Panel */}
      <InfoPanel 
        isVisible={showInfo} 
        onClose={() => setShowInfo(false)} 
        isDarkMode={isDarkMode} 
      />
    </>
  );
};

export default GlobalHeader; 