import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { SearchController, SearchMatch, SearchOptions } from './SearchController';
import { Transition } from '@headlessui/react';

interface FloatingSearchBarProps {
  isDarkMode: boolean;
  jsonData: any;
  jsonRef: React.RefObject<HTMLDivElement>;
  vastData?: string;
  vastRef?: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  onClose: () => void;
  onSearchComplete?: (count: number) => void;
}

const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  isDarkMode,
  jsonRef,
  vastRef,
  isVisible,
  onClose,
  onSearchComplete
}) => {
  // Suchzustand
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  
  // Suchoptionen
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regexSearch: false,
    searchInKeys: true,
    highlightAll: false
  });
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchController = useRef<SearchController>(new SearchController(options));
  const highlightedElements = useRef<HTMLElement[]>([]);
  
  // Initialisiere die Suchengine mit aktuellen DOM-Elementen
  useEffect(() => {
    if (!isVisible) return;
    
    const controller = searchController.current;
    controller.setOptions(options);
    
    // DOM-Elemente sammeln
    if (jsonRef.current) {
      controller.setJsonElements(jsonRef.current);
    }
    
    if (vastRef?.current) {
      controller.setVastElements(vastRef.current);
    }
    
    // Fokussiere das Suchfeld
    searchInputRef.current?.focus();
  }, [isVisible, jsonRef, vastRef, options]);
  
  // Führt die Suche aus
  const performSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setCurrentIndex(-1);
      clearHighlights();
      if (onSearchComplete) onSearchComplete(0);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const matches = searchController.current.search(searchTerm);
      setResults(matches);
      setCurrentIndex(matches.length > 0 ? 0 : -1);
      
      if (matches.length > 0) {
        highlightMatches(matches);
        if (onSearchComplete) onSearchComplete(matches.length);
      } else {
        clearHighlights();
        setError(`Keine Treffer für "${searchTerm}" gefunden`);
        if (onSearchComplete) onSearchComplete(0);
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Suche');
      clearHighlights();
      if (onSearchComplete) onSearchComplete(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, onSearchComplete]);
  
  // Verzögert die Suche
  useEffect(() => {
    if (!isVisible || !searchTerm.trim()) return;
    
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, performSearch, isVisible]);
  
  // Navigiere zu nächstem/vorherigem Treffer
  const goToNextMatch = useCallback(() => {
    if (results.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % results.length;
    setCurrentIndex(nextIndex);
    highlightCurrentMatch(nextIndex);
  }, [results, currentIndex]);
  
  const goToPrevMatch = useCallback(() => {
    if (results.length === 0) return;
    
    const prevIndex = (currentIndex - 1 + results.length) % results.length;
    setCurrentIndex(prevIndex);
    highlightCurrentMatch(prevIndex);
  }, [results, currentIndex]);
  
  // Hervorhebung für Treffer
  const highlightMatches = useCallback((matches: SearchMatch[]) => {
    clearHighlights();
    
    matches.forEach((match, index) => {
      if (match.node) {
        const element = match.node;
        const isCurrentMatch = index === currentIndex;
        
        element.classList.add('search-match');
        element.setAttribute('data-search-id', match.id);
        
        if (isCurrentMatch) {
          element.classList.add('current-match');
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
        
        if (options.highlightAll || isCurrentMatch) {
          const bgColor = isCurrentMatch 
            ? (isDarkMode ? '#ef4444' : '#f87171') 
            : (isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)');
          
          element.style.backgroundColor = bgColor;
          element.style.padding = '2px';
          element.style.borderRadius = '2px';
          
          if (isCurrentMatch) {
            element.style.color = 'white';
            element.style.outline = isDarkMode ? '1px solid white' : '1px solid #ef4444';
          }
        }
        
        highlightedElements.current.push(element);
      }
    });
  }, [currentIndex, isDarkMode, options.highlightAll]);
  
  // Hervorhebe aktuellen Treffer
  const highlightCurrentMatch = useCallback((index: number) => {
    if (index < 0 || index >= results.length) return;
    
    const match = results[index];
    
    // Entferne current-match von allen Elementen
    highlightedElements.current.forEach(el => {
      el.classList.remove('current-match');
      el.style.backgroundColor = options.highlightAll
        ? (isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)')
        : '';
      el.style.color = '';
      el.style.outline = '';
    });
    
    if (match.node) {
      match.node.classList.add('current-match');
      match.node.style.backgroundColor = isDarkMode ? '#ef4444' : '#f87171';
      match.node.style.color = 'white';
      match.node.style.outline = isDarkMode ? '1px solid white' : '1px solid #ef4444';
      
      match.node.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [results, isDarkMode, options.highlightAll]);
  
  // Lösche alle Hervorhebungen
  const clearHighlights = useCallback(() => {
    highlightedElements.current.forEach(el => {
      el.classList.remove('search-match', 'current-match');
      el.removeAttribute('data-search-id');
      el.style.backgroundColor = '';
      el.style.padding = '';
      el.style.borderRadius = '';
      el.style.color = '';
      el.style.outline = '';
    });
    
    highlightedElements.current = [];
  }, []);
  
  // Tastaturkürzel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc schließt die Suche
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      // Navigation zwischen Treffern
      if ((isVisible && document.activeElement === searchInputRef.current) || 
          e.key === 'F3') {
        if (e.key === 'Enter' || e.key === 'F3') {
          e.preventDefault();
          if (e.shiftKey) {
            goToPrevMatch();
          } else {
            goToNextMatch();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToNextMatch, goToPrevMatch, onClose, isVisible]);
  
  // Cleanup beim Schließen
  useEffect(() => {
    if (!isVisible) {
      clearHighlights();
    }
  }, [isVisible, clearHighlights]);
  
  // Falls keine Animationskomponente verfügbar ist, einfaches Rendering
  if (!Transition) {
    if (!isVisible) return null;
    
    return (
      <div 
        className={`floating-search-container fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-2xl shadow-lg rounded-lg ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Sucheingabe und Steuerelemente werden hier gerendert */}
        {renderSearchContent()}
      </div>
    );
  }
  
  // Mit Animation
  return (
    <Transition
      show={isVisible}
      as={Fragment}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 transform -translate-y-2"
      enterTo="opacity-100 transform translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 transform translate-y-0"
      leaveTo="opacity-0 transform -translate-y-2"
    >
      <div 
        className={`floating-search-container fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-2xl shadow-lg rounded-lg ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
      >
        {renderSearchContent()}
      </div>
    </Transition>
  );
  
  // Gemeinsamer Inhalt für beide Rendering-Varianten
  function renderSearchContent() {
    return (
      <div className="flex flex-col p-3">
        <div className="flex items-center">
          <div className="relative flex-grow">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`${options.regexSearch ? 'Regex' : 'Text'} suchen...`}
              className={`w-full px-3 py-2 text-sm rounded-l-md border outline-none ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500' 
                  : 'border-gray-300 focus:border-blue-500'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    goToPrevMatch();
                  } else {
                    goToNextMatch();
                  }
                }
              }}
            />
            <button
              onClick={performSearch}
              disabled={loading || !searchTerm.trim()}
              className={`absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md ${
                isDarkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500'
              }`}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="flex items-center ml-2">
            <button 
              onClick={goToPrevMatch}
              disabled={results.length === 0 || loading}
              className={`p-1 rounded-md ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-600 disabled:text-gray-500' 
                  : 'text-gray-600 hover:bg-gray-200 disabled:text-gray-400'
              }`}
              title="Vorheriger Treffer (Shift+Enter oder Shift+F3)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            
            <button
              onClick={goToNextMatch}
              disabled={results.length === 0 || loading}
              className={`p-1 rounded-md ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-600 disabled:text-gray-500' 
                  : 'text-gray-600 hover:bg-gray-200 disabled:text-gray-400'
              }`}
              title="Nächster Treffer (Enter oder F3)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`p-1 ml-1 rounded-md ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-600' 
                  : 'text-gray-600 hover:bg-gray-200'
              } ${showOptions ? (isDarkMode ? 'bg-gray-600' : 'bg-gray-200') : ''}`}
              title="Suchoptionen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            
            <button
              onClick={onClose}
              className={`p-1 ml-1 rounded-md ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-600' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
              title="Suche schließen (ESC)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {loading ? 'Suche...' : (results.length > 0 ? `${currentIndex + 1} von ${results.length}` : 'Keine Treffer')}
            </span>
          </div>
        </div>
        
        {/* Erweiterte Suchoptionen */}
        {showOptions && (
          <div className={`mt-2 p-2 rounded-md text-xs ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.caseSensitive}
                  onChange={(e) => setOptions({...options, caseSensitive: e.target.checked})}
                  className="mr-1"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Groß-/Kleinschreibung</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.wholeWord}
                  onChange={(e) => setOptions({...options, wholeWord: e.target.checked})}
                  className="mr-1"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Ganze Wörter</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.searchInKeys}
                  onChange={(e) => setOptions({...options, searchInKeys: e.target.checked})}
                  className="mr-1"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>In JSON-Schlüsseln</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.highlightAll}
                  onChange={(e) => setOptions({...options, highlightAll: e.target.checked})}
                  className="mr-1"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Alle hervorheben</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.regexSearch}
                  onChange={(e) => setOptions({...options, regexSearch: e.target.checked})}
                  className="mr-1"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Regex-Suche</span>
              </label>
            </div>
            
            {/* Schnellhilfe für Regex */}
            {options.regexSearch && (
              <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p className="font-medium mb-1">Regex-Hilfe:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div><code>\\w+</code> - Wort</div>
                  <div><code>\\d+</code> - Zahlen</div>
                  <div><code>^bid</code> - Beginnt mit "bid"</div>
                  <div><code>price$</code> - Endet mit "price"</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Fehlermeldung */}
        {error && (
          <div className={`mt-2 text-xs p-1 rounded ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-600'}`}>
            {error}
          </div>
        )}
        
        {/* Tastaturkürzel-Hinweis */}
        <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-center`}>
          <kbd className="px-1 py-0.5 rounded border">F3</kbd> oder <kbd className="px-1 py-0.5 rounded border">Enter</kbd> für nächsten Treffer, 
          <kbd className="px-1 py-0.5 rounded border ml-1">Shift+F3</kbd> oder <kbd className="px-1 py-0.5 rounded border">Shift+Enter</kbd> für vorherigen Treffer
        </div>
      </div>
    );
  }
};

export default FloatingSearchBar; 