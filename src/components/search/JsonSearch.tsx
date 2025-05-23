import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { performSearch } from './SearchFix';

interface JsonSearchProps {
  isDarkMode: boolean;
  jsonRef: React.RefObject<HTMLDivElement>;
  vastRef: React.RefObject<HTMLDivElement>;
  activeTabIndex: number;
  isVisible: boolean;
  onClose: () => void;
  onSearchComplete: (resultCount: number) => void;
}

const JsonSearch: React.FC<JsonSearchProps> = ({
  isDarkMode,
  jsonRef,
  vastRef,
  activeTabIndex,
  isVisible,
  onClose,
  onSearchComplete
}) => {
  // Refs für DOM-Elements
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{element: HTMLElement, text: string, startPos: number}[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [debug, setDebug] = useState<string | null>(null);
  
  // Bestimmen des aktuellen aktiven Refs basierend auf activeTabIndex
  const getActiveRef = useCallback(() => {
    if (activeTabIndex === 0) {
      return jsonRef.current ? jsonRef : vastRef;
    }
    return vastRef;
  }, [activeTabIndex, jsonRef, vastRef]);

  // Durchführen der Suche
  const executeSearch = useCallback(() => {
    const activeRef = getActiveRef();
    if (!activeRef || !activeRef.current || !searchTerm.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      setTotalResults(0);
      return;
    }

    try {
      setDebug(`Suche nach: ${searchTerm} in ${activeRef.current.className}`);
      const { matches, highlightMatch, cleanup } = performSearch(
        searchTerm, 
        activeRef.current, 
        null, 
        { caseSensitive }
      );

      setSearchResults(matches);
      setTotalResults(matches.length);
      
      if (matches.length > 0) {
        setCurrentResultIndex(0);
        highlightMatch(0, matches);
      } else {
        setCurrentResultIndex(-1);
      }

      // Benachrichtige den Parent über die Anzahl der Suchergebnisse
      onSearchComplete(matches.length);

      // Bereinigungsfunktion auf komponente speichern
      return cleanup;
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
      setDebug(`Fehler: ${String(error)}`);
      setSearchResults([]);
      setCurrentResultIndex(-1);
      setTotalResults(0);
      return () => {};
    }
  }, [searchTerm, getActiveRef, onSearchComplete, caseSensitive]);
  
  // Zum nächsten Suchergebnis navigieren
  const goToNextResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(nextIndex);
    
    const activeRef = getActiveRef();
    if (activeRef && activeRef.current) {
      const { highlightMatch } = performSearch(searchTerm, activeRef.current, null, { caseSensitive });
      highlightMatch(nextIndex, searchResults);
    }
  }, [searchResults, currentResultIndex, searchTerm, getActiveRef, caseSensitive]);
  
  // Zum vorherigen Suchergebnis navigieren
  const goToPrevResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const prevIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentResultIndex(prevIndex);
    
    const activeRef = getActiveRef();
    if (activeRef && activeRef.current) {
      const { highlightMatch } = performSearch(searchTerm, activeRef.current, null, { caseSensitive });
      highlightMatch(prevIndex, searchResults);
    }
  }, [searchResults, currentResultIndex, searchTerm, getActiveRef, caseSensitive]);
  
  // Nach Enter-Taste suchen
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Bei Enter wird immer eine neue Suche ausgeführt
      executeSearch();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [executeSearch, onClose]);
  
  // Fokussiere das Suchfeld, wenn die Komponente sichtbar wird
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
    
    // Führe sofort eine Suche durch, wenn searchTerm vorhanden ist und die Komponente sichtbar wird
    if (isVisible && searchTerm) {
      const cleanup = executeSearch();
      
      // Cleanup bei Unmount
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [isVisible, executeSearch, searchTerm]);
  
  // CSS für die Suche
  useEffect(() => {
    // Nur CSS hinzufügen, wenn die Komponente sichtbar ist
    if (!isVisible) return;
    
    const style = document.createElement('style');
    style.innerHTML = `
      .search-term-highlight {
        background-color: rgba(59, 130, 246, 0.3);
        padding: 1px;
        border-radius: 2px;
        font-weight: bold;
      }
      .search-term-current {
        background-color: rgba(239, 68, 68, 0.7);
        color: white;
        padding: 1px;
        border-radius: 2px;
        outline: 2px solid rgba(239, 68, 68, 0.9);
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [isVisible]);
  
  if (!isVisible) return null;
  
  return (
    <div className={`fixed top-0 left-0 w-full flex justify-center items-start z-40 p-4 transition-all duration-200 ${
      isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      <div className={`search-panel w-full max-w-md rounded-lg shadow-xl border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
      }`}>
        <div className="p-3">
          <div className="flex items-center">
            <div className="flex-grow flex items-center relative">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Suchbegriff eingeben..."
                className={`w-full p-2 pl-9 rounded-md border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                } focus:outline-none focus:ring-2 ${
                  isDarkMode ? 'focus:ring-blue-600' : 'focus:ring-blue-500'
                }`}
              />
              <svg
                className={`absolute left-2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              onClick={executeSearch}
              className={`ml-2 p-2 rounded-md ${
                isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
              title="Suchen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className={`ml-2 p-2 rounded-md ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              title="Schließen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center mt-2 justify-between">
            <label className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="mr-2"
              />
              Groß-/Kleinschreibung beachten
            </label>
            
            {totalResults > 0 && (
              <div className="flex items-center">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mr-2`}>
                  {currentResultIndex + 1} von {totalResults}
                </span>
                <button
                  onClick={goToPrevResult}
                  className={`p-1 rounded-md ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mr-1`}
                  title="Vorheriges Ergebnis"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={goToNextResult}
                  className={`p-1 rounded-md ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  title="Nächstes Ergebnis"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {totalResults === 0 && searchTerm && (
            <div className={`mt-2 p-2 rounded-md text-sm ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              Keine Ergebnisse gefunden.
            </div>
          )}
          
          {debug && (
            <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-xs">
              {debug}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonSearch; 