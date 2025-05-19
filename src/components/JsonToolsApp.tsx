import React, { useState, useEffect } from 'react';
import { 
  HistoryItem as HistoryItemType, 
  JsonToolsAppProps
} from '../types';
import JsonVastExplorer from './JsonVastExplorer';
import JsonDiffInspector from './JsonDiffInspector';
import { SEO, StructuredData } from './seo';
import ApplicationHeader from './ApplicationHeader';
import PrimaryContainer from './shared/PrimaryContainer';
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
        title={activeTab === 'diff' ? 'JSON Diff Tool' : 'JSON Explorer & VAST Decoder'} 
        subtitle={activeTab === 'diff' ? 'Compare JSON structures and find differences' : 'Validate JSON and explore VAST tags'}
        activeTab="json-explorer"
      />
      
      {/* Container mit responsiven Abständen */}
      <div className="mt-4 sm:mt-6 md:mt-8 px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
        <PrimaryContainer isDarkMode={isDarkMode} className="p-2 sm:p-3 md:p-4">
          {activeTab === 'explorer' ? (
            <JsonVastExplorer 
              isDarkMode={isDarkMode}
              showHistory={showVastExplorerHistory}
              setShowHistory={setShowVastExplorerHistory}
              historyItems={vastExplorerHistory}
              setHistory={setVastExplorerHistory}
            />
          ) : (
            <JsonDiffInspector 
              isDarkMode={isDarkMode}
              showHistory={showDiffInspectorHistory}
              setShowHistory={setShowDiffInspectorHistory}
              historyItems={diffInspectorHistory}
              setHistory={setDiffInspectorHistory}
            />
          )}
        </PrimaryContainer>
      </div>
    </div>
  );
}

export default JsonToolsApp; 