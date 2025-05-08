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
  isKey?: boolean;
}

// Spezielle technische Terme, die besondere Behandlung benötigen
const SPECIAL_TERMS = ['bid', 'dsa', 'id', 'key', 'uuid'];

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
      console.log(`SearchPanel: Originalinhalt für ${contentType} gespeichert, Größe: ${originalContent.current.length}`);
    }
  }, [targetRef, contentType]);

  // Entferne alle Highlights
  const clearHighlights = useCallback(() => {
    if (!targetRef.current) return;
    
    // Wenn ein Fehler aufgetreten ist oder keine Suche stattgefunden hat,
    // stellen wir den Original-Inhalt wieder her
    if (error || matches.length === 0) {
      if (originalContent.current) {
        targetRef.current.innerHTML = originalContent.current;
        console.log(`SearchPanel: Originalinhalt für ${contentType} wiederhergestellt`);
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
      // Bei Fehler stellen wir den Original-Inhalt wieder her
      if (originalContent.current && targetRef.current) {
        targetRef.current.innerHTML = originalContent.current;
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
        // Entferne zusätzliche Styling-Eigenschaften
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

  // JSON-spezifische direkte Attribut- und Wertsuche für bessere Erkennung
  const searchInJsonDirectAttributes = useCallback((root: HTMLElement, pattern: RegExp, results: SearchResult[]) => {
    // Suche nach data-* Attributen
    const attributeNodes = root.querySelectorAll('[data-key], [data-value], [data-type]');
    
    attributeNodes.forEach(node => {
      const element = node as HTMLElement;
      
      // Prüfe jeden data-* Attributwert
      for (const attr of ['data-key', 'data-value', 'data-type']) {
        const attrValue = element.getAttribute(attr);
        if (!attrValue) continue;
        
        // Überprüfe, ob der Attributwert dem Muster entspricht
        if (pattern.test(attrValue)) {
          // Reset pattern.lastIndex, die durch test() verändert wurde
          pattern.lastIndex = 0;
          
          // Erzeuge ein Highlight-Element
          const span = document.createElement('span');
          span.className = 'search-match';
          span.style.backgroundColor = isDarkMode ? '#3b82f680' : '#93c5fd80';
          span.style.color = isDarkMode ? 'white' : 'black';
          
          // Kopiere den Inhalt des Elements
          const originalContent = element.innerHTML;
          span.innerHTML = originalContent;
          
          // Leere das Element und füge das Highlight ein
          element.innerHTML = '';
          element.appendChild(span);
          
          // Füge das Ergebnis hinzu
          const isKey = attr === 'data-key' || element.classList.contains('json-key');
          results.push({
            match: attrValue,
            element: span,
            context: originalContent,
            line: getLineNumber(element),
            isKey: isKey
          });
        }
      }
    });
  }, [isDarkMode]);

  // Hilfsfunktion für Zeilennummer
  const getLineNumber = (element: HTMLElement): number => {
    const row = element.closest('tr');
    if (row && row.firstChild && row.firstChild.textContent) {
      const num = parseInt(row.firstChild.textContent.trim(), 10);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Verbesserte JSON-Suche mit spezieller Unterstützung für technische Begriffe
  const searchInJsonContent = useCallback((contentElement: HTMLElement, pattern: RegExp, results: SearchResult[]) => {
    // Optimierte Suche für spezielle Begriffe wie "bid", "dsa", etc.
    const isSpecialTerm = SPECIAL_TERMS.includes(searchTerm.toLowerCase());
    
    // Bei speziellen Begriffen erst direkt in data-Attributen suchen
    if (isSpecialTerm) {
      searchInJsonDirectAttributes(contentElement, pattern, results);
    }
    
    // Verbesserte Rekursion für komplexere Texttreffer
    const processNode = (node: Node, parentSpans: HTMLElement[] = []) => {
      // Für Text-Knoten
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const text = node.textContent.trim();
        if (!text) return; // Leere Textknoten überspringen
        
        // Prüfe, ob der Text dem Suchmuster entspricht
        pattern.lastIndex = 0; // Manuell zurücksetzen für jede Iteration
        let match = pattern.exec(text);
        
        if (match) {
          // Text enthält Match, erstelle Document Fragment
          const fragment = document.createDocumentFragment();
          
          // Text vor dem Match
          if (match.index > 0) {
            fragment.appendChild(document.createTextNode(text.substring(0, match.index)));
          }
          
          // Highlight-Element erstellen
          const span = document.createElement('span');
          span.className = 'search-match';
          span.style.backgroundColor = isDarkMode ? '#3b82f680' : '#93c5fd80';
          span.style.color = isDarkMode ? 'white' : 'black';
          span.textContent = match[0];
          fragment.appendChild(span);
          
          // Bestimme den übergeordneten Kontext
          const parentElement = parentSpans[parentSpans.length - 1] || node.parentElement as HTMLElement;
          
          // Bestimme ob es ein Schlüssel ist
          const isKey = parentElement?.classList.contains('token-key') || 
                       parentElement?.classList.contains('text-blue-300') ||
                       parentElement?.classList.contains('json-key') ||
                        parentElement?.getAttribute('data-type') === 'key';
          
          // Ergebnis nur hinzufügen, wenn Option aktiviert oder kein Schlüssel
          if (options.searchInKeys || !isKey) {
            results.push({
              match: match[0],
              element: span,
              context: text.substring(Math.max(0, match.index - 20), 
                                   Math.min(text.length, match.index + match[0].length + 20)),
              line: getLineNumber(parentElement || document.createElement('div')),
              isKey
            });
          }
          
          // Restlichen Text nach dem Match hinzufügen
          if (match.index + match[0].length < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(match.index + match[0].length)));
          }
          
          // Ersetze den ursprünglichen Textknoten
          node.parentNode?.replaceChild(fragment, node);
        }
      } 
      // Für Element-Knoten
      else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        
        // Ignoriere bestimmte Elemente
        if (element.tagName === 'SCRIPT' || 
            element.tagName === 'STYLE' || 
            element.classList.contains('search-panel-container') ||
            element.classList.contains('search-match')) {
          return;
        }
        
        // Spezielle Behandlung für JSON-Elemente
        const newParentSpans = [...parentSpans];
        if (element.tagName === 'SPAN' || 
            element.classList.contains('json-pair') || 
            element.classList.contains('token-key') ||
            element.classList.contains('token-value')) {
          newParentSpans.push(element);
        }
        
        // Spezialbehandlung für bekannte Problembegriffe
        if (isSpecialTerm) {
          // Prüfe data-key Attribute für Schlüssel
          if (element.hasAttribute('data-key')) {
            const keyValue = element.getAttribute('data-key');
            if (keyValue && pattern.test(keyValue)) {
              pattern.lastIndex = 0; // Reset lastIndex
              // Nur hervorheben, wenn keine bestehenden Highlights
              if (!element.querySelector('.search-match')) {
                const span = document.createElement('span');
                span.className = 'search-match';
                span.style.backgroundColor = isDarkMode ? '#3b82f680' : '#93c5fd80';
                span.style.color = isDarkMode ? 'white' : 'black';
                span.textContent = element.textContent || '';
                
                // Speichere originalen Inhalt
                const originalContent = element.innerHTML;
                element.innerHTML = '';
                element.appendChild(span);
                
                // Ergebnis hinzufügen
                results.push({
                  match: searchTerm,
                  element: span,
                  context: originalContent,
                  line: getLineNumber(element),
                  isKey: true
                });
                
                // Nicht weiter in diesem Element suchen
                return;
              }
            }
          }
        }
        
        // Rekursiv alle Kindelemente durchlaufen
        for (let i = 0; i < element.childNodes.length; i++) {
          processNode(element.childNodes[i], newParentSpans);
        }
      }
    };
    
    // Starte die Traversierung
    processNode(contentElement);
  }, [isDarkMode, searchTerm, options.searchInKeys, searchInJsonDirectAttributes]);

  // Durchführung der Suche mit verbesserter Leistung für komplexe Terme
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
      
      // Debug-Ausgabe für bessere Diagnose
      console.log(`SearchPanel: Suche "${searchTerm}" in ${contentType}, Optionen:`, options);
      
      // Suchstrategie je nach ContentType wählen
      if (contentType === 'JSON') {
        searchInJsonContent(targetRef.current, pattern, results);
      } else {
        // Standardsuche für VAST und andere Inhalte
        const collectTextNodes = (node: Node, textNodes: Node[]) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
            textNodes.push(node);
          } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
            for (let i = 0; i < node.childNodes.length; i++) {
              collectTextNodes(node.childNodes[i], textNodes);
            }
          }
        };
        
        const textNodes: Node[] = [];
        collectTextNodes(targetRef.current, textNodes);
        
        // Durch Textknoten iterieren und Treffer sammeln
        textNodes.forEach(textNode => {
          const text = textNode.textContent || '';
          pattern.lastIndex = 0; // Reset pattern for each node
          let match;
          
          // Alle Matches in diesem Textknoten finden
          while ((match = pattern.exec(text)) !== null) {
            const parent = textNode.parentNode as HTMLElement;
            if (parent) { 
              // Fragment erstellen für bessere Textmanipulation
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
              
              // Ersetze den Textknoten durch das Fragment
              parent.replaceChild(fragment, textNode);
              
              // Ergebnis hinzufügen
              results.push({
                match: match[0],
                element: span,
                context: text.substring(Math.max(0, match.index - 20), 
                                      Math.min(text.length, match.index + match[0].length + 20)),
                line: 0
              });
              
              // Nur ein Match pro Textknoten, weil wir den Knoten verändern
              break;
            }
          }
        });
      }
      
      // Sortiere Ergebnisse
      results.sort((a, b) => {
        // Nach Zeilennummern sortieren
        if (a.line && b.line) {
          return a.line - b.line;
        }
        return 0;
      });
      
      // Debug-Info
      console.log(`SearchPanel: ${results.length} Treffer für "${searchTerm}" gefunden`);
      
      // Ergebnisse speichern
      setMatches(results);
      setMatchCount(results.length);
      
      // Zum ersten Treffer navigieren
      if (results.length > 0) {
        highlightMatch(0, results);
      } else {
        setError(`Keine Treffer für "${searchTerm}" gefunden`);
      }
      
    } catch (err: any) {
      console.error('Fehler bei der Suche:', err);
      setError(`Fehler bei der Suche: ${err.message}`);
      if (originalContent.current && targetRef.current) {
        targetRef.current.innerHTML = originalContent.current;
      }
    }
  }, [
    clearHighlights, 
    createSearchPattern,
    highlightMatch, 
    isDarkMode, 
    onSearch, 
    options,
    searchHistory,
    searchInJsonContent, 
    searchTerm, 
    targetRef, 
    contentType
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