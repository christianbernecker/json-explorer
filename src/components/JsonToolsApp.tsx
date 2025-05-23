import React, { useState, useEffect } from 'react';
import { 
  HistoryItem as HistoryItemType, 
  JsonToolsAppProps
} from '../types';
import JsonVastExplorer from './JsonVastExplorer';
import JsonDiffInspector from './JsonDiffInspector';
import JsonTcfAnalyzer from './JsonTcfAnalyzer';
import { SEO, StructuredData } from './seo';
import ApplicationHeader from './ApplicationHeader';
import { useLocation } from 'react-router-dom';

// Main Application Component
function JsonToolsApp({ parentIsDarkMode, toggleDarkMode }: JsonToolsAppProps) {
  const location = useLocation();
  // activeTab wird jetzt aus der URL abgeleitet
  const [activeTab, setActiveTab] = useState(() => {
    // Default ist 'explorer', aber wir prüfen die URL für das richtige Tab
    if (location.pathname.includes('/diff')) return 'comparator';
    if (location.pathname.includes('/tcf-analyzer')) return 'tcf-analyzer';
    return 'explorer';
  });
  
  // URL-Änderungen überwachen
  useEffect(() => {
    if (location.pathname.includes('/diff')) {
      setActiveTab('comparator');
    } else if (location.pathname.includes('/tcf-analyzer')) {
      setActiveTab('tcf-analyzer');
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
            } else if (activeTab === 'tcf-analyzer') {
              setShowTcfAnalyzerHistory((prev: boolean) => !prev);
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
  
  // Neuer History-State für den TCF-Analyzer
  const [tcfAnalyzerHistory, setTcfAnalyzerHistory] = useState<HistoryItemType[]>(() => {
    const savedHistory = localStorage.getItem('jsonTools_tcfAnalyzerHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  
  const [showVastExplorerHistory, setShowVastExplorerHistory] = useState(false);
  const [showDiffInspectorHistory, setShowDiffInspectorHistory] = useState(false);
  const [showTcfAnalyzerHistory, setShowTcfAnalyzerHistory] = useState(false);

  useEffect(() => {
    localStorage.setItem('jsonTools_vastExplorerHistory', JSON.stringify(vastExplorerHistory));
  }, [vastExplorerHistory]);
  
  useEffect(() => {
    localStorage.setItem('jsonTools_diffInspectorHistory', JSON.stringify(diffInspectorHistory));
  }, [diffInspectorHistory]);
  
  useEffect(() => {
    localStorage.setItem('jsonTools_tcfAnalyzerHistory', JSON.stringify(tcfAnalyzerHistory));
  }, [tcfAnalyzerHistory]);

  // Wähle die aktiven History-States basierend auf dem aktiven Tab
  let activeHistory;
  let activeShowHistory;
  let activeSetShowHistory;
  
  if (activeTab === 'explorer') {
    activeHistory = vastExplorerHistory;
    activeShowHistory = showVastExplorerHistory;
    activeSetShowHistory = setShowVastExplorerHistory;
  } else if (activeTab === 'comparator') {
    activeHistory = diffInspectorHistory;
    activeShowHistory = showDiffInspectorHistory;
    activeSetShowHistory = setShowDiffInspectorHistory;
  } else {
    activeHistory = tcfAnalyzerHistory;
    activeShowHistory = showTcfAnalyzerHistory;
    activeSetShowHistory = setShowTcfAnalyzerHistory;
  }

  return (
    <div className="w-full h-full flex flex-col p-0">
      <SEO 
        title="JSON Validator, Formatter & Diff Tool | Online JSON and VAST Analyzer"
        description="Free tools for comparing, validating, and analyzing JSON files and VAST AdTags. Easy to use with no installation required."
        additionalMetaTags={[
          { name: 'keywords', content: 'JSON validator, JSON formatter, JSON comparison, VAST validator, AdTech tools, TCF analyzer' },
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
        showHistory={activeShowHistory} 
        setShowHistory={activeSetShowHistory} 
        historyLength={activeHistory.length}
        title={activeTab === 'explorer' ? "JSON Validator & Explorer" : activeTab === 'comparator' ? "JSON Diff Tool" : "TCF String Analyzer"}
        subtitle={activeTab === 'explorer' ? "Validate, format and explore JSON + VAST documents" : activeTab === 'comparator' ? "Compare two JSON objects" : "Parse and decode TCF strings"}
        activeTab={activeTab} 
      />
      
      {/* Container mit responsiven Abständen */}
      <div className="mt-4 sm:mt-6 md:mt-8 px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
        {activeTab === 'explorer' ? (
          <JsonVastExplorer 
            isDarkMode={isDarkMode}
            history={vastExplorerHistory}
            setHistory={setVastExplorerHistory}
            showHistory={showVastExplorerHistory}
            setShowHistory={setShowVastExplorerHistory}
          />
        ) : activeTab === 'comparator' ? (
          <JsonDiffInspector 
            isDarkMode={isDarkMode}
            history={diffInspectorHistory}
            setHistory={setDiffInspectorHistory}
            showHistory={showDiffInspectorHistory}
            setShowHistory={setShowDiffInspectorHistory}
          />
        ) : (
          <JsonTcfAnalyzer
            isDarkMode={isDarkMode}
            history={tcfAnalyzerHistory}
            setHistory={setTcfAnalyzerHistory}
            showHistory={showTcfAnalyzerHistory}
            setShowHistory={setShowTcfAnalyzerHistory}
          />
        )}
      </div>
    </div>
  );
}

export default JsonToolsApp; 