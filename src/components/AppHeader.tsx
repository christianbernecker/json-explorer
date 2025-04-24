import React from 'react';
import { Link } from 'react-router-dom';

interface AppHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activeTab: string;
  showVastExplorerHistory?: boolean;
  showDiffInspectorHistory?: boolean;
  vastExplorerHistoryLength?: number;
  diffInspectorHistoryLength?: number;
  setShowVastExplorerHistory?: (value: boolean | ((prev: boolean) => boolean)) => void;
  setShowDiffInspectorHistory?: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  isDarkMode, 
  toggleDarkMode, 
  activeTab, 
  showVastExplorerHistory, 
  showDiffInspectorHistory,
  vastExplorerHistoryLength = 0,
  diffInspectorHistoryLength = 0,
  setShowVastExplorerHistory,
  setShowDiffInspectorHistory
}) => {
  return (
    <div className={`flex flex-col lg:flex-row items-center justify-between py-6 px-4 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
      <div className="flex items-center mb-4 lg:mb-0">
        <div className="mr-5 bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-xl text-white flex items-center justify-center" style={{ width: '50px', height: '50px', minWidth: '50px' }} aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="AdTech Toolbox">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>
            AdTech Toolbox
          </h1>
          <div className="flex items-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Tools for Media & Ad Technology Professionals
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Application Icons */}
        <div className={`flex items-center space-x-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Link to="/json-explorer" className={`flex flex-col items-center ${activeTab === 'editor' ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') : ''} hover:text-blue-500`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="text-xs">JSON Explorer</span>
          </Link>
          
          <div className={`h-8 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
          
          <Link to="/json-diff" className={`flex flex-col items-center ${activeTab === 'comparator' ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') : ''} hover:text-blue-500`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-xs">JSON Diff</span>
          </Link>
          
          <div className={`h-8 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
          
          <Link to="/data-visualizer" className={`flex flex-col items-center ${activeTab === 'visualizer' ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') : ''} hover:text-blue-500`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">Data Visualizer</span>
          </Link>
        </div>
        
        {/* History button */}
        {activeTab === 'explorer' && setShowVastExplorerHistory && (
          <button 
            onClick={() => setShowVastExplorerHistory(prev => !prev)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              isDarkMode 
                ? (showVastExplorerHistory ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600')
                : (showVastExplorerHistory ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
            } transition`}
            title="Show/Hide History (Ctrl+Shift+H)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{vastExplorerHistoryLength}</span>
          </button>
        )}
        
        {activeTab === 'comparator' && setShowDiffInspectorHistory && (
          <button 
            onClick={() => setShowDiffInspectorHistory(prev => !prev)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              isDarkMode 
                ? (showDiffInspectorHistory ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600')
                : (showDiffInspectorHistory ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
            } transition`}
            title="Show/Hide History (Ctrl+Shift+H)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{diffInspectorHistoryLength}</span>
          </button>
        )}
        
        {/* Dark mode toggle */}
        <button 
          onClick={toggleDarkMode}
          className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition flex items-center`}
          title="Toggle Dark Mode (Ctrl+Shift+D)"
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
      </div>
    </div>
  );
};

export default AppHeader; 