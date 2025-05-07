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