import React, { useState, useEffect } from 'react';
import { 
  HistoryItem as HistoryItemType, 
  TabNavigationProps,
  JsonToolsAppProps
} from '../types';
import JsonVastExplorer from './JsonVastExplorer';
import JsonDiffInspector from './JsonDiffInspector';
import { SEO, StructuredData } from './seo';
import ApplicationHeader from './ApplicationHeader';

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
function JsonToolsApp({ parentIsDarkMode, toggleDarkMode }: JsonToolsAppProps) {
  const [activeTab, setActiveTab] = useState('explorer');
  
  // Interne isDarkMode State wird direkt von parentIsDarkMode abgeleitet
  // Kein eigener lokaler DarkMode State oder localStorage mehr hier, das wird global in App.tsx gehandhabt
  const isDarkMode = parentIsDarkMode;
  
  // Keyboard shortcut handler verwendet jetzt die toggleDarkMode Prop von App.tsx
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'd': 
            e.preventDefault();
            if (toggleDarkMode) toggleDarkMode(); // toggleDarkMode von App.tsx aufrufen
            break;
          case 'h': 
            e.preventDefault();
            if (activeTab === 'explorer') {
              setShowVastExplorerHistory((prev: boolean) => !prev);
            } else if (activeTab === 'comparator') {
              setShowDiffInspectorHistory((prev: boolean) => !prev);
            }
            break;
          case '1':
            e.preventDefault();
            setActiveTab('explorer');
            break;
          case '2':
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
  // toggleDarkMode als Abhängigkeit hinzugefügt
  }, [activeTab, toggleDarkMode]);

  // History-States bleiben gleich
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

  useEffect(() => {
    localStorage.setItem('jsonTools_vastExplorerHistory', JSON.stringify(vastExplorerHistory));
  }, [vastExplorerHistory]);
  
  useEffect(() => {
    localStorage.setItem('jsonTools_diffInspectorHistory', JSON.stringify(diffInspectorHistory));
  }, [diffInspectorHistory]);

  const activeHistory = activeTab === 'explorer' ? vastExplorerHistory : diffInspectorHistory;
  const activeShowHistory = activeTab === 'explorer' ? showVastExplorerHistory : showDiffInspectorHistory;
  const activeSetShowHistory = activeTab === 'explorer' ? setShowVastExplorerHistory : setShowDiffInspectorHistory;

  // Der äußere Container bekommt keinen eigenen Hintergrund oder Textfarbe mehr,
  // da dies vom übergeordneten Layout in App.tsx und den Body-Styles gesteuert wird.
  return (
    <div className="w-full h-full flex flex-col">
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
        isDarkMode={isDarkMode} // isDarkMode von parentIsDarkMode
      />
      
      {/* ApplicationHeader mit toggleDarkMode von App.tsx */}
      <ApplicationHeader 
        isDarkMode={isDarkMode} // isDarkMode von parentIsDarkMode
        toggleDarkMode={toggleDarkMode} // toggleDarkMode von App.tsx
        activeTab={activeTab}
        showHistory={activeShowHistory}
        setShowHistory={activeSetShowHistory}
        historyLength={activeHistory.length}
        // Title und Subtitle könnten hier spezifisch gesetzt werden, wenn nötig
        // title="JSON Tools"
        // subtitle="Validate, Compare, and Explore"
      />
      
      <TabNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDarkMode={isDarkMode} // isDarkMode von parentIsDarkMode
      />
      
      <div className="flex-grow mt-6 min-h-0"> {/* min-h-0 für korrekte Scrollbarkeit innerhalb des flex-grow Bereichs */}
        {activeTab === 'explorer' ? (
          <JsonVastExplorer 
            isDarkMode={isDarkMode} // isDarkMode von parentIsDarkMode
            history={vastExplorerHistory}
            setHistory={setVastExplorerHistory}
            showHistory={showVastExplorerHistory}
            setShowHistory={setShowVastExplorerHistory}
          />
        ) : (
          <JsonDiffInspector 
            isDarkMode={isDarkMode} // isDarkMode von parentIsDarkMode
            history={diffInspectorHistory}
            setHistory={setDiffInspectorHistory}
            showHistory={showDiffInspectorHistory}
            setShowHistory={setShowDiffInspectorHistory}
          />
        )}
      </div>
    </div>
  );
}

export default JsonToolsApp; 