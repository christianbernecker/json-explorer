import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchPanelProps } from '../../types';

// Erweiterte Suchoptionen
interface SearchOptions {
  caseSensitive: boolean;
  useRegex: boolean;
  searchInKeys: boolean;
  wholeWord: boolean;
}

// Suchergebnis-Typ
interface SearchResult {
  match: string;
  element: HTMLElement;
  line?: number;
  context?: string;
  isKey?: boolean;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ 
  contentType, 
  targetRef, 
  isDarkMode,
  onSearch 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    useRegex: false,
    searchInKeys: true,
    wholeWord: false
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const originalContent = useRef<string>('');
  
  // Helper für Regex-Escape
  const escapeRegExp = useCallback((string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);

  // Erstelle den Suchausdruck basierend auf den Optionen
  const createSearchPattern = useCallback((term: string): RegExp => {
    if (!term) return new RegExp('');
    
    let pattern = term;
    
    // Wenn kein Regex verwendet wird, escape die Sonderzeichen
    if (!options.useRegex) {
      pattern = escapeRegExp(pattern);
    }
    
    // Für Ganzwort-Suche
    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    
    // Erstelle RegExp mit entsprechenden Flags
    return new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
  }, [options.useRegex, options.caseSensitive, options.wholeWord, escapeRegExp]);

  // Speichere den originalen Inhalt beim ersten Laden
  useEffect(() => {
    if (targetRef.current && !originalContent.current) {
      try {
        originalContent.current = targetRef.current.innerHTML;
        console.log(`SearchPanel: Originalinhalt für ${contentType} gespeichert, Größe: ${originalContent.current.length}`);
      } catch (error) {
        console.error(`SearchPanel: Fehler beim Speichern des Originalinhalts:`, error);
      }
    }
  }, [targetRef, contentType]);

  // Entferne alle Highlights mit verbesserter Fehlerbehandlung
  const clearHighlights = useCallback(() => {
    if (!targetRef.current) {
      console.warn(`SearchPanel: targetRef ist nicht initialisiert, Highlights können nicht entfernt werden`);
      return;
    }
    
    if (error || matches.length === 0) {
      if (originalContent.current) {
        try {
          targetRef.current.innerHTML = originalContent.current;
          console.log(`SearchPanel: Originalinhalt für ${contentType} wiederhergestellt`);
        } catch (err) {
          console.error(`SearchPanel: Fehler beim Wiederherstellen des Originalinhalts:`, err);
        }
      }
      setError(null);
      return;
    }
    
    try {
      // Entferne bestehende Highlights
      const existingMatches = targetRef.current.querySelectorAll('.search-match');
      existingMatches.forEach(match => {
        if (match.parentNode) {
          const parent = match.parentNode;
          const textContent = match.textContent || '';
          const textNode = document.createTextNode(textContent);
          parent.replaceChild(textNode, match);
        }
      });
      
      // Entferne das aktuelle Highlight
      const currentMatch = targetRef.current.querySelector('.current-match');
      if (currentMatch) {
        currentMatch.classList.remove('current-match');
      }
    } catch (err) {
      console.error('Fehler beim Entfernen der Hervorhebungen:', err);
      if (originalContent.current && targetRef.current) {
        try {
          targetRef.current.innerHTML = originalContent.current;
        } catch (restoreErr) {
          console.error('Konnte Originalinhalt nicht wiederherstellen:', restoreErr);
        }
      }
    }
  }, [targetRef, error, matches.length, contentType]);

  // Aktuelle Übereinstimmung hervorheben und zu ihr scrollen
  const highlightMatch = useCallback((index: number, matchElements: SearchResult[]) => {
    if (!matchElements.length) return;
    
    try {
      // Reset das vorherige aktuelle Element
      matchElements.forEach(result => {
        const element = result.element;
        element.classList.remove('current-match');
        element.style.backgroundColor = isDarkMode ? '#3b82f680' : '#93c5fd80';
        element.style.color = isDarkMode ? 'white' : 'black';
        element.style.padding = '';
        element.style.borderRadius = '';
        element.style.outline = '';
      });
      
      // Markiere das neue Element mit verbessertem Styling
      const match = matchElements[index].element;
      match.classList.add('current-match');
      
      // Auffälligeres Highlighting für bessere Sichtbarkeit
      match.style.backgroundColor = isDarkMode ? '#ef4444' : '#f87171';
      match.style.color = 'white';
      match.style.padding = '2px';
      match.style.borderRadius = '2px';
      match.style.outline = isDarkMode ? '1px solid white' : '1px solid #ef4444';
      
      // Verbesserte Scroll-Position: mit mehr Kontext
      const scrollContainer = match.closest('.overflow-auto') || match.closest('[style*="overflow"]');
      
      if (scrollContainer) {
        // Berechne eine bessere Scroll-Position, die mehr Kontext zeigt
        const containerHeight = scrollContainer.clientHeight;
        const matchRect = match.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        const relativeTop = matchRect.top - containerRect.top;
        const scrollOffset = relativeTop - (containerHeight * 0.4); // 40% von oben
        
        scrollContainer.scrollBy({
          top: scrollOffset,
          behavior: 'smooth'
        });
      } else {
        // Fallback, falls kein Scroll-Container gefunden wird
        match.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      
      setCurrentMatchIndex(index);
    } catch (err) {
      console.error('Fehler beim Hervorheben des Treffers:', err);
      setError('Fehler beim Hervorheben der Treffer');
    }
  }, [isDarkMode]);

  // Hilfsfunktion für Zeilennummer in useCallback verpackt
  const getLineNumber = useCallback((element: HTMLElement): number => {
    const row = element.closest('tr');
    if (row && row.firstChild && row.firstChild.textContent) {
      const num = parseInt(row.firstChild.textContent.trim(), 10);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }, []);

  // Neue verbesserte Volltextsuche - kombiniert für JSON und andere Inhalte
  const indexContentForSearch = useCallback((container: HTMLElement, pattern: RegExp): SearchResult[] => {
    const results: SearchResult[] = [];
    
    // 1. Erzeugen einer flachen Liste aller Textknoten
    const getAllTextNodes = (node: Node): Text[] => {
      const textNodes: Text[] = [];
      
      const traverse = (n: Node) => {
        // Ignoriere Suchpanel selbst
        if (n instanceof HTMLElement && 
            (n.classList.contains('search-panel-container') || 
             n.classList.contains('search-match'))) {
          return;
        }
        
        if (n.nodeType === Node.TEXT_NODE && n.textContent && n.textContent.trim()) {
          textNodes.push(n as Text);
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          for (let i = 0; i < n.childNodes.length; i++) {
            traverse(n.childNodes[i]);
          }
        }
      };
      
      traverse(node);
      return textNodes;
    };
    
    // 2. Spezielle Indexierung für JSON-Attribute
    const indexJsonAttributes = () => {
      // Finde alle Attribute, die für JSON wichtig sein könnten
      const jsonElems = container.querySelectorAll('[data-key], [data-value], [data-path], .json-key, .json-value');
      
      jsonElems.forEach(elem => {
        const element = elem as HTMLElement;
        const isKey = element.classList.contains('json-key') || 
                     element.hasAttribute('data-key') || 
                     element.getAttribute('data-type') === 'key';
        
        // Nur in Schlüsseln suchen, wenn die Option aktiviert ist
        if (isKey && !options.searchInKeys) return;
        
        // Suche in Attributen und Textinhalt
        let searchTargets: string[] = [];
        
        // Textinhalt hinzufügen
        if (element.textContent) {
          searchTargets.push(element.textContent);
        }
        
        // Attribute hinzufügen
        ['data-key', 'data-value', 'data-path'].forEach(attr => {
          const attrValue = element.getAttribute(attr);
          if (attrValue) searchTargets.push(attrValue);
        });
        
        // Überprüfen, ob einer der Targets dem Suchmuster entspricht
        searchTargets.forEach(target => {
          pattern.lastIndex = 0; // Reset für jede Suche
          if (pattern.test(target)) {
            const span = document.createElement('span');
            span.className = 'search-match';
            span.style.backgroundColor = isDarkMode ? '#3b82f680' : '#93c5fd80';
            span.style.color = isDarkMode ? 'white' : 'black';
            
            // Kopiere den Inhalt des Elements
            const originalContent = element.innerHTML;
            span.innerHTML = originalContent;
            
            // Ersetze den Inhalt des Elements
            element.innerHTML = '';
            element.appendChild(span);
            
            results.push({
              match: target.match(pattern)?.[0] || target,
              element: span,
              context: target,
              line: getLineNumber(element),
              isKey
            });
          }
        });
      });
    };
    
    // 3. Allgemeine Textsuche in normalen Textknoten
    const searchTextNodes = () => {
      const textNodes = getAllTextNodes(container);
      
      textNodes.forEach(textNode => {
        const text = textNode.textContent || '';
        pattern.lastIndex = 0;
        
        let match = pattern.exec(text);
        if (match) {
          // Erstelle ein Fragment für die Ersetzung
          const fragment = document.createDocumentFragment();
          
          // Text vor dem Match
          if (match.index > 0) {
            fragment.appendChild(document.createTextNode(text.substring(0, match.index)));
          }
          
          // Highlight-Element
          const span = document.createElement('span');
          span.className = 'search-match';
          span.style.backgroundColor = isDarkMode ? '#3b82f680' : '#93c5fd80';
          span.style.color = isDarkMode ? 'white' : 'black';
          span.textContent = match[0];
          fragment.appendChild(span);
          
          // Text nach dem Match
          if (match.index + match[0].length < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(match.index + match[0].length)));
          }
          
          // Element, das den Textknoten enthält
          const parentElement = textNode.parentElement as HTMLElement;
          
          // Überprüfe, ob es sich um einen JSON-Schlüssel handelt
          const isKey = parentElement?.classList.contains('json-key') || 
                        parentElement?.getAttribute('data-type') === 'key';
          
          // Nur hinzufügen, wenn es kein Schlüssel ist oder Keys durchsucht werden sollen
          if (!isKey || options.searchInKeys) {
            // Ersetze den Textknoten mit dem Fragment
            if (textNode.parentNode) {
              textNode.parentNode.replaceChild(fragment, textNode);
              
              // Füge das Ergebnis hinzu
              results.push({
                match: match[0],
                element: span,
                context: text.substring(
                  Math.max(0, match.index - 20), 
                  Math.min(text.length, match.index + match[0].length + 20)
                ),
                line: getLineNumber(parentElement),
                isKey
              });
            }
          }
        }
      });
    };
    
    // Führe beide Suchtypen durch
    if (contentType === 'JSON') {
      indexJsonAttributes(); // Spezifisch für JSON
    }
    searchTextNodes(); // Immer durchführen
    
    // Sortiere nach Zeilennummern
    return results.sort((a, b) => {
      if (a.line !== undefined && b.line !== undefined) {
        return a.line - b.line;
      }
      return 0;
    });
  }, [getLineNumber, isDarkMode, options.searchInKeys, contentType]);

  // Durchführung der Suche mit verbesserter Fehlerbehandlung
  const performSearch = useCallback(() => {
    if (!targetRef.current || !searchTerm) {
      clearHighlights();
      setMatchCount(0);
      setCurrentMatchIndex(0);
      setMatches([]);
      setError(null);
      return;
    }
    
    // In Such-Historie speichern
    if (!searchHistory.includes(searchTerm)) {
      setSearchHistory(prev => [searchTerm, ...prev.slice(0, 9)]);
    }
    setHistoryIndex(-1);
    
    if (onSearch) {
      onSearch(searchTerm);
    }
    
    try {
      // Aktuellen Inhalt speichern, falls noch nicht getan
      if (!originalContent.current) {
        originalContent.current = targetRef.current.innerHTML;
      } else {
        // Stelle den Originalinhalt wieder her, bevor neue Suche durchgeführt wird
        targetRef.current.innerHTML = originalContent.current;
      }
      
      // Bestehende Highlights löschen
      clearHighlights();
      setError(null);
      setMatches([]);
      
      const pattern = createSearchPattern(searchTerm);
      console.log(`SearchPanel: Suche nach "${searchTerm}" in ${contentType}`);
      
      // Durchführen der optimierten Suche
      const results = indexContentForSearch(targetRef.current, pattern);
      
      console.log(`SearchPanel: ${results.length} Treffer gefunden`);
      setMatches(results);
      setMatchCount(results.length);
      
      if (results.length > 0) {
        highlightMatch(0, results);
      } else {
        setError(`Keine Treffer für "${searchTerm}" gefunden`);
      }
    } catch (err: any) {
      console.error('Fehler bei der Suche:', err);
      setError(`Fehler bei der Suche: ${err.message}`);
      if (originalContent.current && targetRef.current) {
        try {
          targetRef.current.innerHTML = originalContent.current;
        } catch (restoreErr) {
          console.error('Konnte Originalinhalt nicht wiederherstellen:', restoreErr);
        }
      }
    }
  }, [
    targetRef,
    searchTerm,
    searchHistory,
    onSearch,
    clearHighlights,
    createSearchPattern,
    contentType,
    indexContentForSearch,
    highlightMatch
  ]);

  // Suchfeld beim Laden fokussieren
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Debounced Suche bei Änderungen
  useEffect(() => {
    if (!searchTerm || !targetRef.current) {
      clearHighlights();
      setMatchCount(0);
      setCurrentMatchIndex(0);
      return;
    }
    
    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, clearHighlights, performSearch, targetRef, options]);

  // Zur nächsten Übereinstimmung navigieren
  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    highlightMatch(nextIndex, matches);
  }, [currentMatchIndex, highlightMatch, matches]);

  // Zur vorherigen Übereinstimmung navigieren
  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    highlightMatch(prevIndex, matches);
  }, [currentMatchIndex, highlightMatch, matches]);

  // Tastatur-Navigationsfunktionen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Nur reagieren, wenn das Suchfeld fokussiert ist
      if (document.activeElement === searchInputRef.current) {
        if (e.key === 'Enter') {
          if (e.shiftKey) {
            goToPrevMatch();
          } else {
            goToNextMatch();
          }
        } else if (e.key === 'Escape') {
          // Suchfeld leeren
          setSearchTerm('');
          clearHighlights();
        } else if (e.key === 'ArrowUp' && e.altKey) {
          // In der Such-Historie zurückgehen
          e.preventDefault();
          if (searchHistory.length > 0 && historyIndex < searchHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setSearchTerm(searchHistory[newIndex]);
          }
        } else if (e.key === 'ArrowDown' && e.altKey) {
          // In der Such-Historie vorwärtsgehen
          e.preventDefault();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setSearchTerm(searchHistory[newIndex]);
          } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setSearchTerm('');
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearHighlights, goToNextMatch, goToPrevMatch, searchHistory, historyIndex]);

  return (
    <div className={`flex flex-col p-2 mb-2 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
      {/* Sucheingabe mit Historie und Optionen */}
      <div className="flex items-center">
        <div className="relative flex-grow">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Suchen in ${contentType}...`}
            className={`w-full px-2 py-1 text-sm rounded-md border outline-none ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-gray-200 focus:border-blue-500' 
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
          {searchHistory.length > 0 && (
            <button 
              onClick={() => setHistoryIndex(0)}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Suchverlauf anzeigen (Alt+↑/↓)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex items-center ml-2">
          <button 
            onClick={goToPrevMatch}
            disabled={matchCount === 0}
            className={`p-1 rounded-md ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-600 disabled:text-gray-500' 
                : 'text-gray-600 hover:bg-gray-200 disabled:text-gray-400'
            }`}
            title="Vorheriger Treffer (Shift+Enter)"
            aria-label="Vorheriger Treffer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          <button
            onClick={goToNextMatch}
            disabled={matchCount === 0}
            className={`p-1 rounded-md ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-600 disabled:text-gray-500' 
                : 'text-gray-600 hover:bg-gray-200 disabled:text-gray-400'
            }`}
            title="Nächster Treffer (Enter)"
            aria-label="Nächster Treffer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            aria-label="Suchoptionen anzeigen/ausblenden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          
          <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {matchCount > 0 ? `${currentMatchIndex + 1} von ${matchCount}` : 'Keine Treffer'}
          </span>
        </div>
      </div>
      
      {/* Erweiterte Suchoptionen */}
      {showOptions && (
        <div className={`mt-2 p-2 rounded-md text-xs ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.caseSensitive}
                onChange={(e) => setOptions({...options, caseSensitive: e.target.checked})}
                className="mr-1"
              />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Groß-/Kleinschreibung beachten</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.useRegex}
                onChange={(e) => setOptions({...options, useRegex: e.target.checked})}
                className="mr-1"
              />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Reguläre Ausdrücke</span>
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
            
            {contentType === 'JSON' && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.searchInKeys}
                  onChange={(e) => setOptions({...options, searchInKeys: e.target.checked})}
                  className="mr-1"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>In Schlüsseln suchen</span>
              </label>
            )}
          </div>
        </div>
      )}
      
      {/* Fehlermeldung */}
      {error && (
        <div className={`mt-2 text-xs p-1 rounded ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-600'}`}>
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchPanel;