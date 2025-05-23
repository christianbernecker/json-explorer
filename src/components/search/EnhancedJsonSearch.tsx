import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createSearcher } from './ImprovedSearch';

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
    matchWholeWord: false
  });
  
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
      return;
    }
    
    const result = searcherRef.current.search(searchTerm, options);
    setResultsCount(result.totalResults);
    setCurrentIndex(result.currentIndex);
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
  
  // Die Suche starten, wenn Enter gedrückt wird
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [executeSearch, onClose]);
  
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
    }
  }, [isVisible]);
  
  // Styles für die Suche-Box - jetzt als inline component
  const searchStyles = {
    container: `w-full ${isVisible ? 'block' : 'hidden'}`,
    panel: `rounded-lg mb-3 p-3 
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
    closeButton: `ml-2 p-1 rounded-full 
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'}`,
    searchButton: `ml-2 px-2 py-1 rounded-md text-white text-xs
                   ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`
  };
  
  if (!isVisible) return null;
  
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
        </div>
        
        {searchTerm && (
          <div className={searchStyles.navigationContainer}>
            <div className={searchStyles.resultsText}>
              {resultsCount === 0 
                ? 'No matches found' 
                : `${currentIndex + 1} of ${resultsCount} matches`}
            </div>
            
            {resultsCount > 0 && (
              <div className="flex space-x-2">
                <button onClick={goToPrevResult} className={searchStyles.button} title="Previous Result">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button onClick={goToNextResult} className={searchStyles.button} title="Next Result">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedJsonSearch; 