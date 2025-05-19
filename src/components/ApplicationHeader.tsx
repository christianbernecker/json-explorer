import React, { useState } from 'react';
import GlobalHeader from './GlobalHeader';
import InfoPanel from './InfoPanel';

interface ApplicationHeaderProps {
  isDarkMode: boolean;
  toggleDarkMode?: () => void;
  title?: string;
  subtitle?: string;
  activeTab?: string;
}

const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({ 
  isDarkMode, 
  toggleDarkMode, 
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