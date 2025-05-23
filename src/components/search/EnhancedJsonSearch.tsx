import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createSearcher, SearchResult } from './ImprovedSearch';

interface EnhancedJsonSearchProps {
  isDarkMode: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  onClose: () => void;
}

const EnhancedJsonSearch: React.FC<EnhancedJsonSearchProps> = ({
  isDarkMode,
  containerRef,
  isVisible,
  onClose
}) => {
  // Ref für das Eingabefeld
  const inputRef = useRef<HTMLInputElement>(null);
  
  // States für die Suchfunktionalität
  const [searchTerm, setSearchTerm] = useState('');
  const [resultsCount, setResultsCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [options, setOptions] = useState({
    caseSensitive: false,
    matchWholeWord: false,
    highlightAll: true,  // Enable highlight all by default
    extractJsonPath: true
  });
  const [showResultDetails, setShowResultDetails] = useState(false);
  const [currentResults, setCurrentResults] = useState<SearchResult[]>([]);
  const [keyboardShortcutsVisible, setKeyboardShortcutsVisible] = useState(false);
  
  // Ref für die Suchfunktion
  const searcherRef = useRef<ReturnType<typeof createSearcher> | null>(null);
  
  // Initialisiere den Searcher bei Änderungen am Container
  useEffect(() => {
    if (containerRef.current) {
      searcherRef.current = createSearcher(containerRef.current);
    }
    
    // Cleanup bei Unmount
    return () => {
      searcherRef.current?.cleanup();
    };
  }, [containerRef]);
  
  // Führe die Suche durch
  const executeSearch = useCallback(() => {
    if (!searcherRef.current || !searchTerm.trim()) {
      setResultsCount(0);
      setCurrentIndex(-1);
      setCurrentResults([]);
      return;
    }
    
    const result = searcherRef.current.search(searchTerm, options);
    setResultsCount(result.totalResults);
    setCurrentIndex(result.currentIndex);
    setCurrentResults(result.results || []);
    
    // Automatisch Ergebnisdetails anzeigen, wenn es wenige Ergebnisse gibt
    if (result.totalResults > 0 && result.totalResults <= 10) {
      setShowResultDetails(true);
    }
  }, [searchTerm, options]);
  
  // Zum nächsten Suchergebnis navigieren
  const goToNextResult = useCallback(() => {
    if (!searcherRef.current || resultsCount === 0) return;
    
    searcherRef.current.next();
    setCurrentIndex(searcherRef.current.currentIndex);
  }, [resultsCount]);
  
  // Zum vorherigen Suchergebnis navigieren
  const goToPrevResult = useCallback(() => {
    if (!searcherRef.current || resultsCount === 0) return;
    
    searcherRef.current.previous();
    setCurrentIndex(searcherRef.current.currentIndex);
  }, [resultsCount]);
  
  // Alle Ergebnisse hervorheben
  const toggleHighlightAll = useCallback(() => {
    const newOptions = {
      ...options,
      highlightAll: !options.highlightAll
    };
    setOptions(newOptions);
    
    if (searcherRef.current && resultsCount > 0) {
      if (newOptions.highlightAll) {
        searcherRef.current.highlightAll();
      } else {
        searcherRef.current.search(searchTerm, newOptions);
      }
    }
  }, [options, searchTerm, resultsCount]);
  
  // Die Suche starten, wenn Enter gedrückt wird
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [executeSearch, onClose]);
  
  // Globale Keyboard-Shortcuts
  useEffect(() => {
    if (!isVisible) return;
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Navigations-Shortcuts nur wenn die Suche geöffnet ist
      if (e.key === 'F3') {
        e.preventDefault();
        if (e.shiftKey) {
          goToPrevResult();
        } else {
          goToNextResult();
        }
      }
      
      // Ctrl+Enter für Highlight All
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleHighlightAll();
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isVisible, goToNextResult, goToPrevResult, toggleHighlightAll]);
  
  // Bei Änderungen der Sichtbarkeit
  useEffect(() => {
    if (isVisible) {
      // Fokus auf das Eingabefeld setzen, wenn die Komponente sichtbar wird
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Bereinigen bei Verstecken
      searcherRef.current?.cleanup();
      setResultsCount(0);
      setCurrentIndex(-1);
      setCurrentResults([]);
      setShowResultDetails(false);
    }
  }, [isVisible]);
  
  // Generiere einen Mini-Scrollbar mit Ergebnismarkierungen
  const renderScrollIndicator = useCallback(() => {
    if (resultsCount === 0 || !containerRef.current) return null;
    
    // Berechne relative Positionen der Ergebnisse
    const container = containerRef.current;
    const containerHeight = container.scrollHeight;
    const indicators = currentResults.map((result, index) => {
      // Berechne relative Position im Container (0-100%)
      const element = result.element;
      const elementTop = element.offsetTop;
      const relativePosition = (elementTop / containerHeight) * 100;
      
      return (
        <div 
          key={`indicator-${index}`}
          className={`absolute w-2 h-1 rounded-sm ${
            index === currentIndex 
              ? 'bg-orange-500' 
              : 'bg-blue-400'
          }`}
          style={{ 
            left: '2px', 
            top: `${relativePosition}%`,
            transform: 'translateY(-50%)'
          }}
          title={`Result ${index + 1}`}
          onClick={() => {
            if (searcherRef.current) {
              // Statt highlightResult direkt verwenden wir die Methoden des Searchers
              if (index !== currentIndex) {
                // Aktuelle Position merken
                const currentPos = searcherRef.current.currentIndex;
                const diff = index - currentPos;
                const steps = Math.abs(diff);
                
                // In die richtige Richtung navigieren
                for (let i = 0; i < steps; i++) {
                  if (diff > 0) {
                    searcherRef.current.next();
                  } else {
                    searcherRef.current.previous();
                  }
                }
                
                setCurrentIndex(index);
              }
            }
          }}
        />
      );
    });
    
    return (
      <div className="absolute right-0 top-0 w-4 h-full bg-gray-100 dark:bg-gray-700 rounded-r-lg">
        <div className="relative w-full h-full">
          {indicators}
        </div>
      </div>
    );
  }, [resultsCount, currentResults, currentIndex, containerRef]);
  
  // Styles für die Suche-Box - jetzt als inline component
  const searchStyles = {
    container: `w-full ${isVisible ? 'block' : 'hidden'}`,
    panel: `rounded-lg mb-3 p-3 relative
            ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-300'}`,
    inputContainer: `flex items-center`,
    input: `w-full px-3 py-1 rounded-lg border
             ${isDarkMode 
               ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
               : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'}
             focus:outline-none focus:ring-1
             ${isDarkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-400'}`,
    optionsContainer: `flex items-center my-2 flex-wrap`,
    checkbox: `mr-1`,
    checkboxLabel: `mr-4 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`,
    resultsText: `text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`,
    navigationContainer: `flex items-center justify-between mt-2`,
    button: `px-2 py-1 rounded-md text-xs
              ${isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`,
    highlightButton: `px-2 py-1 rounded-md text-xs
              ${options.highlightAll
                ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white')
                : (isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800')}`,
    closeButton: `ml-2 p-1 rounded-full 
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`,
    searchButton: `ml-2 px-2 py-1 rounded-md text-white text-xs
                   ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`,
    shortcutHint: `inline-flex items-center justify-center text-xs 
                  ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`,
    shortcutKey: `px-1 py-0.5 rounded text-xs font-mono 
                  ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`,
    resultsContainer: `mt-2 max-h-40 overflow-y-auto border rounded
                      ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`,
    resultItem: `px-2 py-1 text-xs border-b last:border-b-0 cursor-pointer
                ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'}`,
    activeResult: `${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`
  };
  
  if (!isVisible) return null;
  
  // Formatiere den JSON-Pfad für die Anzeige
  const formatJsonPath = (path?: string) => {
    if (!path) return null;
    return (
      <div className="mt-1">
        <span className={`text-xs font-mono ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          {path}
        </span>
      </div>
    );
  };
  
  // Zeige Kontext mit Highlighting
  const renderContext = (result: SearchResult) => {
    if (!result.context) return null;
    
    const { context, startPos, text } = result;
    const searchTermLength = searchTerm.length;
    const contextStartPos = context.startsWith('...') ? 3 : 0;
    
    // Berechne die Position des Suchbegriffs im Kontext
    let highlightStart = startPos;
    if (context.startsWith('...')) {
      // Berechne die Position im gekürzten Kontext
      const textBeforeMatch = text.substring(0, startPos);
      const charsRemoved = textBeforeMatch.length - contextStartPos;
      highlightStart = Math.max(0, startPos - charsRemoved);
    }
    
    // Split context in parts: before match, match, after match
    const beforeMatch = context.substring(0, highlightStart);
    const match = context.substring(highlightStart, highlightStart + searchTermLength);
    const afterMatch = context.substring(highlightStart + searchTermLength);
    
    return (
      <div className="text-xs mt-1">
        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{beforeMatch}</span>
        <span className="font-bold bg-yellow-200 text-black px-0.5 rounded">{match}</span>
        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{afterMatch}</span>
      </div>
    );
  };
  
  // Keyboard shortcut tooltip
  const KeyboardHint = () => (
    <div className="text-xs mt-1 flex space-x-3">
      <div className={searchStyles.shortcutHint}>
        <span className={searchStyles.shortcutKey}>F3</span>
        <span className="ml-1">Next</span>
      </div>
      <div className={searchStyles.shortcutHint}>
        <span className={searchStyles.shortcutKey}>Shift+F3</span>
        <span className="ml-1">Previous</span>
      </div>
      <div className={searchStyles.shortcutHint}>
        <span className={searchStyles.shortcutKey}>Ctrl+Enter</span>
        <span className="ml-1">Highlight All</span>
      </div>
    </div>
  );
  
  return (
    <div className={searchStyles.container}>
      <div className={searchStyles.panel}>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Search
          </h3>
          <button onClick={onClose} className={searchStyles.closeButton}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className={searchStyles.inputContainer}>
          <div className="relative w-full">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter search term..."
              className={searchStyles.input}
            />
          </div>
          
          <button onClick={executeSearch} className={searchStyles.searchButton}>
            Search
          </button>
        </div>
        
        <div className={searchStyles.optionsContainer}>
          <input
            type="checkbox"
            id="caseSensitive"
            checked={options.caseSensitive}
            onChange={(e) => setOptions({...options, caseSensitive: e.target.checked})}
            className={searchStyles.checkbox}
          />
          <label htmlFor="caseSensitive" className={searchStyles.checkboxLabel}>
            Case sensitive
          </label>
          
          <input
            type="checkbox"
            id="matchWholeWord"
            checked={options.matchWholeWord}
            onChange={(e) => setOptions({...options, matchWholeWord: e.target.checked})}
            className={searchStyles.checkbox}
          />
          <label htmlFor="matchWholeWord" className={searchStyles.checkboxLabel}>
            Match whole word
          </label>
          
          <button onClick={toggleHighlightAll} className={searchStyles.highlightButton}>
            Highlight All
          </button>
          
          <button 
            onClick={() => setKeyboardShortcutsVisible(!keyboardShortcutsVisible)}
            className={`ml-auto ${searchStyles.button}`}
            title="Keyboard shortcuts"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>
        </div>
        
        {keyboardShortcutsVisible && <KeyboardHint />}
        
        {searchTerm && (
          <div className={searchStyles.navigationContainer}>
            <div className={searchStyles.resultsText}>
              {resultsCount === 0 
                ? 'No matches found' 
                : `${currentIndex + 1} of ${resultsCount} matches`}
              <button 
                className={`ml-2 underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} hover:no-underline`}
                onClick={() => setShowResultDetails(!showResultDetails)}
              >
                {showResultDetails ? 'Hide details' : 'Show details'}
              </button>
            </div>
            
            {resultsCount > 0 && (
              <div className="flex space-x-2">
                <button onClick={goToPrevResult} className={searchStyles.button} title="Previous Result (Shift+F3)">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button onClick={goToNextResult} className={searchStyles.button} title="Next Result (F3)">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Results details panel */}
        {showResultDetails && resultsCount > 0 && (
          <div className={searchStyles.resultsContainer}>
            {currentResults.map((result, index) => (
              <div 
                key={`result-${index}`}
                className={`${searchStyles.resultItem} ${index === currentIndex ? searchStyles.activeResult : ''}`}
                onClick={() => {
                  if (searcherRef.current) {
                    // Statt highlightResult direkt verwenden wir die Methoden des Searchers
                    if (index !== currentIndex) {
                      // Aktuelle Position merken
                      const currentPos = searcherRef.current.currentIndex;
                      const diff = index - currentPos;
                      const steps = Math.abs(diff);
                      
                      // In die richtige Richtung navigieren
                      for (let i = 0; i < steps; i++) {
                        if (diff > 0) {
                          searcherRef.current.next();
                        } else {
                          searcherRef.current.previous();
                        }
                      }
                      
                      setCurrentIndex(index);
                    }
                  }
                }}
              >
                <div className="flex justify-between">
                  <span className="font-medium">Result {index + 1}</span>
                  {result.lineNumber && (
                    <span className="text-gray-500">Line {result.lineNumber}</span>
                  )}
                </div>
                {renderContext(result)}
                {formatJsonPath(result.jsonPath)}
              </div>
            ))}
          </div>
        )}
        
        {/* Scroll position indicator */}
        {resultsCount > 0 && renderScrollIndicator()}
      </div>
    </div>
  );
};

export default EnhancedJsonSearch; 