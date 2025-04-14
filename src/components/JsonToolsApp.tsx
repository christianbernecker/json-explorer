import React, { useState, useEffect, useCallback } from 'react';
import { 
  HistoryItem as HistoryItemType, 
  TabNavigationProps
} from '../types';
import JsonVastExplorer from './JsonVastExplorer';
import JsonDiffInspector from './JsonDiffInspector';
import { Footer } from './shared';
import { SEO, StructuredData } from './seo';

// App Tab Navigation
const TabNavigation = ({ activeTab, setActiveTab, isDarkMode }: TabNavigationProps) => {
  return (
    <nav className={`flex border-b mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} aria-label="JSON Tools Navigation">
      <button
        className={`py-3 px-6 focus:outline-none ${
          activeTab === 'explorer'
            ? isDarkMode 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'border-b-2 border-blue-600 text-blue-600'
            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
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
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'border-b-2 border-blue-600 text-blue-600'
            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
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
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'} transition-colors duration-75`}>
      <SEO 
        title="JSON Validator, Formatter & Diff Tool | Online JSON and VAST Analyzer"
        description="Free tools for comparing, validating, and analyzing JSON files and VAST AdTags. Easy to use with no installation required."
        additionalMetaTags={[
          { name: 'keywords', content: 'JSON validator, JSON formatter, JSON comparison, VAST validator, AdTech tools' },
          { name: 'author', content: 'Christian Bernecker' }
        ]}
      />
      <StructuredData 
        appVersion="v1.1.2" 
        isDarkMode={isDarkMode}
      />
      <div className="flex-grow p-6 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg text-white" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="JSON Validator Icon">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>JSON Validator & VAST AdTag Tools</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Online JSON Formatter, Diff Tool and VAST AdTag Explorer
            </p>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="History Icon">
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="History Icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showDiffInspectorHistory ? 'Hide' : 'Show'} History ({diffInspectorHistory.length})
            </button>
          )}
          
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition flex items-center ml-auto`}
            title="Toggle Dark Mode (Ctrl+Shift+D)"
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
      
      {/* Tool description for SEO */}
      <section className={`mb-6 p-3 rounded-lg text-xs ${
        isDarkMode ? 'bg-gray-800 bg-opacity-30 border border-gray-700' : 'bg-gray-50 bg-opacity-70 border border-gray-200'
      }`}>
        <h2 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          JSON and VAST AdTag Tools
        </h2>
        <p className={`mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Validate, format, and compare JSON data or analyze VAST AdTags directly in your browser.
          Our free online tools provide comprehensive features for developers and AdTech specialists.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <div>
            <h3 className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>JSON Explorer Features:</h3>
            <ul className={`list-disc pl-4 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>Validate and format JSON syntax</li>
              <li>VAST AdTag Explorer with XML support</li>
              <li>Automatic error detection</li>
              <li>Syntax highlighting for better readability</li>
            </ul>
          </div>
          <div>
            <h3 className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>JSON Diff Features:</h3>
            <ul className={`list-disc pl-4 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>Compare JSON objects and highlight differences</li>
              <li>Multiple comparison modes (structural, semantic)</li>
              <li>Copy results with one click</li>
              <li>History for quick access to previous comparisons</li>
            </ul>
          </div>
        </div>
      </section>
      
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
          addToHistory={(item) => setVastExplorerHistory(prev => [item, ...prev].slice(0, 10))}
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