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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Escape spezielle Regex-Zeichen
  const escapeRegExp = useCallback((string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);

  // Entferne alle Highlights
  const clearHighlights = useCallback(() => {
    if (!targetRef.current) return;
    
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
  }, [targetRef, isDarkMode]);

  // Aktuelle Übereinstimmung hervorheben und zu ihr scrollen
  const highlightMatch = useCallback((index: number, matchElements: HTMLElement[]) => {
    if (!matchElements.length) return;
    
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
  }, [currentMatchIndex, isDarkMode]);

  // Führe Suche durch und markiere Übereinstimmungen
  const performSearch = useCallback(() => {
    if (!targetRef.current || !searchTerm) return;
    
    // Lösche bestehende Highlights
    clearHighlights();
    
    // String-Inhalt des Containers holen
    const contentContainer = targetRef.current;
    const contentHtml = contentContainer.innerHTML;
    
    try {
      // Case-insensitive Suche
      const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
      
      // Highlight mit einer Span markieren, aber nur im Textinhalt, nicht in HTML-Tags
      let inTag = false;
      let lastMatchIndex = 0;
      let highlightedHtml = '';
      
      // Durchlaufe das HTML Zeichen für Zeichen
      for (let i = 0; i < contentHtml.length; i++) {
        const char = contentHtml[i];
        
        if (char === '<') {
          inTag = true;
        } else if (char === '>') {
          inTag = false;
        }
        
        if (!inTag && i > lastMatchIndex) {
          // Suche nach Übereinstimmungen im aktuellen Textabschnitt
          const textSegment = contentHtml.substring(lastMatchIndex, i + 1);
          if (!inTag && regex.test(textSegment)) {
            // Ersetze Matches durch markierte Version
            const markedText = textSegment.replace(regex, match => 
              `<span class="search-match" style="background-color: ${isDarkMode ? '#3b82f680' : '#93c5fd80'}; color: ${isDarkMode ? 'white' : 'black'};">${match}</span>`
            );
            highlightedHtml += markedText;
            lastMatchIndex = i + 1;
          }
        }
      }
      
      // Wende die Highlights an
      if (highlightedHtml) {
        contentContainer.innerHTML = highlightedHtml;
      }
      
      // Finde alle markierten Elemente
      const newMatches = Array.from(contentContainer.querySelectorAll('.search-match')) as HTMLElement[];
      setMatches(newMatches);
      setMatchCount(newMatches.length);
      
      // Markiere die erste Übereinstimmung
      if (newMatches.length > 0) {
        highlightMatch(0, newMatches);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [clearHighlights, escapeRegExp, isDarkMode, searchTerm, targetRef, highlightMatch]);

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
    <div className={`flex items-center p-2 mb-2 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
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
  );
};

export default SearchPanel; 