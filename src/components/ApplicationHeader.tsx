import React, { useState } from 'react';
import InfoPanel from './InfoPanel';

interface ApplicationHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activeTab: string;
  showHistory: boolean;
  setShowHistory: (value: boolean | ((prev: boolean) => boolean)) => void;
  historyLength: number;
}

const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({ 
  isDarkMode, 
  toggleDarkMode, 
  activeTab, 
  showHistory, 
  setShowHistory, 
  historyLength 
}) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <header className={`flex justify-between items-center p-4 mb-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-sm`}>
        {/* Left Side - Logo and Title */}
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg text-white flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold">JSON Explorer</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Visualize and analyze JSON data</p>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Toggle Dark Mode (Ctrl+Shift+D)"
          >
            {isDarkMode ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Light</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span>Dark</span>
              </>
            )}
          </button>

          {/* History Toggle */}
          <button
            onClick={() => setShowHistory(prev => !prev)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              showHistory
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Toggle History (Ctrl+Shift+H)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>History ({historyLength})</span>
          </button>

          {/* Info Button */}
          <button
            onClick={() => setShowInfo(true)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Information about the tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Info</span>
          </button>
        </div>
      </header>

      {/* Info Panel */}
      <InfoPanel 
        isVisible={showInfo} 
        onClose={() => setShowInfo(false)} 
        isDarkMode={isDarkMode} 
      />
    </>
  );
};

export default ApplicationHeader; 