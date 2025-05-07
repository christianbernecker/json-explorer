import React, { useState, useEffect } from 'react';
import { 
  HistoryItem as HistoryItemType, 
  JsonToolsAppProps
} from '../types';
import JsonVastExplorer from './JsonVastExplorer';
import JsonDiffInspector from './JsonDiffInspector';
import { SEO, StructuredData } from './seo';
import ApplicationHeader from './ApplicationHeader';
import { useLocation } from 'react-router-dom';

// Main Application Component
function JsonToolsApp({ parentIsDarkMode, toggleDarkMode }: JsonToolsAppProps) {
  const location = useLocation();
  // activeTab wird jetzt aus der URL abgeleitet
  const [activeTab, setActiveTab] = useState(() => {
    // Default ist 'explorer', aber wir prüfen die URL für das richtige Tab
    return location.pathname.includes('/diff') ? 'comparator' : 'explorer';
  });
  
  // URL-Änderungen überwachen
  useEffect(() => {
    if (location.pathname.includes('/diff')) {
      setActiveTab('comparator');
    } else {
      setActiveTab('explorer');
    }
  }, [location.pathname]);
  
  // Interne isDarkMode State wird direkt von parentIsDarkMode abgeleitet
  const isDarkMode = parentIsDarkMode;
  
  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'd': 
            e.preventDefault();
            if (toggleDarkMode) toggleDarkMode();
            break;
          case 'h': 
            e.preventDefault();
            if (activeTab === 'explorer') {
              setShowVastExplorerHistory((prev: boolean) => !prev);
            } else if (activeTab === 'comparator') {
              setShowDiffInspectorHistory((prev: boolean) => !prev);
            }
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

  // History-States
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

  return (
    <div className="w-full h-full flex flex-col p-0">
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
      
      <ApplicationHeader 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        activeTab={activeTab}
        showHistory={activeShowHistory}
        setShowHistory={activeSetShowHistory}
        historyLength={activeHistory.length}
        title="JSON Toolkit"
        subtitle="Validate, Compare & Explore VAST/JSON"
      />
      
      <div className="container mx-auto px-16 py-8 mt-24" style={{ maxWidth: "90%" }}>
        <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
      </div>
    </div>
  );
}

export default JsonToolsApp; 