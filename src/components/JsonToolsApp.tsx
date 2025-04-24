import React, { useState, useEffect, useCallback } from 'react';
import { 
  HistoryItem as HistoryItemType, 
  TabNavigationProps
} from '../types';
import JsonVastExplorer from './JsonVastExplorer';
import JsonDiffInspector from './JsonDiffInspector';
import { SEO, StructuredData } from './seo';
import AppHeader from './AppHeader';

// App Tab Navigation
const TabNavigation = ({ activeTab, setActiveTab, isDarkMode }: TabNavigationProps) => {
  return (
    <nav className={`flex border-b mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} aria-label="JSON Tools Navigation">
      <button
        className={`py-3 px-6 focus:outline-none ${
          activeTab === 'explorer'
            ? isDarkMode 
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium' 
              : 'border-b-2 border-blue-600 text-blue-600 font-medium'
            : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
        } transition-colors duration-200`}
        onClick={() => setActiveTab('explorer')}
        aria-pressed={activeTab === 'explorer'}
        aria-label="JSON Validator and VAST AdTag Explorer"
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>JSON Validator &amp; VAST Explorer</span>
        </div>
      </button>
      <button
        className={`py-3 px-6 focus:outline-none ${
          activeTab === 'comparator'
            ? isDarkMode 
              ? 'border-b-2 border-blue-500 text-blue-500 font-medium' 
              : 'border-b-2 border-blue-600 text-blue-600 font-medium'
            : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
        } transition-colors duration-200`}
        onClick={() => setActiveTab('comparator')}
        aria-pressed={activeTab === 'comparator'}
        aria-label="JSON Comparison Tool"
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>JSON Diff Comparison Tool</span>
        </div>
      </button>
    </nav>
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
    <div className={`container mx-auto px-4 py-8 mb-20 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'} transition-colors duration-75`}>
      <SEO 
        title="JSON Validator, Formatter & Diff Tool | Online JSON and VAST Analyzer"
        description="Free tools for comparing, validating, and analyzing JSON files and VAST AdTags. Easy to use with no installation required."
        additionalMetaTags={[
          { name: 'keywords', content: 'JSON validator, JSON formatter, JSON comparison, VAST validator, AdTech tools' },
          { name: 'author', content: 'Christian Bernecker' }
        ]}
        canonical="https://www.adtech-toolbox.com/apps/json-explorer"
      />
      <StructuredData 
        appVersion="v1.1.4" 
        isDarkMode={isDarkMode}
      />
      <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <AppHeader 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        activeTab={activeTab}
        showVastExplorerHistory={showVastExplorerHistory}
        showDiffInspectorHistory={showDiffInspectorHistory}
        vastExplorerHistoryLength={vastExplorerHistory.length}
        diffInspectorHistoryLength={diffInspectorHistory.length}
        setShowVastExplorerHistory={setShowVastExplorerHistory}
        setShowDiffInspectorHistory={setShowDiffInspectorHistory}
      />
      
      {/* Tab Navigation */}
      <TabNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDarkMode={isDarkMode} 
      />
      
      {/* Tool description for SEO */}
      <section className={`mb-6 p-4 rounded-lg text-sm ${
        isDarkMode ? 'bg-gray-800 bg-opacity-50 border border-gray-700' : 'bg-gray-50 bg-opacity-80 border border-gray-200'
      }`}>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {activeTab === 'explorer' 
            ? "JSON Validator and VAST Explorer allows you to validate, format, and explore JSON data or VAST XML AdTags. Paste your content, upload a file, or fetch from a URL." 
            : "JSON Diff Comparison Tool helps you compare two JSON structures side by side, highlighting differences. Perfect for debugging API changes or config files."
          }
        </p>
      </section>
      
      {/* Active Tool */}
      {activeTab === 'explorer' ? (
        <JsonVastExplorer 
          isDarkMode={isDarkMode} 
          setHistory={setVastExplorerHistory}
          history={vastExplorerHistory}
          showHistory={showVastExplorerHistory}
          setShowHistory={setShowVastExplorerHistory}
        />
      ) : (
        <JsonDiffInspector 
          isDarkMode={isDarkMode} 
          setHistory={setDiffInspectorHistory}
          history={diffInspectorHistory}
          showHistory={showDiffInspectorHistory}
          setShowHistory={setShowDiffInspectorHistory}
        />
      )}
      </div>
    </div>
  );
}

export default JsonToolsApp; 