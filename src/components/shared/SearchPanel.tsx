import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchPanelProps } from '../../types';

// Erweiterte Suchoptionen
interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  searchInKeys: boolean;
  highlightAll: boolean; // Neue Option zum Highlighten aller Fundstellen
  regexSearch: boolean;  // Neue Option für reguläre Ausdrücke
}

// Erweitertes Suchergebnis mit mehr Kontext
interface SearchMatch {
  node: HTMLElement;
  matchText: string;
  lineNumber?: number;
  context?: string;       // Zeigt Text um den Fund herum
  isPartialMatch?: boolean; // Kennzeichnet Treffer in Teilwörtern
}

const SearchPanel: React.FC<SearchPanelProps> = ({ 
  contentType, 
  targetRef, 
  isDarkMode,
  onSearch 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    searchInKeys: true,
    highlightAll: false,
    regexSearch: false
  });
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const originalContentRef = useRef<string>('');
  const currentMatches = useRef<SearchMatch[]>([]);
  
  // Speichere den originalen Inhalt beim ersten Laden
  useEffect(() => {
    if (targetRef.current && !originalContentRef.current) {
      originalContentRef.current = targetRef.current.innerHTML;
      console.log(`SearchPanel: Originalinhalt für ${contentType} gespeichert (${originalContentRef.current.length} Bytes)`);
    }
  }, [targetRef, contentType]);
  
  // Hilfsfunktion zum Escape von Regex-Zeichen
  const escapeRegExp = useCallback((string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);
  
  // Entferne alle Highlights
  const resetHighlights = useCallback(() => {
    if (!targetRef.current) return;
    
    try {
      // Entferne aktuelle Highlights - sowohl current-match als auch search-match
      const currentHighlights = targetRef.current.querySelectorAll('.current-match');
      currentHighlights.forEach(el => {
        if (el instanceof HTMLElement) {
          el.classList.remove('current-match');
          el.removeAttribute('style');
        }
      });
      
      const searchHighlights = targetRef.current.querySelectorAll('.search-match');
      searchHighlights.forEach(el => {
        if (el instanceof HTMLElement) {
          el.classList.remove('search-match');
          el.removeAttribute('style');
        }
      });
      
      // Stelle Originalinhalt wieder her, wenn in einer neuen Suche
      if (originalContentRef.current && (searchTerm === '' || error)) {
        targetRef.current.innerHTML = originalContentRef.current;
      }
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Highlights:', error);
    }
  }, [targetRef, searchTerm, error]);
  
  // Extrahiere Kontext um den Suchbegriff herum
  const getContext = useCallback((text: string, term: string): string => {
    if (!text || !term) return '';
    
    try {
      const termIndex = options.caseSensitive 
        ? text.indexOf(term)
        : text.toLowerCase().indexOf(term.toLowerCase());
      
      if (termIndex === -1) return text.slice(0, 50) + '...'; // Fallback
      
      const contextStart = Math.max(0, termIndex - 30);
      const contextEnd = Math.min(text.length, termIndex + term.length + 30);
      let context = text.slice(contextStart, contextEnd);
      
      if (contextStart > 0) context = '...' + context;
      if (contextEnd < text.length) context = context + '...';
      
      return context;
    } catch (e) {
      return text.slice(0, 50) + '...';
    }
  }, [options.caseSensitive]);
  
  // Highlight ein bestimmtes Match
  const highlightMatch = useCallback((index: number, matchList: SearchMatch[]) => {
    if (!matchList.length) return;
    
    try {
      // Entferne nur das current-match highlighting, behalte andere highlights wenn highlightAll aktiv ist
      const currentHighlighted = document.querySelectorAll('.current-match');
      currentHighlighted.forEach(el => {
        if (el instanceof HTMLElement) {
          el.classList.remove('current-match');
          if (!el.classList.contains('search-match') && options.highlightAll) {
            el.classList.add('search-match');
            el.style.backgroundColor = isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)';
          } else {
            el.removeAttribute('style');
          }
        }
      });
      
      // Highlighte das aktuelle Match
      const match = matchList[index];
      match.node.classList.add('current-match');
      match.node.style.backgroundColor = isDarkMode ? '#ef4444' : '#f87171';
      match.node.style.color = 'white';
      match.node.style.padding = '2px';
      match.node.style.borderRadius = '2px';
      match.node.style.outline = isDarkMode ? '1px solid white' : '1px solid #ef4444';
      
      // Scrolle zum Match mit besserer Positionierung
      match.node.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      // Aktualisiere den Index
      setCurrentMatchIndex(index);
    } catch (error) {
      console.error('Fehler beim Hervorheben:', error);
    }
  }, [isDarkMode, options.highlightAll]);
  
  // Highlight alle Matches auf einmal
  const highlightAllMatches = useCallback((matchList: SearchMatch[]) => {
    if (!matchList.length || !options.highlightAll) return;
    
    try {
      matchList.forEach(match => {
        if (!match.node.classList.contains('current-match')) {
          match.node.classList.add('search-match');
          match.node.style.backgroundColor = isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)';
          match.node.style.padding = '2px';
          match.node.style.borderRadius = '2px';
        }
      });
    } catch (error) {
      console.error('Fehler beim Hervorheben aller Treffer:', error);
    }
  }, [isDarkMode, options.highlightAll]);
  
  // Textfragmente auch in zusammengesetzten Wörtern suchen
  const findPartialMatches = useCallback((text: string, term: string, caseSensitive: boolean): boolean => {
    if (!term || !text) return false;
    
    // Spezialfall für Bindestriche und Unterstriche, um technische Begriffe zu finden
    if (text.includes('-') || text.includes('_')) {
      const parts = text.split(/[-_]/);
      return parts.some(part => 
        caseSensitive ? part.includes(term) : part.toLowerCase().includes(term.toLowerCase())
      );
    }
    
    // Für camelCase und PascalCase (z.B. findBid in findBidRequest)
    const camelCaseRegex = caseSensitive
      ? new RegExp(`[A-Z]?${escapeRegExp(term)}(?:[A-Z]|$)`)
      : new RegExp(`[A-Z]?${escapeRegExp(term)}(?:[A-Z]|$)`, 'i');
    
    if (camelCaseRegex.test(text)) {
      return true;
    }
    
    // Direkte Teilstring-Suche als Fallback
    return caseSensitive
      ? text.includes(term)
      : text.toLowerCase().includes(term.toLowerCase());
  }, [escapeRegExp]);
  
  // Verbesserte Sammlung von Textelementen
  const collectTextElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const elements: HTMLElement[] = [];
    const visited = new Set<HTMLElement>(); // Vermeidet Duplikate
    
    // Walk the DOM tree to find all text-containing elements
    const walkDOM = (node: HTMLElement) => {
      // Skip search panel elements
      if (
        node.closest('.search-panel-container') || 
        node.classList.contains('search-match') ||
        node.classList.contains('current-match')
      ) {
        return;
      }
      
      // Avoid processing the same node twice
      if (visited.has(node)) return;
      visited.add(node);
      
      // Prüfe auf relevante Inhalte oder Attribute
      const textContent = node.textContent?.trim();
      
      if (textContent) {
        // Prüfe auf verschiedene Arten von Elementen mit Text
        const isTextNode = node.childNodes.length === 1 && node.firstChild?.nodeType === Node.TEXT_NODE;
        const hasDataAttributes = node.hasAttribute('data-key') || 
                                 node.hasAttribute('data-value') || 
                                 node.hasAttribute('data-path');
        
        const isKey = node.classList.contains('json-key') || 
                      node.getAttribute('data-type') === 'key';
        
        // In JSON-Schlüsseln nur suchen, wenn die Option aktiviert ist
        if ((isTextNode || hasDataAttributes) && (!isKey || options.searchInKeys)) {
          elements.push(node);
        }
      }
      
      // Rekursiv durch alle Kindelemente gehen
      Array.from(node.children).forEach(child => {
        if (child instanceof HTMLElement) {
          walkDOM(child);
        }
      });
    };
    
    // Starte die Traversierung vom Container aus
    walkDOM(container);
    
    // Zusätzliche Prüfung für Elemente mit data-Attributen, die keinen Text enthalten
    container.querySelectorAll('[data-key], [data-value], [data-path]').forEach(element => {
      if (element instanceof HTMLElement && !visited.has(element)) {
        visited.add(element);
        elements.push(element);
      }
    });
    
    return elements;
  }, [options.searchInKeys]);
  
  // Erweiterte Suche in Elementen
  const searchInElements = useCallback((elements: HTMLElement[], term: string): SearchMatch[] => {
    if (!term.trim()) return [];
    
    const results: SearchMatch[] = [];
    let pattern: RegExp | null = null;
    
    try {
      // Für reguläre Ausdrücke
      if (options.regexSearch) {
        try {
          pattern = new RegExp(term, options.caseSensitive ? '' : 'i');
        } catch (e) {
          console.error('Invalid regex pattern:', e);
          setError(`Ungültiger regulärer Ausdruck: ${term}`);
          return [];
        }
      } else {
        // Für normale Suche
        const escapedTerm = escapeRegExp(term);
        const flags = options.caseSensitive ? '' : 'i';
        
        if (options.wholeWord) {
          pattern = new RegExp(`\\b${escapedTerm}\\b`, flags);
        } else {
          pattern = new RegExp(escapedTerm, flags);
        }
      }
      
      // Durchsuche alle Elemente
      elements.forEach(element => {
        // 1. Textinhalt für die Suche sammeln
        const textContent = element.textContent?.trim() || '';
        
        // 2. Daten-Attribute hinzufügen
        let attributeContent = '';
        ['data-key', 'data-value', 'data-path'].forEach(attr => {
          const attrValue = element.getAttribute(attr);
          if (attrValue) {
            attributeContent += ' ' + attrValue;
          }
        });
        
        // Kompletter durchsuchbarer Text
        const searchableText = (textContent + ' ' + attributeContent).trim();
        
        // Regex-basierte Suche
        if (pattern && searchableText && pattern.test(searchableText)) {
          // Bestimme die Zeilennummer, falls vorhanden
          let lineNumber: number | undefined;
          const lineElement = element.closest('tr');
          if (lineElement && lineElement.firstChild && lineElement.firstChild.textContent) {
            const lineText = lineElement.firstChild.textContent.trim();
            const parsedLine = parseInt(lineText, 10);
            if (!isNaN(parsedLine)) {
              lineNumber = parsedLine;
            }
          }
          
          // Füge das Match hinzu
          results.push({
            node: element,
            matchText: searchableText,
            lineNumber,
            context: getContext(searchableText, term),
            isPartialMatch: false
          });
        } 
        // Zusätzliche Suche für Teilwörter, wenn keine ganze Wortübereinstimmung gefunden wurde
        else if (!options.wholeWord && !options.regexSearch && pattern && !pattern.test(searchableText)) {
          if (findPartialMatches(searchableText, term, options.caseSensitive)) {
            let lineNumber: number | undefined;
            const lineElement = element.closest('tr');
            if (lineElement && lineElement.firstChild && lineElement.firstChild.textContent) {
              const lineText = lineElement.firstChild.textContent.trim();
              const parsedLine = parseInt(lineText, 10);
              if (!isNaN(parsedLine)) {
                lineNumber = parsedLine;
              }
            }
            
            results.push({
              node: element,
              matchText: searchableText,
              lineNumber,
              context: getContext(searchableText, term),
              isPartialMatch: true
            });
          }
        }
      });
      
      // Sortiere nach Zeilennummer und dann nach partiellem Match
      return results.sort((a, b) => {
        // Priorisiere exakte Treffer vor Teiltreffer
        if ((a.isPartialMatch === true) !== (b.isPartialMatch === true)) {
          return a.isPartialMatch ? 1 : -1;
        }
        
        // Dann nach Zeilennummer sortieren
        if (a.lineNumber !== undefined && b.lineNumber !== undefined) {
          return a.lineNumber - b.lineNumber;
        }
        
        return 0;
      });
    } catch (error) {
      console.error('Fehler bei der Suche in Elementen:', error);
      return [];
    }
  }, [options.caseSensitive, options.wholeWord, options.regexSearch, escapeRegExp, findPartialMatches, getContext]);
  
  // Verbesserte Suchlogik mit Progress-Feedback
  const performSearch = useCallback(() => {
    const container = targetRef.current;
    if (!container || !searchTerm.trim()) {
      setMatches([]);
      setMatchCount(0);
      setCurrentMatchIndex(0);
      setError(null);
      resetHighlights();
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Stelle den Originalinhalt wieder her, um vorherige Suchergebnisse zu entfernen
      resetHighlights();
      
      // Verwende requestIdleCallback oder setTimeout, um die UI nicht zu blockieren
      setTimeout(() => {
        try {
          // Sammle alle Textelemente im Container
          const allTextElements = collectTextElements(container);
          console.log(`Gefundene Textelemente: ${allTextElements.length}`);
          
          // Suche in diesen Elementen
          const newMatches = searchInElements(allTextElements, searchTerm);
          console.log(`Gefundene Übereinstimmungen: ${newMatches.length}`);
          
          // Aktualisiere Zustände
          currentMatches.current = newMatches;
          setMatches(newMatches);
          setMatchCount(newMatches.length);
          
          if (newMatches.length === 0) {
            setError(`Keine Treffer für "${searchTerm}" gefunden`);
            setCurrentMatchIndex(0);
          } else {
            if (options.highlightAll) {
              highlightAllMatches(newMatches);
            }
            highlightMatch(0, newMatches);
            if (onSearch) onSearch(searchTerm);
          }
        } catch (error: any) {
          console.error('Fehler bei der Suche:', error);
          setError(`Fehler bei der Suche: ${error.message}`);
          resetHighlights();
        } finally {
          setIsSearching(false);
        }
      }, 50);
    } catch (error: any) {
      console.error('Fehler bei der Suche-Initialisierung:', error);
      setError(`Fehler bei der Suche: ${error.message}`);
      resetHighlights();
      setIsSearching(false);
    }
  }, [
    searchTerm, 
    targetRef, 
    onSearch, 
    resetHighlights, 
    collectTextElements, 
    searchInElements, 
    highlightMatch, 
    highlightAllMatches,
    options.highlightAll
  ]);
  
  // Nächste/vorherige Übereinstimmung
  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    highlightMatch(nextIndex, matches);
  }, [matches, currentMatchIndex, highlightMatch]);
  
  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    highlightMatch(prevIndex, matches);
  }, [matches, currentMatchIndex, highlightMatch]);
  
  // Verzögerte Suche bei Änderung der Suche oder Optionen
  useEffect(() => {
    if (!targetRef.current) return;
    
    if (!searchTerm.trim()) {
      resetHighlights();
      setMatches([]);
      setMatchCount(0);
      setCurrentMatchIndex(0);
      setError(null);
      return;
    }
    
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, performSearch, resetHighlights, targetRef, options]);
  
  // Fokussiere das Suchfeld beim Laden
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);
  
  // Tastaturkürzel für die Suche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === searchInputRef.current) {
        if (e.key === 'Enter') {
          if (e.shiftKey) {
            goToPrevMatch();
          } else {
            goToNextMatch();
          }
        } else if (e.key === 'Escape') {
          setSearchTerm('');
        } else if (e.key === 'F3' || (e.key === 'g' && e.ctrlKey)) {
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
  }, [goToNextMatch, goToPrevMatch]);
  
  return (
    <div className={`search-panel-container flex flex-col p-2 mb-2 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
      {/* Eingabefeld mit Buttons */}
      <div className="flex items-center">
        <div className="relative flex-grow">
          <div className="flex">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`${options.regexSearch ? 'Regex' : 'Text'} in ${contentType} suchen...`}
              className={`w-full px-2 py-1 text-sm rounded-l-md border-l border-t border-b outline-none ${
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
            <button
              onClick={performSearch}
              disabled={isSearching || !searchTerm.trim()}
              className={`px-2 py-1 rounded-r-md border-r border-t border-b ${
                isDarkMode 
                  ? 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:border-gray-600' 
                  : 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300'
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
        </div>
        
        <div className="flex items-center ml-2">
          <button 
            onClick={goToPrevMatch}
            disabled={matchCount === 0 || isSearching}
            className={`p-1 rounded-md ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-600 disabled:text-gray-500' 
                : 'text-gray-600 hover:bg-gray-200 disabled:text-gray-400'
            }`}
            title="Vorheriger Treffer (Shift+Enter oder Shift+F3)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          <button
            onClick={goToNextMatch}
            disabled={matchCount === 0 || isSearching}
            className={`p-1 rounded-md ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-600 disabled:text-gray-500' 
                : 'text-gray-600 hover:bg-gray-200 disabled:text-gray-400'
            }`}
            title="Nächster Treffer (Enter oder F3)"
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
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          
          <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {isSearching ? 'Suche...' : (matchCount > 0 ? `${currentMatchIndex + 1} von ${matchCount}` : 'Keine Treffer')}
          </span>
        </div>
      </div>
      
      {/* Erweiterte Optionen */}
      {showOptions && (
        <div className={`mt-2 p-2 rounded-md text-xs ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
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
    </div>
  );
};

export default SearchPanel;