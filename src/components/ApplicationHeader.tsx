import React, { useState } from 'react';
import GlobalHeader from './GlobalHeader';
import InfoPanel from './InfoPanel';

interface ApplicationHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode?: () => void;
  showHistory?: boolean;
  setShowHistory?: (value: boolean | ((prev: boolean) => boolean)) => void;
  historyLength?: number;
  title?: string;
  subtitle?: string;
  activeTab?: string;
}

const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({ 
  isDarkMode, 
  toggleDarkMode, 
  showHistory, 
  setShowHistory, 
  historyLength = 0,
  title = "JSON Explorer",
  subtitle = "Visualize and analyze JSON data",
  activeTab
}) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <GlobalHeader 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        historyLength={historyLength}
        activeTab={activeTab}
      />
      
      <div className="h-20"></div>
      
      <InfoPanel 
        isVisible={showInfo} 
        onClose={() => setShowInfo(false)} 
        isDarkMode={isDarkMode} 
      />
    </>
  );
};

export default ApplicationHeader; 