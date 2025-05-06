import React, { useState } from 'react';
import InfoPanel from './InfoPanel';
import GlobalHeader from './GlobalHeader';

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

  return (
    <>
      <GlobalHeader 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
      />
      
      <div className="h-36"></div>
      
      <div className={`mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="hidden">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>
          </div>

          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            {setShowHistory && typeof historyLength !== 'undefined' && (
              <button
                onClick={() => setShowHistory(prev => !prev)}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  showHistory 
                    ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                    : isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Toggle History (Ctrl+Shift+H)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-2">History ({historyLength})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <InfoPanel 
        isVisible={showInfo} 
        onClose={() => setShowInfo(false)} 
        isDarkMode={isDarkMode} 
      />
    </>
  );
};

export default ApplicationHeader; 