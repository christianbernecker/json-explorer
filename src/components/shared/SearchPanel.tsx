import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchPanelProps } from '../../types';

// Erweiterte Suchoptionen
interface SearchOptions {
  caseSensitive: boolean;
  useRegex: boolean;
  searchInKeys: boolean; // Nur für JSON relevant
  wholeWord: boolean;
}

// Suchergebnis-Typ
interface SearchResult {
  match: string;
  element: HTMLElement;
  line?: number;
  context?: string;
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
      originalContent.current = targetRef.current.innerHTML;
    }
  }, [targetRef]);

  // Entferne alle Highlights
  const clearHighlights = useCallback(() => {
    if (!targetRef.current) return;
    
    // Wenn ein Fehler aufgetreten ist oder keine Suche stattgefunden hat,
    // stellen wir den Original-Inhalt wieder her
    if (error || matches.length === 0) {
      if (originalContent.current) {
        targetRef.current.innerHTML = originalContent.current;
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
      console.error('Error clearing highlights:', err);
      // Bei Fehler stellen wir den Original-Inhalt wieder her
      if (originalContent.current && targetRef.current) {
        targetRef.current.innerHTML = originalContent.current;
      }
    }
  }, [targetRef, error, matches.length]);

  // Aktuelle Übereinstimmung hervorheben und zu ihr scrollen
  const highlightMatch = useCallback((index: number, matchElements: SearchResult[]) => {
    if (!matchElements.length) return;
    
    try {
      // Reset das vorherige aktuelle Element
      matchElements.forEach(result => {
        result.element.classList.remove('current-match');
        result.element.style.backgroundColor = isDarkMode ? '#3b82f680' : '#93c5fd80';
        result.element.style.color = isDarkMode ? 'white' : 'black';
      });
      
      // Markiere das neue Element
      const match = matchElements[index].element;
      match.classList.add('current-match');
      match.style.backgroundColor = isDarkMode ? '#ef4444' : '#f87171';
      match.style.color = 'white';
      
      // Optimiertes Scrollen mit mehr Kontext
      match.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
      });
      
      setCurrentMatchIndex(index);
    } catch (err) {
      console.error('Error highlighting match:', err);
      setError('Fehler beim Hervorheben der Treffer');
    }
  }, [isDarkMode]);

  const searchInJsonContent = useCallback((content: Node, pattern: RegExp, results: SearchResult[]) => {
    // Funktion, die JSON-Knoten rekursiv durchsucht
    const searchNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const text = node.textContent.trim();
        if (text) {
          // Suche nach dem Muster im Text
          let match;
          while ((match = pattern.exec(text)) !== null) {
            if (node.parentElement) {
              results.push({
                match: match[0],
                element: node.parentElement,
                context: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20)
              });
            }
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Speziell für JSON, prüfe auch Schlüssel wenn aktiviert
        if (options.searchInKeys && 
            (node.parentElement?.classList.contains('text-blue-300') || 
             node.parentElement?.classList.contains('text-indigo-600'))) {
          if (node.textContent) {
            const keyText = node.textContent.trim();
            let match;
            while ((match = pattern.exec(keyText)) !== null) {
              if (node.parentElement) {
                results.push({
                  match: match[0],
                  element: node.parentElement,
                  context: `Key: ${keyText}`
                });
              }
            }
          }
        }
        
        // Alle Kinder durchsuchen
        for (let i = 0; i < node.childNodes.length; i++) {
          searchNode(node.childNodes[i]);
        }
      }
    };
    
    searchNode(content);
  }, [options.searchInKeys]);

  // Durchführung der Suche mit verbesserter Performance
  const performSearch = useCallback(() => {
    if (!targetRef.current || !searchTerm) return;
    
    // In Such-Historie speichern
    if (!searchHistory.includes(searchTerm)) {
      setSearchHistory(prev => [searchTerm, ...prev.slice(0, 9)]);
    }
    setHistoryIndex(-1);
    
    if (onSearch) {
      onSearch(searchTerm);
    }
    
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
    
    try {
      const pattern = createSearchPattern(searchTerm);
      const results: SearchResult[] = [];
      
      if (contentType === 'JSON') {
        // Spezialisierte Suche für JSON
        searchInJsonContent(targetRef.current, pattern, results);
      } else {
        // Allgemeine Textsuche für andere Inhalte
        const collectTextNodes = (node: Node, textNodes: Node[]) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
            textNodes.push(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (let i = 0; i < node.childNodes.length; i++) {
              collectTextNodes(node.childNodes[i], textNodes);
            }
          }
        };
        
        const textNodes: Node[] = [];
        collectTextNodes(targetRef.current, textNodes);
        
        // Durch Textknoten iterieren und Treffer markieren
        textNodes.forEach(textNode => {
          const text = textNode.textContent || '';
          // Prüfe, ob Text Treffer enthält (abhängig von der Case-Sensitivity)
          if ((options.caseSensitive ? text.includes(searchTerm) : text.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (options.useRegex && pattern.test(text))) {
            const parent = textNode.parentNode as HTMLElement;
            if (!parent) return;
            
            // Ersetze den Text mit markierten Treffern
            let newHTML = '';
            const processedText = text.replace(pattern, (match) => {
              // Erstelle einen Ergebniseintrag für die Navigation
              results.push({
                match: match,
                element: parent,
                context: text.substring(Math.max(0, text.indexOf(match) - 20), text.indexOf(match) + match.length + 20)
              });
              
              return `<span class="search-match" style="background-color: ${isDarkMode ? '#3b82f680' : '#93c5fd80'}; color: ${isDarkMode ? 'white' : 'black'};">${match}</span>`;
            });
            
            // Nur ersetzen, wenn tatsächlich Treffer gefunden wurden
            if (processedText !== text) {
              newHTML = processedText;
              
              // Neues Element mit den markierten Treffern erstellen
              const replacementNode = document.createElement('span');
              replacementNode.innerHTML = newHTML;
              
              // Altes Textnode ersetzen
              parent.replaceChild(replacementNode, textNode);
            }
          }
        });
      }
      
      // Treffer sortieren (nach Reihenfolge im Dokument)
      results.sort((a, b) => {
        const posA = document.evaluate(
          'count(preceding::*)', a.element, null, XPathResult.NUMBER_TYPE, null
        ).numberValue;
        const posB = document.evaluate(
          'count(preceding::*)', b.element, null, XPathResult.NUMBER_TYPE, null
        ).numberValue;
        return posA - posB;
      });
      
      // Ergebnisse speichern
      setMatches(results);
      setMatchCount(results.length);
      
      // Erstes Match hervorheben, falls vorhanden
      if (results.length > 0) {
        // Highlight alle gefundenen Matches
        results.forEach(result => {
          const parent = result.element;
          if (!parent.querySelector('.search-match') && parent.textContent) {
            const text = parent.textContent;
            parent.innerHTML = text.replace(pattern, (match) => {
              return `<span class="search-match" style="background-color: ${isDarkMode ? '#3b82f680' : '#93c5fd80'}; color: ${isDarkMode ? 'white' : 'black'};">${match}</span>`;
            });
          }
        });
        
        // Zum ersten Match navigieren
        highlightMatch(0, results);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(`Fehler bei der Suche: ${err.message}`);
      if (originalContent.current && targetRef.current) {
        targetRef.current.innerHTML = originalContent.current;
      }
    }
  }, [clearHighlights, createSearchPattern, highlightMatch, isDarkMode, onSearch, options.caseSensitive, options.useRegex, searchHistory, searchInJsonContent, searchTerm, targetRef, contentType]);

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
      {/* Search input with history and options */}
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