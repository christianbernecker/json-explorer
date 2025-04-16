import React from 'react';

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
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <div className="mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg text-white" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="JSON Validator Icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>
            JSON Validator & VAST AdTag Tools
          </h1>
          <div className="flex items-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Online JSON Formatter, Diff Tool and VAST AdTag Explorer
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Show History button based on active tab */}
        {activeTab === 'explorer' && setShowVastExplorerHistory && (
          <button 
            onClick={() => setShowVastExplorerHistory(prev => !prev)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } transition`}
            title="Show/Hide History (Ctrl+Shift+H)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="History Icon">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showVastExplorerHistory ? 'Hide' : 'Show'} History ({vastExplorerHistoryLength})
          </button>
        )}
        
        {activeTab === 'comparator' && setShowDiffInspectorHistory && (
          <button 
            onClick={() => setShowDiffInspectorHistory(prev => !prev)}
            className={`flex items-center px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } transition`}
            title="Show/Hide History (Ctrl+Shift+H)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="History Icon">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showDiffInspectorHistory ? 'Hide' : 'Show'} History ({diffInspectorHistoryLength})
          </button>
        )}
        
        <button 
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition flex items-center ml-auto`}
          title="Toggle Dark Mode (Ctrl+Shift+D)"
          aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default AppHeader; 