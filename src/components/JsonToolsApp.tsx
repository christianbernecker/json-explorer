import React, { useState, useEffect, useCallback } from 'react';
import { 
  HistoryItem as HistoryItemType, 
  TabNavigationProps
} from '../types';
import JsonVastExplorer from './JsonVastExplorer';
import JsonDiffInspector from './JsonDiffInspector';
import { Footer } from './shared';

// App Tab Navigation
const TabNavigation = ({ activeTab, setActiveTab, isDarkMode }: TabNavigationProps) => {
  return (
    <div className={`flex border-b mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <button
        className={`py-3 px-6 focus:outline-none ${
          activeTab === 'explorer'
            ? isDarkMode 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'border-b-2 border-blue-600 text-blue-600'
            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
        onClick={() => setActiveTab('explorer')}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          JSON VAST Explorer
        </div>
      </button>
      <button
        className={`py-3 px-6 focus:outline-none ${
          activeTab === 'comparator'
            ? isDarkMode 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'border-b-2 border-blue-600 text-blue-600'
            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
        onClick={() => setActiveTab('comparator')}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          JSON Diff Inspector
        </div>
      </button>
    </div>
  );
};

// Main Application Component
interface JsonToolsAppProps {
  parentIsDarkMode?: boolean;
  setParentIsDarkMode?: React.Dispatch<React.SetStateAction<boolean>>;
}

function JsonToolsApp({ parentIsDarkMode, setParentIsDarkMode }: JsonToolsAppProps) {
  // Shared state between tools
  const [activeTab, setActiveTab] = useState('explorer');
  
  // Refactor dark mode state management to avoid flickering
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Use parent dark mode state if available, otherwise use local storage
    if (parentIsDarkMode !== undefined) {
      return parentIsDarkMode;
    }
    const savedDarkMode = localStorage.getItem('jsonTools_darkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });
  
  // Create a memoized toggle function to reduce renders
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Synchronize with parent if available
    if (setParentIsDarkMode) {
      setParentIsDarkMode(newDarkMode);
    }
    
    // Save to localStorage
    localStorage.setItem('jsonTools_darkMode', JSON.stringify(newDarkMode));
  }, [isDarkMode, setParentIsDarkMode]);
  
  // Sync with parent changes (one-way from parent to local)
  useEffect(() => {
    if (parentIsDarkMode !== undefined && parentIsDarkMode !== isDarkMode) {
      setIsDarkMode(parentIsDarkMode);
      localStorage.setItem('jsonTools_darkMode', JSON.stringify(parentIsDarkMode));
    }
  }, [parentIsDarkMode, isDarkMode]);
  
  // Split histories for both tools
  const [vastExplorerHistory, setVastExplorerHistory] = useState<HistoryItemType[]>(() => {
    const savedHistory = localStorage.getItem('jsonTools_vastExplorerHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  
  const [diffInspectorHistory, setDiffInspectorHistory] = useState<HistoryItemType[]>(() => {
    const savedHistory = localStorage.getItem('jsonTools_diffInspectorHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  
  const [showVastExplorerHistory, setShowVastExplorerHistory] = useState(false);
  const [showDiffInspectorHistory, setShowDiffInspectorHistory] = useState(false);

  // Save vast explorer history to localStorage
  useEffect(() => {
    localStorage.setItem('jsonTools_vastExplorerHistory', JSON.stringify(vastExplorerHistory));
  }, [vastExplorerHistory]);
  
  // Save diff inspector history to localStorage
  useEffect(() => {
    localStorage.setItem('jsonTools_diffInspectorHistory', JSON.stringify(diffInspectorHistory));
  }, [diffInspectorHistory]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl (or Cmd) + Shift + Key combination
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'd': // Toggle Dark Mode
            e.preventDefault();
            toggleDarkMode();
            break;
          case 'h': // Show/hide history for active tab
            e.preventDefault();
            if (activeTab === 'explorer') {
              setShowVastExplorerHistory((prev: boolean) => !prev);
            } else if (activeTab === 'comparator') {
              setShowDiffInspectorHistory((prev: boolean) => !prev);
            }
            break;
          case '1': // Switch to Explorer tab
            e.preventDefault();
            setActiveTab('explorer');
            break;
          case '2': // Switch to Comparator tab
            e.preventDefault();
            setActiveTab('comparator');
            break;
          default:
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, toggleDarkMode]);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'} transition-colors duration-75`}>
      <div className="flex-grow p-6 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>JSON Tools</h1>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Explorer & Diff Inspector</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Show History button based on active tab */}
          {activeTab === 'explorer' && (
            <button 
              onClick={() => setShowVastExplorerHistory((prev: boolean) => !prev)}
              className={`flex items-center px-4 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition`}
              title="Show/Hide History (Ctrl+Shift+H)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showVastExplorerHistory ? 'Hide' : 'Show'} History ({vastExplorerHistory.length})
            </button>
          )}
          
          {activeTab === 'comparator' && (
            <button 
              onClick={() => setShowDiffInspectorHistory((prev: boolean) => !prev)}
              className={`flex items-center px-4 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition`}
              title="Show/Hide History (Ctrl+Shift+H)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showDiffInspectorHistory ? 'Hide' : 'Show'} History ({diffInspectorHistory.length})
            </button>
          )}
          
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition flex items-center ml-auto`}
            title="Toggle Dark Mode (Ctrl+Shift+D)"
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
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <TabNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDarkMode={isDarkMode} 
      />
      
      {/* Keyboard Shortcuts Help */}
      <div className={`mb-4 p-3 rounded-lg text-sm ${
        isDarkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-blue-50 text-blue-800 border border-blue-100'
      }`}>
        <strong>Keyboard Shortcuts: </strong> 
        {activeTab === 'explorer' ? (
          <span>
            Ctrl+Shift+F (Format), 
            Ctrl+Shift+L (Clear), 
            Ctrl+Shift+H (History), 
            Ctrl+Shift+D (Dark Mode), 
            Ctrl+Shift+1/2 (Switch Tabs)
          </span>
        ) : (
          <span>
            Ctrl+Shift+C (Compare), 
            Ctrl+Shift+L (Clear), 
            Ctrl+Shift+H (History), 
            Ctrl+Shift+D (Dark Mode), 
            Ctrl+Shift+1/2 (Switch Tabs)
          </span>
        )}
      </div>
      
      {/* Active Tool Content */}
      {activeTab === 'explorer' ? (
        <JsonVastExplorer 
          isDarkMode={isDarkMode} 
          history={vastExplorerHistory}
          setHistory={setVastExplorerHistory}
          showHistory={showVastExplorerHistory}
          setShowHistory={setShowVastExplorerHistory}
        />
      ) : (
        <JsonDiffInspector 
          isDarkMode={isDarkMode}
          history={diffInspectorHistory}
          setHistory={setDiffInspectorHistory}
          showHistory={showDiffInspectorHistory}
          setShowHistory={setShowDiffInspectorHistory}
        />
      )}
      </div>
      
      {/* Footer */}
      <Footer isDarkMode={isDarkMode} />
    </div>
  );
}

export default JsonToolsApp; 