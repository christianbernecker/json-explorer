import React, { useState } from 'react';
import InfoPanel from './InfoPanel';

interface ApplicationHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activeTab?: string;
  showHistory?: boolean;
  setShowHistory?: (value: boolean | ((prev: boolean) => boolean)) => void;
  historyLength?: number;
  title?: string;
  subtitle?: string;
}

const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({ 
  isDarkMode, 
  toggleDarkMode, 
  showHistory, 
  setShowHistory, 
  historyLength,
  title = "JSON Explorer",
  subtitle = "Visualize and analyze JSON data"
}) => {
  const [showInfo, setShowInfo] = useState(false);

  const headerBgColor = isDarkMode ? 'bg-gray-700' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const buttonBgColor = isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200';
  const buttonActiveBgColor = isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white';

  return (
    <>
      <header className={`flex justify-between items-center p-4 ${headerBgColor} ${textColor} shadow-sm`}>
        {/* Left Side - Title and Subtitle (Logo entfernt) */}
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className={`text-sm ${subTextColor}`}>{subtitle}</p>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${buttonBgColor}`}
            title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode (Ctrl+Shift+D)`}
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
            <span className="ml-2 hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>

          {/* History Toggle (nur anzeigen, wenn setShowHistory und historyLength vorhanden) */}
          {setShowHistory && typeof historyLength !== 'undefined' && (
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                showHistory ? buttonActiveBgColor : buttonBgColor
              }`}
              title="Toggle History (Ctrl+Shift+H)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="ml-2 hidden sm:inline">History ({historyLength})</span>
            </button>
          )}

          {/* Info Button */}
          <button
            onClick={() => setShowInfo(true)}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${buttonBgColor}`}
            title="Information about the tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="ml-2 hidden sm:inline">Info</span>
          </button>
        </div>
      </header>

      <InfoPanel 
        isVisible={showInfo} 
        onClose={() => setShowInfo(false)} 
        isDarkMode={isDarkMode} 
      />
    </>
  );
};

export default ApplicationHeader; 