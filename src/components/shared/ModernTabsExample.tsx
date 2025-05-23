import React, { useState } from 'react';
import ModernTabs, { TabItem } from './ModernTabs';

// Icons Komponenten
const JsonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
  </svg>
);

const VastIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
  </svg>
);

const DiffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

interface ModernTabsExampleProps {
  isDarkMode: boolean;
}

const ModernTabsExample: React.FC<ModernTabsExampleProps> = ({ isDarkMode }) => {
  // Tab Definitionen
  const tabs: TabItem[] = [
    { id: 'json', label: 'JSON Explorer', icon: <JsonIcon /> },
    { id: 'vast', label: 'VAST Explorer', icon: <VastIcon /> },
    { id: 'diff', label: 'JSON Diff', icon: <DiffIcon /> },
    { id: 'history', label: 'Verlauf', icon: <HistoryIcon /> },
  ];
  
  // State für den aktiven Tab
  const [activeTab, setActiveTab] = useState('json');
  
  // Handler für Tab-Wechsel
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  // Render-Funktion für den Inhalt basierend auf aktivem Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'json':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">JSON Explorer</h2>
            <p>Hier kommt der JSON Explorer-Inhalt</p>
          </div>
        );
      case 'vast':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">VAST Explorer</h2>
            <p>Hier kommt der VAST Explorer-Inhalt</p>
          </div>
        );
      case 'diff':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">JSON Diff</h2>
            <p>Hier kommt der JSON Diff-Inhalt</p>
          </div>
        );
      case 'history':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">Verlauf</h2>
            <p>Hier kommt der Verlauf-Inhalt</p>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className={`modern-tabs-example rounded-lg overflow-hidden shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}>
      <div className="tab-header">
        <ModernTabs
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={handleTabChange}
          isDarkMode={isDarkMode}
          size="large"
        />
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
      
      <div className="p-4 bg-opacity-50 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium">Eigenschaften der neuen Tab-Komponente:</h3>
        <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
          <li>Moderne Animationen mit Framer Motion</li>
          <li>Responsive Design</li>
          <li>Tastaturnavigation (mit Pfeiltasten)</li>
          <li>Anpassbare Größen und Orientierungen</li>
          <li>Icons mit Labels für bessere UX</li>
        </ul>
      </div>
    </div>
  );
};

export default ModernTabsExample; 