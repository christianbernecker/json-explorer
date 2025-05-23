import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabSystemProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isDarkMode: boolean;
  className?: string;
  variant?: 'default' | 'underline' | 'pill';
  size?: 'sm' | 'md' | 'lg';
}

const TabSystem: React.FC<TabSystemProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isDarkMode,
  className = '',
  variant = 'default',
  size = 'md',
}) => {
  // Farbschemata basierend auf Dark Mode
  const textInactive = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const textActive = isDarkMode ? 'text-white' : 'text-gray-900';
  const bgActive = isDarkMode ? 'bg-blue-700' : 'bg-blue-500';
  const bgInactive = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  
  // Größenvarianten
  const sizeStyles = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-2 px-4',
  };
  
  // Stilvariation
  const getTabStyles = (isActive: boolean, isDisabled: boolean) => {
    const baseStyles = `font-medium transition-all duration-200 focus:outline-none ${sizeStyles[size]}`;
    const disabledStyles = 'opacity-50 cursor-not-allowed';
    
    if (isDisabled) {
      return `${baseStyles} ${textInactive} ${disabledStyles}`;
    }
    
    switch (variant) {
      case 'underline':
        return `${baseStyles} ${isActive 
          ? `${textActive} border-b-2 border-blue-500` 
          : `${textInactive} border-b-2 border-transparent ${hoverBg}`}`;
      
      case 'pill':
        return `${baseStyles} rounded-full ${isActive 
          ? `${bgActive} text-white` 
          : `${textInactive} hover:bg-opacity-10 ${hoverBg}`}`;
      
      default: // 'default'
        return `${baseStyles} rounded-t-lg ${isActive 
          ? `${bgActive} text-white` 
          : `${bgInactive} ${textInactive}`}`;
    }
  };
  
  // Container Style basierend auf Variante
  const getContainerStyles = () => {
    switch (variant) {
      case 'underline':
        return `flex space-x-2 border-b ${borderColor}`;
      default:
        return 'flex space-x-1';
    }
  };

  return (
    <div className={`${getContainerStyles()} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          className={getTabStyles(activeTab === tab.id, !!tab.disabled)}
          disabled={tab.disabled}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          <div className="flex items-center">
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </div>
        </button>
      ))}
    </div>
  );
};

export default TabSystem; 