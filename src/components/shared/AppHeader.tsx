import React, { ReactNode } from 'react';
import Button from './Button';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  isDarkMode: boolean;
  toggleDarkMode?: () => void;
  actions?: ReactNode;
  tabs?: {
    id: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }[];
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  isDarkMode,
  toggleDarkMode,
  actions,
  tabs = [],
}) => {
  // Farbschema basierend auf Dark Mode
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const subtitleColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const tabActiveBg = isDarkMode ? 'bg-blue-700' : 'bg-blue-500';
  const tabInactiveBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
  const tabInactiveText = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className={`${bgColor} ${textColor} p-4 shadow-sm rounded-t-lg border-b ${borderColor}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            {title}
          </h1>
          {subtitle && (
            <p className={`mt-1 ${subtitleColor}`}>{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {toggleDarkMode && (
            <Button
              onClick={toggleDarkMode}
              variant="secondary"
              isDarkMode={isDarkMode}
              size="sm"
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </Button>
          )}
          
          {actions}
        </div>
      </div>
      
      {tabs.length > 0 && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 -mb-4 -mx-4 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                tab.active 
                  ? `${tabActiveBg} text-white` 
                  : `${tabInactiveBg} ${tabInactiveText}`
              }`}
              onClick={tab.onClick}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppHeader; 