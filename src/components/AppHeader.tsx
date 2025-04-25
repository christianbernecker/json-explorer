import React from 'react';

interface AppHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode?: () => void;
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
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex flex-col lg:flex-row items-start justify-between">
        <div className="flex items-center mb-4 lg:mb-0">
          <div className="mr-5 bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-xl text-white flex items-center justify-center" style={{ width: '50px', height: '50px', minWidth: '50px' }} aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="JSON Explorer">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>
              JSON Explorer
            </h1>
            <div className="flex items-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Visualize and analyze JSON data easily and efficiently
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center space-x-4">
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
              <span>History ({vastExplorerHistoryLength})</span>
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
              <span>History ({diffInspectorHistoryLength})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppHeader; 