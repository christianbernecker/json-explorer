import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchPanelProps } from '../../types';

// Einfachere Suchoptionen
interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  searchInKeys: boolean;
}

// Suchergebnis-Typ
interface SearchMatch {
  node: HTMLElement;
  matchText: string;
  lineNumber?: number;
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
    searchInKeys: true
  });

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
      // Entferne aktuelle Highlights
      const highlights = targetRef.current.querySelectorAll('.current-match');
      highlights.forEach(el => {
        el.classList.remove('current-match');
        el.removeAttribute('style');
      });
      
      // Stelle Originalinhalt wieder her, wenn in einer neuen Suche
      if (originalContentRef.current && (searchTerm === '' || error)) {
        targetRef.current.innerHTML = originalContentRef.current;
      }
    } catch (error) {
      console.error('Fehler beim Zurücksetzen der Highlights:', error);
    }
  }, [targetRef, searchTerm, error]);
  
  // Highlight ein bestimmtes Match
  const highlightMatch = useCallback((index: number, matchList: SearchMatch[]) => {
    if (!matchList.length) return;
    
    try {
      // Entferne alle aktuellen Highlights
      const allHighlighted = document.querySelectorAll('.current-match');
      allHighlighted.forEach(el => {
        el.classList.remove('current-match');
        el.removeAttribute('style');
      });
      
      // Highlighte das aktuelle Match
      const match = matchList[index];
      match.node.classList.add('current-match');
      match.node.style.backgroundColor = isDarkMode ? '#ef4444' : '#f87171';
      match.node.style.color = 'white';
      match.node.style.padding = '2px';
      match.node.style.borderRadius = '2px';
      match.node.style.outline = isDarkMode ? '1px solid white' : '1px solid #ef4444';
      
      // Scrolle zum Match
      match.node.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
      // Aktualisiere den Index
      setCurrentMatchIndex(index);
    } catch (error) {
      console.error('Fehler beim Hervorheben:', error);
    }
  }, [isDarkMode]);
  
  // Sammle alle Text-relevanten Elemente
  const collectTextElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const elements: HTMLElement[] = [];
    
    // Suche nach allen Elementen mit Text oder relevanten Attributen
    container.querySelectorAll('*').forEach(element => {
      if (element instanceof HTMLElement) {
        // Ignoriere Elemente innerhalb des Suchpanels selbst
        if (
          element.closest('.search-panel-container') || 
          element.classList.contains('search-match') ||
          element.classList.contains('current-match')
        ) {
          return;
        }
        
        // Prüfe, ob das Element Text enthält oder relevante Attribute hat
        const hasText = element.innerText && element.innerText.trim() !== '';
        const hasDataAttributes = element.hasAttribute('data-key') || 
                                 element.hasAttribute('data-value') || 
                                 element.hasAttribute('data-path');
        
        // Prüfe ob es ein JSON-Schlüssel ist
        const isKey = element.classList.contains('json-key') || 
                     element.getAttribute('data-type') === 'key';
        
        if ((hasText || hasDataAttributes) && (!isKey || options.searchInKeys)) {
          elements.push(element);
        }
      }
    });
    
    return elements;
  }, [options.searchInKeys]);
  
  // Suche innerhalb der gesammelten Elemente
  const searchInElements = useCallback((elements: HTMLElement[], term: string): SearchMatch[] => {
    const results: SearchMatch[] = [];
    const flags = options.caseSensitive ? '' : 'i';
    let pattern: RegExp;
    
    // Erstelle ein passendes RegExp-Objekt
    if (options.wholeWord) {
      pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, flags);
    } else {
      pattern = new RegExp(escapeRegExp(term), flags);
    }
    
    elements.forEach(element => {
      // Der Text, in dem gesucht wird
      let searchableText = '';
      
      // 1. Suche in sichtbarem Text
      if (element.innerText && element.innerText.trim()) {
        searchableText = element.innerText;
      }
      
      // 2. Suche auch in Daten-Attributen
      ['data-key', 'data-value', 'data-path'].forEach(attr => {
        const attrValue = element.getAttribute(attr);
        if (attrValue) {
          searchableText += ' ' + attrValue;
        }
      });
      
      // Führe die Suche durch
      if (searchableText && pattern.test(searchableText)) {
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
          lineNumber
        });
      }
    });
    
    // Sortiere nach Zeilennummer, falls vorhanden
    return results.sort((a, b) => {
      if (a.lineNumber !== undefined && b.lineNumber !== undefined) {
        return a.lineNumber - b.lineNumber;
      }
      return 0;
    });
  }, [options.caseSensitive, options.wholeWord, escapeRegExp]);
  
  // Durchführe die Suche mit einer einfacheren und direkteren Methode
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
    
    try {
      // Stelle den Originalinhalt wieder her, um vorherige Suchergebnisse zu entfernen
      resetHighlights();
      
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
        highlightMatch(0, newMatches);
        if (onSearch) onSearch(searchTerm);
      }
    } catch (error: any) {
      console.error('Fehler bei der Suche:', error);
      setError(`Fehler bei der Suche: ${error.message}`);
      resetHighlights();
    }
  }, [searchTerm, targetRef, onSearch, resetHighlights, collectTextElements, searchInElements, highlightMatch]);
  
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
  
  // Verzögerte Suche bei Änderung der Suche
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
  }, [searchTerm, performSearch, resetHighlights, targetRef]);
  
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
            {matchCount > 0 ? `${currentMatchIndex + 1} von ${matchCount}` : 'Keine Treffer'}
          </span>
        </div>
      </div>
      
      {/* Erweiterte Optionen */}
      {showOptions && (
        <div className={`mt-2 p-2 rounded-md text-xs ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className={contentType === 'JSON' ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-2 gap-2'}>
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