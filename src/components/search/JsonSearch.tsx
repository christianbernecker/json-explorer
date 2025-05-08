import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Transition } from '@headlessui/react';

interface JsonSearchProps {
  isDarkMode: boolean;
  jsonRef: React.RefObject<HTMLDivElement>;
  vastRef?: React.RefObject<HTMLDivElement>;
  activeTabIndex: number;
  isVisible: boolean;
  onClose: () => void;
  onSearchComplete?: (count: number) => void;
}

interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  inKeys: boolean;
  inValues: boolean;
  highlightAll: boolean;
}

interface SearchMatch {
  element: HTMLElement;
  text: string;
  isKey: boolean;
  line: number;
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
  console.log("JsonSearch rendering with isVisible:", isVisible);
  console.log("JsonSearch refs:", {jsonRef: !!jsonRef.current, vastRef: vastRef?.current ? true : false, activeTabIndex});

  // Suchzustand
  const [searchTerm, setSearchTerm] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    inKeys: true,
    inValues: true,
    highlightAll: true
  });

  // Suchzustand
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const highlightedElements = useRef<HTMLElement[]>([]);
  
  // Aktives Suchziel abhängig vom Tab
  useEffect(() => {
    activeRef.current = activeTabIndex === 0 ? jsonRef.current : vastRef?.current || null;
  }, [activeTabIndex, jsonRef, vastRef]);

  // Highlights entfernen - Diese Funktion muss vor allen anderen Funktionen definiert werden,
  // die sie verwenden, um zirkuläre Abhängigkeiten zu vermeiden
  const clearHighlights = useCallback(() => {
    highlightedElements.current.forEach(el => {
      el.classList.remove('search-match');
      delete el.dataset.searchId;
      el.style.backgroundColor = '';
      el.style.padding = '';
      el.style.borderRadius = '';
      el.style.color = '';
      el.style.outline = '';
    });
    
    highlightedElements.current = [];
  }, []); // Leeres Array, da diese Funktion keine externen Abhängigkeiten hat

  // Matches im DOM hervorheben
  const highlightMatches = useCallback((currentMatches: SearchMatch[]) => {
    clearHighlights();
    
    currentMatches.forEach((match, index) => {
      const element = match.element;
      const isCurrentMatch = index === currentMatchIndex;
      
      // CSS-Klassen für die Hervorhebung
      element.classList.add('search-match');
      element.dataset.searchId = index.toString();
      
      // Styling für aktuelle/alle Treffer
      if (options.highlightAll || isCurrentMatch) {
        // Farben basierend auf Dark Mode
        const bgColor = isCurrentMatch 
          ? (isDarkMode ? '#ef4444' : '#f87171') 
          : (isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)');
        
        // Inline-Styling für bessere Hervorhebung
        element.style.backgroundColor = bgColor;
        element.style.padding = '2px';
        element.style.borderRadius = '2px';
        
        // Für den aktuellen Treffer zusätzliche Hervorhebung
        if (isCurrentMatch) {
          element.style.color = 'white';
          element.style.outline = isDarkMode ? '2px solid white' : '2px solid #ef4444';
        }
      }
      
      // Element für späteren Cleanup speichern
      highlightedElements.current.push(element);
    });
  }, [currentMatchIndex, options.highlightAll, isDarkMode, clearHighlights]);

  // Zum aktuellen Match scrollen
  const scrollToMatch = useCallback((index: number) => {
    if (index < 0 || index >= matches.length) return;
    
    const match = matches[index];
    const element = match.element;
    
    // Alle Highlights zurücksetzen
    highlightedElements.current.forEach(el => {
      if (options.highlightAll) {
        el.style.backgroundColor = isDarkMode 
          ? 'rgba(59, 130, 246, 0.4)' 
          : 'rgba(59, 130, 246, 0.2)';
        el.style.color = '';
        el.style.outline = '';
      } else {
        el.style.backgroundColor = '';
        el.style.color = '';
        el.style.outline = '';
      }
    });
    
    // Aktuelles Element hervorheben
    element.style.backgroundColor = isDarkMode ? '#ef4444' : '#f87171';
    element.style.color = 'white';
    element.style.outline = isDarkMode ? '2px solid white' : '2px solid #ef4444';
    
    // Zum Element scrollen (mit Kontext)
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, [matches, options.highlightAll, isDarkMode]);

  // Suche ausführen
  const performSearch = useCallback(() => {
    // Suchbegriff prüfen
    if (!searchTerm.trim() || !activeRef.current) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      clearHighlights();
      return;
    }
    
    setIsSearching(true);
    setError(null);
    clearHighlights();
    
    try {
      // Alle relevanten Elemente im DOM suchen
      const allElements = activeRef.current.querySelectorAll('*');
      const newMatches: SearchMatch[] = [];
      
      // Suchoption vorbereiten
      const searchRegex = createSearchRegex(searchTerm, options);
      
      // Durch alle Elemente iterieren
      Array.from(allElements).forEach(el => {
        if (!(el instanceof HTMLElement)) return;
        
        const textContent = el.textContent?.trim();
        if (!textContent) return;
        
        // Element-Typ bestimmen (Schlüssel oder Wert)
        const isKey = el.classList.contains('json-key') || 
                     el.hasAttribute('data-key') || 
                     el.getAttribute('data-type') === 'key';
                     
        // Nur in relevanten Elementen suchen (basierend auf Optionen)
        if ((isKey && !options.inKeys) || (!isKey && !options.inValues)) return;
        
        // Text auf Übereinstimmung prüfen
        if (searchRegex.test(textContent)) {
          // Zeilennummer ermitteln
          let line = 1;
          const lineEl = el.closest('[data-line]');
          if (lineEl) {
            const lineAttr = lineEl.getAttribute('data-line');
            if (lineAttr) line = parseInt(lineAttr, 10);
          } else {
            // Alternative Zeilennummer-Ermittlung über Tabellenzellen
            const rowEl = el.closest('tr');
            if (rowEl) {
              const firstCell = rowEl.querySelector('td:first-child');
              const lineText = firstCell?.textContent?.trim();
              if (lineText && !isNaN(parseInt(lineText))) {
                line = parseInt(lineText);
              }
            }
          }
          
          newMatches.push({
            element: el,
            text: textContent,
            isKey,
            line
          });
        }
      });
      
      // Ergebnisse nach Zeilennummer sortieren
      newMatches.sort((a, b) => a.line - b.line);
      
      setMatches(newMatches);
      setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
      
      // Treffer hervorheben und zum ersten scrollen
      if (newMatches.length > 0) {
        highlightMatches(newMatches);
        scrollToMatch(0);
        
        if (onSearchComplete) {
          onSearchComplete(newMatches.length);
        }
      } else {
        setError(`Keine Treffer für "${searchTerm}" gefunden`);
        if (onSearchComplete) {
          onSearchComplete(0);
        }
      }
    } catch (err: any) {
      console.error('Fehler bei der Suche:', err);
      setError(err.message || 'Fehler bei der Suche');
      if (onSearchComplete) onSearchComplete(0);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, options, onSearchComplete, clearHighlights, highlightMatches, scrollToMatch]);

  // Regex für die Suche erstellen
  const createSearchRegex = (term: string, options: SearchOptions): RegExp => {
    // Sonderzeichen escapen, wenn kein Regex verwendet wird
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Flags für die Regex setzen (i = case insensitive)
    const flags = options.caseSensitive ? 'g' : 'gi';
    
    // Ganzes Wort vs. Teilstring
    if (options.wholeWord) {
      return new RegExp(`\\b${escapedTerm}\\b`, flags);
    } else {
      return new RegExp(escapedTerm, flags);
    }
  };

  // Zum nächsten Treffer
  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  }, [matches, currentMatchIndex, scrollToMatch]);

  // Zum vorherigen Treffer
  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(prevIndex);
  }, [matches, currentMatchIndex, scrollToMatch]);

  // Suche starten bei Eingabe (verzögert)
  useEffect(() => {
    if (!isVisible || searchTerm.trim() === '') return;
    
    const timer = setTimeout(() => {
      performSearch();
    }, 300); // Verzögerung für bessere Performance
    
    return () => clearTimeout(timer);
  }, [searchTerm, isVisible, performSearch]);

  // Tab-Wechsel behandeln - neue Suche ausführen
  useEffect(() => {
    if (isVisible && searchTerm.trim()) {
      // Kurze Verzögerung für DOM-Aktualisierung
      setTimeout(performSearch, 50);
    }
  }, [activeTabIndex, isVisible, searchTerm, performSearch]);

  // Tastaturkürzel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      if (e.key === 'Escape') {
        onClose();
      }
      
      if (document.activeElement === inputRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) {
            goToPrevMatch();
          } else {
            goToNextMatch();
          }
        }
      }
      
      if (e.key === 'F3') {
        e.preventDefault();
        if (e.shiftKey) {
          goToPrevMatch();
        } else {
          goToNextMatch();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, goToNextMatch, goToPrevMatch, onClose]);

  // Focus-Handling
  useEffect(() => {
    if (isVisible && inputRef.current) {
      console.log("Trying to focus search input");
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log("Search input focused");
        }
      }, 10);
    }
  }, [isVisible]);

  // Cleanup beim Schließen
  useEffect(() => {
    if (!isVisible) {
      clearHighlights();
    }
  }, [isVisible, clearHighlights]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-2xl shadow-lg rounded-lg ${isVisible ? 'block' : 'hidden'} ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
    >
      <div className="flex flex-col p-3">
        {/* Suchleiste mit Eingabefeld und Controls */}
        <div className="flex items-center">
          <div className="relative flex-grow">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Text suchen..."
              className={`w-full px-3 py-2 text-sm rounded-l-md border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500' 
                  : 'border-gray-300 focus:border-blue-500'
              } outline-none`}
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
              disabled={isSearching || !searchTerm.trim()}
              className={`absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md ${
                isDarkMode 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500'
              }`}
            >
              {isSearching ? (
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
          
          {/* Steuerelemente */}
          <div className="flex items-center ml-2">
            <button 
              onClick={goToPrevMatch}
              disabled={matches.length === 0 || isSearching}
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
              disabled={matches.length === 0 || isSearching}
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
              {isSearching ? 'Suche...' : (matches.length > 0 ? `${currentMatchIndex + 1} von ${matches.length}` : 'Keine Treffer')}
            </span>
          </div>
        </div>
        
        {/* Erweiterte Suchoptionen */}
        <Transition
          show={showOptions}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <div className={`mt-2 p-2 rounded-md text-xs ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
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
                  checked={options.inKeys}
                  onChange={(e) => setOptions({...options, inKeys: e.target.checked})}
                  className="mr-1"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>In Schlüsseln</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.inValues}
                  onChange={(e) => setOptions({...options, inValues: e.target.checked})}
                  className="mr-1"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>In Werten</span>
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
            </div>
          </div>
        </Transition>
        
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
    </div>
  );
};

export default JsonSearch; 