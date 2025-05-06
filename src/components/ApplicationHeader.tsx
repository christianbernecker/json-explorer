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
        showHistory={showHistory}
        setShowHistory={setShowHistory}
      />
      
      <div className="h-36"></div>
      
      <div className={`mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="hidden">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>
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