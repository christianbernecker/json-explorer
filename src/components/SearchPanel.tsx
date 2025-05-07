import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SearchPanelProps {
  contentType: 'JSON' | 'VAST';
  targetRef: React.RefObject<HTMLDivElement>;
  isDarkMode: boolean;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ contentType, targetRef, isDarkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState<HTMLElement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const originalContent = useRef<string>('');

  // Escape spezielle Regex-Zeichen
  const escapeRegExp = useCallback((string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);

  // Beim ersten Laden den originalen Inhalt speichern
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
        const parent = match.parentNode;
        if (parent) {
          const textContent = match.textContent || '';
          const textNode = document.createTextNode(textContent);
          parent.replaceChild(textNode, match);
        }
      });
      
      // Entferne das aktuelle Highlight
      const currentMatch = targetRef.current.querySelector('.current-match') as HTMLElement | null;
      if (currentMatch) {
        currentMatch.classList.remove('current-match');
        currentMatch.style.backgroundColor = isDarkMode ? '#3b82f680' : '#93c5fd80';
      }
    } catch (err) {
      console.error('Error clearing highlights:', err);
      // Bei Fehler stellen wir den Original-Inhalt wieder her
      if (originalContent.current && targetRef.current) {
        targetRef.current.innerHTML = originalContent.current;
      }
    }
  }, [targetRef, isDarkMode, error, matches.length]);

  // Aktuelle Übereinstimmung hervorheben und zu ihr scrollen
  const highlightMatch = useCallback((index: number, matchElements: HTMLElement[]) => {
    if (!matchElements.length) return;
    
    try {
      // Reset das vorherige aktuelle Element
      const previousMatch = matchElements[currentMatchIndex];
      if (previousMatch) {
        previousMatch.classList.remove('current-match');
        previousMatch.style.backgroundColor = isDarkMode ? '#3b82f680' : '#93c5fd80';
      }
      
      // Markiere das neue Element
      const match = matchElements[index];
      match.classList.add('current-match');
      match.style.backgroundColor = isDarkMode ? '#ef4444' : '#f87171';
      match.style.color = 'white';
      
      // Scrolle zur Position
      match.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setCurrentMatchIndex(index);
    } catch (err) {
      console.error('Error highlighting match:', err);
      setError('Failed to highlight match');
    }
  }, [currentMatchIndex, isDarkMode]);

  // Führe Suche durch und markiere Übereinstimmungen
  const performSearch = useCallback(() => {
    if (!targetRef.current || !searchTerm) return;
    
    // Aktuellen Inhalt speichern, falls noch nicht getan
    if (!originalContent.current) {
      originalContent.current = targetRef.current.innerHTML;
    }
    
    // Lösche bestehende Highlights
    clearHighlights();
    setError(null);
    
    try {
      // String-Inhalt des Containers holen
      const contentContainer = targetRef.current;
      
      // Case-insensitive Suche
      const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
      
      // Wir suchen im Original-Text (ohne HTML-Tags)
      const textNodes = [];
      const walker = document.createTreeWalker(
        contentContainer,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while ((node = walker.nextNode()) !== null) {
        // Nur echte Textnodes, keine leeren oder nur mit Whitespace
        if (node.textContent?.trim()) {
          textNodes.push(node);
        }
      }
      
      // Matches zählen
      let matchesFound = 0;
      const matchElements: HTMLElement[] = [];
      
      // Durch Text-Nodes iterieren und Treffer hervorheben
      textNodes.forEach(textNode => {
        const text = textNode.textContent || '';
        const matches = text.match(regex);
        
        if (matches) {
          const parent = textNode.parentNode as HTMLElement;
          if (!parent) return;
          
          // HTML für den hervorgehobenen Text erstellen
          const highlightedText = text.replace(regex, match => {
            matchesFound++;
            return `<span class="search-match" style="background-color: ${isDarkMode ? '#3b82f680' : '#93c5fd80'}; color: ${isDarkMode ? 'white' : 'black'};">${match}</span>`;
          });
          
          // Neues Element erstellen und einfügen
          const newElement = document.createElement('span');
          newElement.innerHTML = highlightedText;
          
          // Altes Text-Node durch neues Element ersetzen
          parent.replaceChild(newElement, textNode);
          
          // Alle neue Matches zum Array hinzufügen
          const newMatchElements = newElement.querySelectorAll('.search-match');
          newMatchElements.forEach(match => {
            matchElements.push(match as HTMLElement);
          });
        }
      });
      
      // Ergebnisse aktualisieren
      setMatches(matchElements);
      setMatchCount(matchesFound);
      
      // Erstes Match hervorheben, falls vorhanden
      if (matchElements.length > 0) {
        highlightMatch(0, matchElements);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Ein Fehler ist bei der Suche aufgetreten');
      // Original-Inhalt wiederherstellen
      if (originalContent.current && targetRef.current) {
        targetRef.current.innerHTML = originalContent.current;
      }
    }
  }, [clearHighlights, escapeRegExp, highlightMatch, isDarkMode, searchTerm, targetRef]);

  // Fokussiere das Suchfeld beim Mounten
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Führe die Suche aus, wenn sich der Suchbegriff ändert
  useEffect(() => {
    if (!searchTerm || !targetRef.current) {
      clearHighlights();
      setMatchCount(0);
      setCurrentMatchIndex(0);
      return;
    }
    
    performSearch();
  }, [searchTerm, clearHighlights, performSearch, targetRef]);

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

  return (
    <div className={`flex flex-col p-2 mb-2 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
      <div className="flex items-center">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search in ${contentType}...`}
          className={`flex-grow px-2 py-1 text-sm rounded-md border outline-none ${
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
        
        <div className="flex items-center ml-2">
          <button 
            onClick={goToPrevMatch}
            disabled={matchCount === 0}
            className={`p-1 rounded-md ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-600 disabled:text-gray-500' 
                : 'text-gray-600 hover:bg-gray-200 disabled:text-gray-400'
            }`}
            title="Previous match (Shift+Enter)"
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
            title="Next match (Enter)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {matchCount > 0 ? `${currentMatchIndex + 1} of ${matchCount}` : 'No matches'}
          </span>
        </div>
      </div>
      
      {error && (
        <div className={`mt-2 text-xs p-1 rounded ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-600'}`}>
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchPanel; 