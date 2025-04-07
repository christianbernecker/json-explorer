import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  HistoryItemProps, 
  HistoryItem as HistoryItemType, 
  SearchPanelProps, 
  SearchResult,
  JsonVastExplorerProps,
  JsonDiffInspectorProps,
  TabNavigationProps,
  StructuralDifference,
  ValueDifference
} from '../types';

// Define interface for VAST content info
interface VastInfo {
  path: string;
  content: string;
}

// Optimized Syntax Highlighting Functions with Memoization
const useHighlighter = () => {
  // Memoized version of the highlighting functions
  const highlightJson = useCallback((json: any, isDarkMode: boolean): string => {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, null, 2);
    }
    
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match: string) => {
      let cls = isDarkMode ? 'text-green-400' : 'text-green-600'; // string
      
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = isDarkMode ? 'text-gray-100 font-semibold' : 'text-black font-semibold'; // key
        }
      } else if (/true/.test(match)) {
        cls = isDarkMode ? 'text-purple-400' : 'text-purple-600'; // true
      } else if (/false/.test(match)) {
        cls = isDarkMode ? 'text-orange-300' : 'text-orange-500'; // false
      } else if (/null/.test(match)) {
        cls = isDarkMode ? 'text-gray-400' : 'text-gray-500'; // null
      } else {
        cls = isDarkMode ? 'text-blue-300' : 'text-blue-600'; // number
      }
      
      return `<span class="${cls}">${match}</span>`;
    });
  }, []);

  const highlightXml = useCallback((xml: string | undefined, isDarkMode: boolean): string => {
    if (!xml) return '';
    
    xml = xml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Tags
    let highlighted = xml.replace(/&lt;(\/?)([-\w:]+)([^&]*?)(\/?)\&gt;/g, 
      (match, slash, tag, attrs, endSlash) => {
        let attrsHighlighted = attrs;
        
        // Attributes
        attrsHighlighted = attrsHighlighted.replace(/(\s+)([-\w:]+)(\s*=\s*)(".*?"|'.*?')/g, 
          (match: string, space: string, name: string, equals: string, value: string) => {
            return `${space}<span class="${isDarkMode ? 'text-gray-100 font-semibold' : 'text-black font-semibold'}">${name}</span>${equals}<span class="${isDarkMode ? 'text-green-400' : 'text-green-600'}">${value}</span>`;
          }
        );
        
        return `&lt;<span class="${isDarkMode ? 'text-blue-300' : 'text-blue-600'}">${slash}${tag}</span>${attrsHighlighted}${endSlash}&gt;`;
      }
    );
    
    // CDATA
    highlighted = highlighted.replace(/(&lt;!\[CDATA\[)(.*)(\]\]&gt;)/g, 
      (match, start, content, end) => {
        return `<span class="${isDarkMode ? 'text-purple-300' : 'text-purple-500'}">${start}</span><span class="${isDarkMode ? 'text-teal-300' : 'text-teal-600'}">${content}</span><span class="${isDarkMode ? 'text-purple-300' : 'text-purple-500'}">${end}</span>`;
      }
    );
    
    return highlighted;
  }, []);

  const formatXml = useCallback((xml: string): string => {
    let formatted = '';
    let indent = '';
    let indentLevel = 0;
    
    xml = xml.replace(/>\s+</g, '><');
    
    xml.split(/(<\/?[^>]+>)/).forEach(segment => {
      if (!segment.trim()) return;
      
      if (segment.match(/^<\//)) {
        indentLevel--;
        indent = '  '.repeat(indentLevel);
      }
      
      formatted += indent + segment + '\n';
      
      if (segment.match(/^<[^\/]/) && !segment.match(/\/>$/) && !segment.match(/^<!\[CDATA\[/) && !segment.match(/^<\?/)) {
        indentLevel++;
        indent = '  '.repeat(indentLevel);
      }
    });
    
    return formatted.trim();
  }, []);

  return { highlightJson, highlightXml, formatXml };
};

// Memoized HistoryItem Component - Prevents unnecessary re-renders
const HistoryItem = memo(({ item, index, onRestore, isDarkMode }: HistoryItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Optimized preview generation with useMemo
  const preview = useMemo(() => {
    if (item.type === 'json_vast') {
      const jsonStr = JSON.stringify(item.jsonContent);
      return jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
    } else if (item.type === 'json') {
      const jsonStr = JSON.stringify(item.content);
      return jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
    }
    return 'No preview available';
  }, [item]);
  
  return (
    <div className={`border rounded-lg mb-2 overflow-hidden ${
      isDarkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <span className={`font-semibold mr-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>#{index + 1}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            item.type === 'json'
              ? isDarkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
              : isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
          }`}>
            {item.type === 'json' ? 'JSON' : 'JSON & VAST'}
          </span>
          <span className={`ml-2 text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{new Date(item.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestore(item);
            }}
            className={`mr-2 px-2 py-1 rounded-lg text-sm transition ${
              isDarkMode
                ? 'bg-green-900 text-green-200 hover:bg-green-800'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Restore
          </button>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''} ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {isExpanded && (
        <div className={`p-3 border-t ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <pre className={`text-xs font-mono whitespace-pre-wrap overflow-x-auto ${
            isDarkMode ? 'text-gray-300' : ''
          }`}>{preview}</pre>
          {item.type === 'json_vast' && (
            <div className={`mt-2 pt-2 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <span className={`text-xs font-semibold ${
                isDarkMode ? 'text-gray-300' : ''
              }`}>VAST Path:</span> 
              <span className={`ml-1 text-xs ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>{item.vastPath}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Optimized SearchPanel Component with useCallback
const SearchPanel = memo(({ targetRef, contentType, isDarkMode }: SearchPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Optimized search with useCallback
  const performSearch = useCallback(() => {
    if (!targetRef.current || !searchTerm.trim()) return;
    
    // Reset old highlights
    const highlightedRows = targetRef.current.querySelectorAll('.bg-yellow-100, .bg-yellow-900');
    highlightedRows.forEach(row => {
      row.classList.remove('bg-yellow-100');
      row.classList.remove('bg-yellow-900');
    });
    
    // Search in text
    const rows = Array.from(targetRef.current.querySelectorAll('tr'));
    
    const results = rows.filter(row => 
      row.textContent?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    ).map((row, rowIndex) => ({
      element: row as HTMLElement,
      rowIndex
    }));
    
    setSearchResults(results);
    
    // Highlight first result
    if (results.length > 0) {
      setCurrentResultIndex(0);
      highlightResult(results[0]);
    }
  }, [targetRef, searchTerm]);
  
  // Optimize with useEffect to avoid unnecessary searches
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
        setCurrentResultIndex(-1);
      }
    }, 300); // Debounce for better performance
    
    return () => clearTimeout(handler);
  }, [searchTerm, performSearch]);
  
  const highlightResult = useCallback((result: SearchResult) => {
    if (!result || !result.element) return;
    
    // Reset previous highlighting
    const container = targetRef.current;
    if (container) {
      const highlightedRows = container.querySelectorAll('.bg-yellow-100, .bg-yellow-900');
      highlightedRows.forEach(row => {
        row.classList.remove('bg-yellow-100');
        row.classList.remove('bg-yellow-900');
      });
    }
    
    // Highlight current row
    result.element.classList.add(isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100');
    
    // Scroll to element
    result.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [targetRef, isDarkMode]);
  
  const goToNextResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const newIndex = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(newIndex);
    highlightResult(searchResults[newIndex]);
  }, [searchResults, currentResultIndex, highlightResult]);
  
  const goToPreviousResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const newIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentResultIndex(newIndex);
    highlightResult(searchResults[newIndex]);
  }, [searchResults, currentResultIndex, highlightResult]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goToNextResult();
    } else if (e.key === 'Escape') {
      setSearchTerm('');
    }
  }, [goToNextResult]);
  
  return (
    <div className={`flex items-center space-x-2 w-full p-2 rounded-lg ${
      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
    }`}>
      <div className="relative flex-grow">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Search in ${contentType}...`}
          className={`w-full p-2 border rounded-lg pr-20 focus:outline-none ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
        {searchResults.length > 0 && (
          <div className={`absolute right-2 top-2 text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {currentResultIndex + 1}/{searchResults.length}
          </div>
        )}
      </div>
      <button
        onClick={goToPreviousResult}
        disabled={searchResults.length === 0}
        className={`p-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 ${
          isDarkMode 
            ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
            : 'bg-gray-200'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNextResult}
        disabled={searchResults.length === 0}
        className={`p-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 ${
          isDarkMode 
            ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
            : 'bg-gray-200'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
});

// JSON VAST Explorer Component
const JsonVastExplorer = ({ isDarkMode, setHistory, history, showHistory, setShowHistory }: JsonVastExplorerProps) => {
  // Explorer state
  const [jsonInput, setJsonInput] = useState('');
  const [formattedJson, setFormattedJson] = useState<any>(null);
  const [embeddedVastContent, setEmbeddedVastContent] = useState<string | null>(null);
  const [vastPath, setVastPath] = useState('');
  const [vastUrl, setVastUrl] = useState('');
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Refs for search functionality
  const jsonContentRef = useRef<HTMLDivElement>(null);
  const vastContentRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Custom hook for Syntax Highlighting
  const { highlightJson, highlightXml, formatXml } = useHighlighter();
  
  // Find VAST content - Optimized with useCallback
  const findVastContent = useCallback((obj: any) => {
    if (typeof obj !== 'object' || obj === null) return null;
    
    // Optimized recursion with sharper termination conditions
    const traverse = (obj: any, path = ''): VastInfo | null => {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof obj[key] === 'string' && 
            obj[key].includes('<VAST') && 
            obj[key].includes('</VAST>')) {
          return { path: currentPath, content: obj[key] };
        }
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const result: VastInfo | null = traverse(obj[key], currentPath);
          if (result) return result;
        }
      }
      return null;
    };
    
    return traverse(obj);
  }, []);
  
  // Extract VAST URL - Optimized with useCallback
  const extractVastUrl = useCallback((content: string | null) => {
    if (!content) return null;
    const match = content.match(/https?:\/\/[^\s"'<>]+vast[^\s"'<>]*/i);
    return match ? match[0] : null;
  }, []);
  
  // Format JSON and find VAST content - Optimized with useCallback
  const handleFormat = useCallback(() => {
    try {
      const inputStr = jsonInput.trim();
      
      if (!inputStr) {
        setError('Please enter JSON.');
        return;
      }
      
      const parsedJson = JSON.parse(inputStr);
      
      // Search for VAST content
      const vastInfo = findVastContent(parsedJson);
      if (vastInfo) {
        const formattedVast = formatXml(vastInfo.content);
        const url = extractVastUrl(vastInfo.content);
        
        setFormattedJson(parsedJson);
        setEmbeddedVastContent(formattedVast);
        setVastPath(vastInfo.path);
        setVastUrl(url || '');
        setError('');
        
        // Add to history as JSON & VAST
        const newHistoryItem = {
          type: 'json_vast' as const,
          jsonContent: parsedJson,
          vastContent: formattedVast,
          vastPath: vastInfo.path,
          vastUrl: url || '',
          timestamp: new Date().getTime()
        };
        
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
      } else {
        setFormattedJson(parsedJson);
        setEmbeddedVastContent(null);
        setVastPath('');
        setVastUrl('');
        setError('');
        
        // Add only JSON to history
        const newHistoryItem = {
          type: 'json' as const,
          content: parsedJson,
          timestamp: new Date().getTime()
        };
        
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
      }
    } catch (err: any) {
      setError(`Parsing error: ${err.message}`);
      setFormattedJson(null);
      setEmbeddedVastContent(null);
      setVastPath('');
      setVastUrl('');
    }
  }, [jsonInput, findVastContent, formatXml, extractVastUrl, setHistory]);
  
  // Copy content to clipboard - Optimized with useCallback
  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyMessage(`${type} copied!`);
        setTimeout(() => setCopyMessage(''), 2000);
      },
      (err) => console.error('Error copying: ', err)
    );
  }, []);
  
  // Handle JSON input change
  const handleJsonInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  }, []);
  
  // Restore from history
  const restoreFromHistory = useCallback((item: HistoryItemType) => {
    if (item.type === 'json') {
      setFormattedJson(item.content);
      setJsonInput(JSON.stringify(item.content, null, 2));
      setEmbeddedVastContent(null);
      setVastPath('');
      setVastUrl('');
      setShowHistory(false);
    } else {
      setFormattedJson(item.jsonContent);
      setJsonInput(JSON.stringify(item.jsonContent, null, 2));
      setEmbeddedVastContent(item.vastContent || null);
      setVastPath(item.vastPath || '');
      setVastUrl(item.vastUrl || '');
      setShowHistory(false);
    }
  }, [setShowHistory]);
  
  // Clear all fields
  const handleClear = useCallback(() => {
    setJsonInput('');
    setFormattedJson(null);
    setEmbeddedVastContent(null);
    setVastPath('');
    setVastUrl('');
    setError('');
    setCopyMessage('');
  }, []);
  
  // Optimized function to add line numbers
  const addLineNumbers = useCallback((html: string, type: string) => {
    if (!html) return '';
    
    const lines = html.split('\n');
    let result = '<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">';
    
    // Calculate font size based on zoom level
    const fontSize = Math.round(12 * zoomLevel);
    
    lines.forEach((line, index) => {
      result += `
        <tr>
          <td style="width: 30px; text-align: right; color: ${isDarkMode ? '#9ca3af' : '#999'}; user-select: none; padding-right: 8px; font-size: ${fontSize}px; border-right: 1px solid ${isDarkMode ? '#4b5563' : '#ddd'}; vertical-align: top;">${index + 1}</td>
          <td style="padding-left: 8px; white-space: pre; font-family: monospace; font-size: ${fontSize}px;">${line}</td>
        </tr>
      `;
    });
    
    result += '</table>';
    return result;
  }, [zoomLevel, isDarkMode]);
  
  // Memoization of formatted content for better performance
  const formattedJsonHtml = useMemo(() => {
    if (!formattedJson) return '';
    return addLineNumbers(highlightJson(formattedJson, isDarkMode), 'json');
  }, [formattedJson, highlightJson, addLineNumbers, isDarkMode]);

  const formattedVastHtml = useMemo(() => {
    if (!embeddedVastContent) return '';
    return addLineNumbers(highlightXml(embeddedVastContent, isDarkMode), 'vast');
  }, [embeddedVastContent, highlightXml, addLineNumbers, isDarkMode]);

  return (
    <div className="w-full">
      {/* History Panel */}
      {showHistory && (
        <div className={`mb-6 p-4 border rounded-lg shadow-sm ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Formatting History</h2>
          </div>
          
          {history.length === 0 ? (
            <div className={`text-center p-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No history entries</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {history.map((item, index) => (
                <HistoryItem 
                  key={index}
                  item={item}
                  index={index}
                  onRestore={restoreFromHistory}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Input */}
      <div className="mb-4">
        <textarea
          ref={textAreaRef}
          value={jsonInput}
          onChange={handleJsonInputChange}
          placeholder="Paste your unformatted JSON here..."
          className={`w-full h-32 p-3 border rounded-lg font-mono text-sm mb-3 outline-none transition ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
        
        <div className="flex space-x-3">
          <button
            onClick={handleFormat}
            className={`px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="Format (Ctrl+Shift+F)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            Format
          </button>
          <button
            onClick={handleClear}
            className={`px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center ${
              isDarkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Clear (Ctrl+Shift+L)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Copy message notification */}
      {copyMessage && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-md flex items-center z-50 ${
          isDarkMode 
            ? 'bg-green-800 text-green-100' 
            : 'bg-green-100 text-green-800'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {copyMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className={`p-4 mb-4 rounded-lg flex items-center ${
          isDarkMode 
            ? 'bg-red-900 text-red-200 border-l-4 border-red-600' 
            : 'bg-red-50 text-red-600 border-l-4 border-red-500'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* JSON Output with Syntax Highlighting */}
      {formattedJson && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Formatted JSON</h2>
              <div className="ml-4 flex items-center space-x-2">
                <button 
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                  className={`p-1 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Smaller Font Size (Ctrl+Shift+-)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{Math.round(zoomLevel * 100)}%</span>
                <button 
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                  className={`p-1 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Larger Font Size (Ctrl+Shift++)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <button 
                  onClick={() => setZoomLevel(1)}
                  className={`p-1 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Reset Zoom (Ctrl+Shift+0)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(formattedJson, null, 2), 'JSON')}
                className={`px-3 py-1 rounded-lg flex items-center text-sm ${
                  isDarkMode 
                    ? 'bg-indigo-900 text-indigo-200 hover:bg-indigo-800' 
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Copy
              </button>
            </div>
          </div>
          
          {/* Search bar for JSON */}
          <div className="mb-2">
            <SearchPanel targetRef={jsonContentRef} contentType="JSON" isDarkMode={isDarkMode} />
          </div>
          
          <div className={`p-4 rounded-lg border shadow-inner overflow-auto ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div 
              ref={jsonContentRef}
              dangerouslySetInnerHTML={{ 
                __html: formattedJsonHtml
              }}
            />
          </div>
        </div>
      )}
      
      {/* VAST URL Output (if found) */}
      {vastUrl && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>VAST AdTag URL</h2>
            </div>
            <button
              onClick={() => copyToClipboard(vastUrl, 'URL')}
              className={`px-3 py-1 rounded-lg flex items-center text-sm ${
                isDarkMode 
                  ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy URL
            </button>
          </div>
          <div className={`p-4 rounded-lg border shadow-inner ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`font-mono text-sm break-all ${
              isDarkMode ? 'text-blue-300' : 'text-blue-700'
            }`}>
              {vastUrl}
            </div>
          </div>
        </div>
      )}
      
      {/* VAST Output with Syntax Highlighting */}
      {embeddedVastContent && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Embedded VAST</h2>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                isDarkMode 
                  ? 'bg-blue-900 text-blue-200' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {vastPath}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(embeddedVastContent, 'VAST')}
                className={`px-3 py-1 rounded-lg flex items-center text-sm ${
                  isDarkMode 
                    ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Copy
              </button>
            </div>
          </div>
          
          {/* Search bar for VAST */}
          <div className="mb-2">
            <SearchPanel targetRef={vastContentRef} contentType="VAST" isDarkMode={isDarkMode} />
          </div>
          
          <div className={`p-4 rounded-lg border shadow-inner overflow-auto ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div 
              ref={vastContentRef}
              dangerouslySetInnerHTML={{ 
                __html: formattedVastHtml 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// JSON Diff Inspector Component
const JsonDiffInspector = React.memo(({ isDarkMode }: JsonDiffInspectorProps) => {
  // Refs for content
  const leftContentRef = useRef<HTMLDivElement>(null);
  const rightContentRef = useRef<HTMLDivElement>(null);
  
  const [leftJsonInput, setLeftJsonInput] = useState('');
  const [rightJsonInput, setRightJsonInput] = useState('');
  const [comparisonResult, setComparisonResult] = useState<{
    structureDifferences: StructuralDifference[],
    valueDifferences: ValueDifference[]
  } | null>(null);
  const [comparisonMode, setComparisonMode] = useState('both'); // 'structure', 'values', or 'both'
  const [error, setError] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Custom hook for syntax highlighting
  const { highlightJson } = useHighlighter();
  
  // Optimized function to add line numbers
  const addLineNumbers = useCallback((html: string, type: string) => {
    if (!html) return '';
    
    const lines = html.split('\n');
    let result = '<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">';
    
    // Calculate font size based on zoom level
    const fontSize = Math.round(12 * zoomLevel);
    
    lines.forEach((line, index) => {
      result += `
        <tr>
          <td style="width: 30px; text-align: right; color: ${isDarkMode ? '#9ca3af' : '#999'}; user-select: none; padding-right: 8px; font-size: ${fontSize}px; border-right: 1px solid ${isDarkMode ? '#4b5563' : '#ddd'}; vertical-align: top;">${index + 1}</td>
          <td style="padding-left: 8px; white-space: pre; font-family: monospace; font-size: ${fontSize}px;">${line}</td>
        </tr>
      `;
    });
    
    result += '</table>';
    return result;
  }, [zoomLevel, isDarkMode]);
  
  // Find structural differences between two JSON objects
  const findStructuralDifferences = useCallback((sourceObj: any, targetObj: any, path: string, differences: StructuralDifference[], side: string) => {
    if (typeof sourceObj !== 'object' || sourceObj === null) return;
    
    Object.keys(sourceObj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (targetObj === null || typeof targetObj !== 'object' || !(key in targetObj)) {
        differences.push({
          path: currentPath,
          type: side === 'left' ? 'missing_in_right' : 'missing_in_left',
          description: side === 'left' 
            ? `Field exists in left JSON but missing in right JSON` 
            : `Field exists in right JSON but missing in left JSON`
        });
      } else if (typeof sourceObj[key] === 'object' && sourceObj[key] !== null) {
        // Recursively check nested objects
        findStructuralDifferences(sourceObj[key], targetObj[key], currentPath, differences, side);
      }
    });
  }, []);
  
  // Find value differences between two JSON objects
  const findValueDifferences = useCallback((leftObj: any, rightObj: any, path: string, differences: ValueDifference[]) => {
    if (typeof leftObj !== 'object' || leftObj === null || typeof rightObj !== 'object' || rightObj === null) {
      if (leftObj !== rightObj) {
        differences.push({
          path: path || 'root',
          leftValue: leftObj,
          rightValue: rightObj,
          description: `Values are different`
        });
      }
      return;
    }
    
    // Get common keys (fields that exist in both objects)
    const keys = Object.keys(leftObj).filter(key => Object.keys(rightObj).includes(key));
    
    keys.forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const leftValue = leftObj[key];
      const rightValue = rightObj[key];
      
      if (typeof leftValue !== typeof rightValue) {
        differences.push({
          path: currentPath,
          leftValue: leftValue,
          rightValue: rightValue,
          description: `Types are different: ${typeof leftValue} vs ${typeof rightValue}`
        });
      } else if (typeof leftValue === 'object' && leftValue !== null) {
        // Recursively check nested objects
        findValueDifferences(leftValue, rightValue, currentPath, differences);
      } else if (leftValue !== rightValue) {
        differences.push({
          path: currentPath,
          leftValue: leftValue,
          rightValue: rightValue,
          description: `Values are different`
        });
      }
    });
  }, []);
  
  // Format difference values for display
  const formatDiffValue = useCallback((value: any) => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }, []);
  
  // Compare JSON objects
  const compareJson = useCallback(() => {
    try {
      if (!leftJsonInput.trim() || !rightJsonInput.trim()) {
        setError('Please provide JSON for both sides.');
        return;
      }
      
      const leftJson = JSON.parse(leftJsonInput);
      const rightJson = JSON.parse(rightJsonInput);
      
      const result = {
        structureDifferences: [] as StructuralDifference[],
        valueDifferences: [] as ValueDifference[],
      };
      
      // Compare structure and values based on selected mode
      if (comparisonMode === 'structure' || comparisonMode === 'both') {
        findStructuralDifferences(leftJson, rightJson, '', result.structureDifferences, 'left');
        findStructuralDifferences(rightJson, leftJson, '', result.structureDifferences, 'right');
      }
      
      if (comparisonMode === 'values' || comparisonMode === 'both') {
        findValueDifferences(leftJson, rightJson, '', result.valueDifferences);
      }
      
      // Sort differences by path for better readability
      result.structureDifferences.sort((a, b) => 
        a.path && b.path ? a.path.localeCompare(b.path) : 0
      );
      result.valueDifferences.sort((a, b) => 
        a.path && b.path ? a.path.localeCompare(b.path) : 0
      );
      
      setComparisonResult(result);
      setError('');
    } catch (err: any) {
      setError(`Parsing error: ${err.message}`);
      setComparisonResult(null);
    }
  }, [leftJsonInput, rightJsonInput, comparisonMode, findStructuralDifferences, findValueDifferences]);
  
  // Handle input changes
  const handleLeftInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLeftJsonInput(e.target.value);
  }, []);
  
  const handleRightInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRightJsonInput(e.target.value);
  }, []);
  
  // Clear inputs and results
  const handleClear = useCallback(() => {
    setLeftJsonInput('');
    setRightJsonInput('');
    setComparisonResult(null);
    setError('');
  }, []);
  
  // Render comparison results
  const renderComparisonResults = useCallback(() => {
    if (!comparisonResult) return null;
    
    const { structureDifferences, valueDifferences } = comparisonResult;
    const hasStructuralDiffs = structureDifferences.length > 0 && (comparisonMode === 'structure' || comparisonMode === 'both');
    const hasValueDiffs = valueDifferences.length > 0 && (comparisonMode === 'values' || comparisonMode === 'both');
    
    if (!hasStructuralDiffs && !hasValueDiffs) {
      return (
        <div className={`p-4 border rounded-lg ${
          isDarkMode ? 'bg-green-900 text-green-100 border-green-800' : 'bg-green-50 text-green-800 border-green-100'
        }`}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">No differences found! The JSON objects are identical.</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Summary of differences */}
        <div className={`p-4 border rounded-lg ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Comparison Summary
          </h3>
          <div className="flex flex-wrap gap-4">
            {hasStructuralDiffs && (
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-200' : 'bg-red-50 text-red-800'
              }`}>
                <div className="font-semibold">Structural Differences: {structureDifferences.length}</div>
                <div className="text-sm mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                  }`}>
                    Missing in Right: {structureDifferences.filter(d => d.type === 'missing_in_right').length}
                  </span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                  }`}>
                    Missing in Left: {structureDifferences.filter(d => d.type === 'missing_in_left').length}
                  </span>
                </div>
              </div>
            )}
            
            {hasValueDiffs && (
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-amber-900 bg-opacity-20 text-amber-200' : 'bg-amber-50 text-amber-800'
              }`}>
                <div className="font-semibold">Value Differences: {valueDifferences.length}</div>
                <div className="text-sm mt-1">
                  In fields that exist in both JSON objects
                </div>
              </div>
            )}
          </div>
        </div>
        
        {hasStructuralDiffs && (
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Structural Differences ({structureDifferences.length})
            </h3>
            <div className={`border rounded-lg overflow-hidden ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <table className="w-full">
                <thead className={`${
                  isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'
                }`}>
                  <tr>
                    <th className="px-4 py-2 text-left">Path</th>
                    <th className="px-4 py-2 text-left">Issue</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700 text-gray-300' : 'divide-gray-200'
                }`}>
                  {structureDifferences.map((diff, index) => (
                    <tr key={`struct-${index}`} className={`${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    } ${diff.type === 'missing_in_right' 
                      ? isDarkMode ? 'bg-red-900 bg-opacity-20' : 'bg-red-50' 
                      : isDarkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50'
                    }`}>
                      <td className="px-4 py-3 font-mono text-sm">{diff.path}</td>
                      <td className="px-4 py-3">{diff.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {hasValueDiffs && (
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Value Differences ({valueDifferences.length})
            </h3>
            <div className={`border rounded-lg overflow-hidden ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <table className="w-full">
                <thead className={`${
                  isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'
                }`}>
                  <tr>
                    <th className="px-4 py-2 text-left">Path</th>
                    <th className="px-4 py-2 text-left">Left Value</th>
                    <th className="px-4 py-2 text-left">Right Value</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700 text-gray-300' : 'divide-gray-200'
                }`}>
                  {valueDifferences.map((diff, index) => (
                    <tr key={`value-${index}`} className={`${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <td className="px-4 py-3 font-mono text-sm align-top">{diff.path}</td>
                      <td className={`px-4 py-3 font-mono text-sm whitespace-pre-wrap align-top ${
                        isDarkMode ? 'text-red-300' : 'text-red-600'
                      }`}>
                        {formatDiffValue(diff.leftValue)}
                      </td>
                      <td className={`px-4 py-3 font-mono text-sm whitespace-pre-wrap align-top ${
                        isDarkMode ? 'text-green-300' : 'text-green-600'
                      }`}>
                        {formatDiffValue(diff.rightValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Simple JSON Side-by-Side View */}
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Side-by-Side View
          </h3>
          <div className="flex flex-row gap-4">
            <div className="w-1/2 min-w-0">
              <div className={`p-2 rounded-lg font-semibold text-center ${
                isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200'
              }`}>
                Left JSON
              </div>
              <div className={`mt-2 p-4 rounded-lg border shadow-inner overflow-auto max-h-96 ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                {leftJsonInput ? 
                  <div dangerouslySetInnerHTML={{ 
                    __html: addLineNumbers(highlightJson(JSON.parse(leftJsonInput), isDarkMode), 'json') 
                  }} />
                : ''}
              </div>
            </div>
            <div className="w-1/2 min-w-0">
              <div className={`p-2 rounded-lg font-semibold text-center ${
                isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200'
              }`}>
                Right JSON
              </div>
              <div className={`mt-2 p-4 rounded-lg border shadow-inner overflow-auto max-h-96 ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                {rightJsonInput ? 
                  <div dangerouslySetInnerHTML={{ 
                    __html: addLineNumbers(highlightJson(JSON.parse(rightJsonInput), isDarkMode), 'json') 
                  }} />
                : ''}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <div className={`px-3 py-1 rounded-lg text-sm flex items-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className="w-3 h-3 rounded-full bg-red-500 bg-opacity-30 mr-2"></span>
                <span>Missing in Right</span>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm flex items-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className="w-3 h-3 rounded-full bg-green-500 bg-opacity-30 mr-2"></span>
                <span>Missing in Left</span>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm flex items-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className="w-3 h-3 rounded-full bg-amber-500 bg-opacity-30 mr-2"></span>
                <span>Different Values</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [comparisonResult, comparisonMode, isDarkMode, formatDiffValue, leftJsonInput, rightJsonInput, highlightJson, addLineNumbers]);
  
  return (
    <div className="w-full">
      <div className="mb-4">
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          isDarkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-blue-50 text-blue-800 border border-blue-100'
        }`}>
          <strong>Comparison Mode:</strong> 
          <div className="mt-2 flex flex-wrap gap-2">
            <label className={`flex items-center cursor-pointer ${
              comparisonMode === 'both' 
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            } px-3 py-1 rounded-lg`}>
              <input 
                type="radio" 
                name="comparisonMode" 
                value="both" 
                checked={comparisonMode === 'both'}
                onChange={() => setComparisonMode('both')}
                className="sr-only"
              />
              <span>Complete Comparison</span>
            </label>
            <label className={`flex items-center cursor-pointer ${
              comparisonMode === 'structure' 
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            } px-3 py-1 rounded-lg`}>
              <input 
                type="radio" 
                name="comparisonMode" 
                value="structure" 
                checked={comparisonMode === 'structure'}
                onChange={() => setComparisonMode('structure')}
                className="sr-only"
              />
              <span>Structure Only</span>
            </label>
            <label className={`flex items-center cursor-pointer ${
              comparisonMode === 'values' 
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            } px-3 py-1 rounded-lg`}>
              <input 
                type="radio" 
                name="comparisonMode" 
                value="values" 
                checked={comparisonMode === 'values'}
                onChange={() => setComparisonMode('values')}
                className="sr-only"
              />
              <span>Values Only</span>
            </label>
          </div>
        </div>
        
        {/* JSON Inputs */}
        <div className="flex flex-row space-x-4">
          <div className="flex-1">
            <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Left JSON</h3>
            <textarea
              value={leftJsonInput}
              onChange={handleLeftInputChange}
              placeholder="Paste your first JSON here..."
              className={`w-full h-64 p-3 border rounded-lg font-mono text-sm mb-2 outline-none transition ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Right JSON</h3>
            <textarea
              value={rightJsonInput}
              onChange={handleRightInputChange}
              placeholder="Paste your second JSON here..."
              className={`w-full h-64 p-3 border rounded-lg font-mono text-sm mb-2 outline-none transition ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>
        </div>
        
        <div className="flex space-x-3 mt-4">
          <button
            onClick={compareJson}
            className={`px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="Compare (Ctrl+Shift+C)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Compare
          </button>
          <button
            onClick={handleClear}
            className={`px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center ${
              isDarkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className={`p-4 mb-4 rounded-lg flex items-center ${
          isDarkMode 
            ? 'bg-red-900 text-red-200 border-l-4 border-red-600' 
            : 'bg-red-50 text-red-600 border-l-4 border-red-500'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Comparison Results */}
      {comparisonResult && (
        <div className="mt-6" ref={leftContentRef}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Comparison Results</h2>
              <div className="ml-4 flex items-center space-x-2">
                <button 
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                  className={`p-1 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Smaller Font Size"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{Math.round(zoomLevel * 100)}%</span>
                <button 
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                  className={`p-1 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Larger Font Size"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <button 
                  onClick={() => setZoomLevel(1)}
                  className={`p-1 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Reset Zoom"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ fontSize: `${Math.round(14 * zoomLevel)}px` }}>
            {renderComparisonResults()}
          </div>
        </div>
      )}
    </div>
  );
});

// App Tab Navigation
const TabNavigation = ({ activeTab, setActiveTab, isDarkMode }: TabNavigationProps) => {
  return (
    <div className={`flex border-b mb-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <button
        className={`py-3 px-6 focus:outline-none ${
          activeTab === 'explorer'
            ? isDarkMode 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'border-b-2 border-blue-600 text-blue-600'
            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
        onClick={() => setActiveTab('explorer')}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          JSON VAST Explorer
        </div>
      </button>
      <button
        className={`py-3 px-6 focus:outline-none ${
          activeTab === 'comparator'
            ? isDarkMode 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'border-b-2 border-blue-600 text-blue-600'
            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}
        onClick={() => setActiveTab('comparator')}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          JSON Diff Inspector
        </div>
      </button>
    </div>
  );
};

// Main Application Component
function JsonToolsApp() {
  // Shared state between tools
  const [activeTab, setActiveTab] = useState('explorer');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [history, setHistory] = useState<HistoryItemType[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl (or Cmd) + Shift + Key combination
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'd': // Toggle Dark Mode
            e.preventDefault();
            setIsDarkMode(prev => !prev);
            break;
          case 'h': // Show/hide history
            if (activeTab === 'explorer') {
              e.preventDefault();
              setShowHistory(prev => !prev);
            }
            break;
          case '1': // Switch to Explorer tab
            e.preventDefault();
            setActiveTab('explorer');
            break;
          case '2': // Switch to Comparator tab
            e.preventDefault();
            setActiveTab('comparator');
            break;
          default:
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white'} transition-colors duration-200`}>
      <div className="p-6 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>JSON Tools</h1>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Explorer & Diff Inspector</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {activeTab === 'explorer' && (
            <button 
              onClick={() => setShowHistory(prev => !prev)}
              className={`flex items-center px-4 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition`}
              title="Show/Hide History (Ctrl+Shift+H)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showHistory ? 'Hide' : 'Show'} History ({history.length})
            </button>
          )}
          
          <button 
            onClick={() => setIsDarkMode(prev => !prev)}
            className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition flex items-center ml-auto`}
            title="Toggle Dark Mode (Ctrl+Shift+D)"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <TabNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDarkMode={isDarkMode} 
      />
      
      {/* Keyboard Shortcuts Help */}
      <div className={`mb-4 p-3 rounded-lg text-sm ${
        isDarkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-blue-50 text-blue-800 border border-blue-100'
      }`}>
        <strong>Keyboard Shortcuts:</strong> 
        {activeTab === 'explorer' ? (
          <span>
            Ctrl+Shift+F (Format), 
            Ctrl+Shift+L (Clear), 
            Ctrl+Shift+H (History), 
            Ctrl+Shift+D (Dark Mode), 
            Ctrl+Shift+1/2 (Switch Tabs)
          </span>
        ) : (
          <span>
            Ctrl+Shift+C (Compare), 
            Ctrl+Shift+L (Clear), 
            Ctrl+Shift+D (Dark Mode), 
            Ctrl+Shift+1/2 (Switch Tabs)
          </span>
        )}
      </div>
      
      {/* Active Tool Content */}
      {activeTab === 'explorer' ? (
        <JsonVastExplorer 
          isDarkMode={isDarkMode} 
          history={history}
          setHistory={setHistory}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
        />
      ) : (
        <JsonDiffInspector 
          isDarkMode={isDarkMode} 
        />
      )}
      </div>
    </div>
  );
}

export default JsonToolsApp; 