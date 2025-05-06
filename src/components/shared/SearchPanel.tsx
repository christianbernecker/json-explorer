import React, { useState, useCallback, useEffect } from 'react';
import { SearchPanelProps, SearchResult } from '../../types';

const SearchPanel = React.memo(({ targetRef, contentType, isDarkMode, onSearch }: SearchPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState<SearchResult[]>([]);
  
  const handleSearch = useCallback(() => {
    if (!searchTerm.trim() || !targetRef.current) {
      setMatches([]);
      return;
    }
    
    // Rufe den optionalen onSearch-Callback auf, wenn er existiert
    if (onSearch) {
      onSearch(searchTerm);
    }
    
    const container = targetRef.current;
    const textElements = container.querySelectorAll('tr');
    const results: SearchResult[] = [];
    
    textElements.forEach((row, rowIndex) => {
      const rowContent = row.textContent || '';
      if (rowContent.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({ 
          element: row as HTMLElement,
          rowIndex
        });
      }
    });
    
    setMatches(results);
    setCurrentMatchIndex(results.length > 0 ? 0 : -1);
    
    // Highlight first match if found
    if (results.length > 0) {
      results[0].element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      results[0].element.classList.add('bg-yellow-200', 'dark:bg-yellow-900');
      if (isDarkMode) {
        results[0].element.style.backgroundColor = '#713F12';
      } else {
        results[0].element.style.backgroundColor = '#FEF08A';
      }
    }
  }, [searchTerm, targetRef, isDarkMode, onSearch]);
  
  const clearHighlights = useCallback(() => {
    matches.forEach(match => {
      match.element.classList.remove('bg-yellow-200', 'dark:bg-yellow-900');
      match.element.style.backgroundColor = '';
    });
  }, [matches]);
  
  const navigateMatch = useCallback((direction: 'next' | 'prev') => {
    if (matches.length === 0) return;
    
    // Clear current highlight
    clearHighlights();
    
    // Calculate new index
    let newIndex = currentMatchIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % matches.length;
    } else {
      newIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    }
    
    // Set new current match
    setCurrentMatchIndex(newIndex);
    
    // Highlight and scroll to the new match
    const currentMatch = matches[newIndex];
    currentMatch.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (isDarkMode) {
      currentMatch.element.style.backgroundColor = '#713F12';
    } else {
      currentMatch.element.style.backgroundColor = '#FEF08A';
    }
  }, [matches, currentMatchIndex, clearHighlights, isDarkMode]);
  
  // Clean up highlights when search term changes or component unmounts
  useEffect(() => {
    return () => {
      clearHighlights();
    };
  }, [searchTerm, clearHighlights]);
  
  return (
    <div className={`flex items-center space-x-2 mb-2 ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className={`flex-1 flex items-center space-x-2 p-2 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'border-gray-300'
      }`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (matches.length > 0) {
                e.preventDefault(); // Verhindere Standardverhalten
                if (e.shiftKey) {
                  navigateMatch('prev');
                } else {
                  navigateMatch('next');
                }
              } else {
                // Nur Suche auslösen, wenn noch keine Treffer da sind
                handleSearch();
              }
            }
          }}
          placeholder={`Search in ${contentType}...`}
          className={`flex-1 outline-none text-sm ${
            isDarkMode 
              ? 'bg-gray-800 text-gray-200 placeholder-gray-500' 
              : 'bg-white text-gray-700 placeholder-gray-400'
          }`}
        />
        {searchTerm && (
          <button 
            onClick={() => {
              setSearchTerm('');
              clearHighlights();
              setMatches([]);
            }}
            className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      <button
        onClick={handleSearch}
        className={`px-3 py-2 rounded-lg ${
          isDarkMode 
            ? 'bg-blue-700 text-white hover:bg-blue-600' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        } text-sm flex items-center`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Find
      </button>
      
      {matches.length > 0 && (
        <>
          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentMatchIndex + 1} of {matches.length}
          </div>
          <button
            onClick={() => navigateMatch('prev')}
            className={`p-1 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Previous Match"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigateMatch('next')}
            className={`p-1 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Next Match"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
});

export default SearchPanel; 