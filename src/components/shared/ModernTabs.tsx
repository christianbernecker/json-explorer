import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface ModernTabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  isDarkMode: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
}

const ModernTabs: React.FC<ModernTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  isDarkMode,
  orientation = 'horizontal',
  size = 'medium'
}) => {
  const [activeTab, setActiveTab] = useState(activeTabId);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Styling basierend auf Props
  const containerClass = orientation === 'horizontal' 
    ? 'flex flex-row' 
    : 'flex flex-col';
  
  const tabClass = size === 'small' 
    ? 'py-2 px-3 text-sm' 
    : size === 'large' 
      ? 'py-3 px-6 text-lg' 
      : 'py-2.5 px-4 text-base';
  
  // Styling basierend auf isDarkMode
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const activeBgColor = isDarkMode ? 'bg-gray-700' : 'bg-blue-50';
  const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const activeTextColor = isDarkMode ? 'text-blue-300' : 'text-blue-600';
  const indicatorColor = isDarkMode ? 'bg-blue-500' : 'bg-blue-500';
  const hoverBgColor = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  
  // Update active tab when prop changes
  useEffect(() => {
    setActiveTab(activeTabId);
  }, [activeTabId]);
  
  // Update indicator position when active tab changes
  useEffect(() => {
    const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (activeTabIndex >= 0 && tabRefs.current[activeTabIndex]) {
      const tabElement = tabRefs.current[activeTabIndex];
      if (tabElement) {
        if (orientation === 'horizontal') {
          setIndicatorStyle({
            left: tabElement.offsetLeft,
            width: tabElement.offsetWidth,
            height: '3px',
            bottom: '0px',
          });
        } else {
          setIndicatorStyle({
            top: tabElement.offsetTop,
            height: tabElement.offsetHeight,
            width: '3px',
            left: '0px',
          });
        }
      }
    }
  }, [activeTab, tabs, orientation]);
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange(tabId);
  };
  
  // Keydown handler for keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (orientation === 'horizontal') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = index > 0 ? index - 1 : tabs.length - 1;
        const prevTab = tabs[prevIndex];
        handleTabClick(prevTab.id);
        tabRefs.current[prevIndex]?.focus();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = index < tabs.length - 1 ? index + 1 : 0;
        const nextTab = tabs[nextIndex];
        handleTabClick(nextTab.id);
        tabRefs.current[nextIndex]?.focus();
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = index > 0 ? index - 1 : tabs.length - 1;
        const prevTab = tabs[prevIndex];
        handleTabClick(prevTab.id);
        tabRefs.current[prevIndex]?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = index < tabs.length - 1 ? index + 1 : 0;
        const nextTab = tabs[nextIndex];
        handleTabClick(nextTab.id);
        tabRefs.current[nextIndex]?.focus();
      }
    }
  };
  
  return (
    <div className={`modern-tabs ${bgColor} ${orientation === 'horizontal' ? 'border-b' : 'border-r'} ${borderColor} relative`}>
      <div className={`${containerClass} items-center`}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[index] = el)}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              ${tabClass}
              relative flex items-center justify-center gap-2 transition-all duration-200 ease-in-out
              ${tab.id === activeTab ? activeTextColor : textColor}
              ${tab.id === activeTab ? activeBgColor : ''}
              ${hoverBgColor}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
            `}
            aria-selected={tab.id === activeTab}
            role="tab"
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="font-medium">{tab.label}</span>
            
            {/* Active Tab Effect (subtle glow) */}
            {tab.id === activeTab && (
              <motion.span
                layoutId="tab-highlight"
                className="absolute inset-0 bg-current opacity-5 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.05 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        ))}
      </div>
      
      {/* Animated Indicator */}
      <motion.div
        className={`absolute ${indicatorColor}`}
        style={indicatorStyle}
        layout
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30
        }}
      />
    </div>
  );
};

export default ModernTabs; 