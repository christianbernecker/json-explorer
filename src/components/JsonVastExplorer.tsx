import React, { useState, useRef, useCallback, useEffect } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
import HistoryItem from './shared/HistoryItem';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark as syntaxDark, atomOneLight as syntaxLight } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

// Benutzerdefiniertes Farbschema für JSON-Highlighting, das dem Original entspricht
const customJsonStyle = {
  ...syntaxLight,
  "punctuation": { "color": "#24292e" },
  "property": { "color": "#005cc5" },
  "string": { "color": "#22863a" },
  "number": { "color": "#e36209" },
  "boolean": { "color": "#005cc5" },
  "null": { "color": "#005cc5" }
};

const customJsonDarkStyle = {
  ...syntaxDark,
  "punctuation": { "color": "#e1e4e8" },
  "property": { "color": "#79b8ff" },
  "string": { "color": "#85e89d" },
  "number": { "color": "#f97583" },
  "boolean": { "color": "#79b8ff" },
  "null": { "color": "#79b8ff" }
};

// VastInfo type for internal use
interface VastInfo {
  path: string;
  content: string;
}

// Component Start
const JsonVastExplorer = React.memo(({ 
  isDarkMode, 
  history, 
  setHistory,
  showHistory,
  setShowHistory
}: JsonVastExplorerProps) => {
  // Explorer state
  const [jsonInput, setJsonInput] = useState('');
  const [formattedJson, setFormattedJson] = useState<any>(null);
  const [embeddedVastContent, setEmbeddedVastContent] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vastPath, setVastPath] = useState('');
  const [vastUrl, setVastUrl] = useState('');
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Suche-States
  const [jsonSearchTerm, setJsonSearchTerm] = useState('');
  const [vastSearchTerm, setVastSearchTerm] = useState('');
  
  // Refs for search functionality
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const jsonOutputRef = useRef<HTMLDivElement>(null);
  const vastOutputRef = useRef<HTMLDivElement>(null);
  
  // Custom hook for Syntax Highlighting
  const { formatXml } = useHighlighter();
  
  // Helper function to add to history
  const addToHistoryItem = useCallback((item: HistoryItemType) => {
    setHistory(prev => [item, ...prev].slice(0, 10));
  }, [setHistory]);
  
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
        
        addToHistoryItem(newHistoryItem);
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
        
        addToHistoryItem(newHistoryItem);
      }
    } catch (err: any) {
      setError(`Parsing error: ${err.message}`);
      setFormattedJson(null);
      setEmbeddedVastContent(null);
      setVastPath('');
      setVastUrl('');
    }
  }, [jsonInput, findVastContent, formatXml, extractVastUrl, addToHistoryItem]);
  
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
    setZoomLevel(1);
    setJsonSearchTerm('');
    setVastSearchTerm('');
  }, []);

  // Kopieren des JSON-Inhalts in die Zwischenablage
  const copyJsonToClipboard = useCallback(() => {
    if (formattedJson) {
      copyToClipboard(JSON.stringify(formattedJson, null, 2), 'JSON');
    }
  }, [formattedJson, copyToClipboard]);

  // Kopieren des VAST-Inhalts in die Zwischenablage
  const copyVastToClipboard = useCallback(() => {
    if (embeddedVastContent) {
      copyToClipboard(embeddedVastContent, 'VAST');
    }
  }, [embeddedVastContent, copyToClipboard]);

  // Kopieren der VAST-URL in die Zwischenablage
  const copyVastUrlToClipboard = useCallback(() => {
    if (vastUrl) {
      copyToClipboard(vastUrl, 'URL');
    }
  }, [vastUrl, copyToClipboard]);

  // Suchfunktion für JSON-Output
  const handleJsonSearch = useCallback(() => {
    if (!jsonOutputRef.current || !jsonSearchTerm) return;
    
    // Einfache Textsuche implementieren
    const content = jsonOutputRef.current;
    const htmlContent = content.innerHTML;
    
    // Alle vorherigen Highlights entfernen
    const cleanedHtml = htmlContent.replace(/<mark class="search-highlight">([^<]+)<\/mark>/g, '$1');
    
    if (jsonSearchTerm) {
      // Neue Highlights hinzufügen (case-insensitive)
      const regex = new RegExp(`(${jsonSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const highlightedHtml = cleanedHtml.replace(regex, '<mark class="search-highlight">$1</mark>');
      content.innerHTML = highlightedHtml;
    } else {
      content.innerHTML = cleanedHtml;
    }
  }, [jsonSearchTerm]);

  // Suchfunktion für VAST-Output
  const handleVastSearch = useCallback(() => {
    if (!vastOutputRef.current || !vastSearchTerm) return;
    
    // Einfache Textsuche implementieren
    const content = vastOutputRef.current;
    const htmlContent = content.innerHTML;
    
    // Alle vorherigen Highlights entfernen
    const cleanedHtml = htmlContent.replace(/<mark class="search-highlight">([^<]+)<\/mark>/g, '$1');
    
    if (vastSearchTerm) {
      // Neue Highlights hinzufügen (case-insensitive)
      const regex = new RegExp(`(${vastSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const highlightedHtml = cleanedHtml.replace(regex, '<mark class="search-highlight">$1</mark>');
      content.innerHTML = highlightedHtml;
    } else {
      content.innerHTML = cleanedHtml;
    }
  }, [vastSearchTerm]);

  // Suchfunktionen aufrufen, wenn sich die Suchbegriffe ändern
  useEffect(() => {
    handleJsonSearch();
  }, [jsonSearchTerm, handleJsonSearch]);

  useEffect(() => {
    handleVastSearch();
  }, [vastSearchTerm, handleVastSearch]);

  // Add keyboard shortcuts specific to this component
  useEffect(() => {
    const handleExplorerKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'f': // Format JSON/VAST
            e.preventDefault();
            handleFormat();
            break;
          case 'l': // Clear Input & Output
            e.preventDefault();
            handleClear();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleExplorerKeyDown);
    return () => {
      document.removeEventListener('keydown', handleExplorerKeyDown);
    };
  }, [handleFormat, handleClear]);

  // Return the UI - Festes Layout mit Drei-Spalten
  return (
    <div className={`px-6 py-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} min-h-screen transition-colors`}>
      {showHistory && (
        <div className={`mb-8 p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
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

      {/* Main Content Area - Festes Layout mit Drei-Spalten */}
      <div className={`grid grid-cols-3 gap-6 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`} style={{ minHeight: '700px' }}>
        {/* Linke Spalte - JSON Input (immer 1/3) */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>JSON Input</h3>
          <div className="flex flex-col h-full">
            <textarea
              ref={textAreaRef}
              value={jsonInput}
              onChange={handleJsonInputChange}
              className={`flex-1 p-4 font-mono text-sm resize-none outline-none rounded-md ${
                isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'
              } border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
              placeholder="Geben Sie hier Ihren JSON-Code ein..."
            />
            <div className="flex mt-3">
              <div className="w-full flex justify-start space-x-2">
                <button
                  onClick={handleFormat}
                  className={`flex items-center px-3 py-1.5 rounded text-sm font-medium ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Format
                </button>
                <button
                  onClick={handleClear}
                  className={`flex items-center px-3 py-1.5 rounded text-sm font-medium ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mittlere Spalte - Formatted JSON */}
        <div className={`${embeddedVastContent ? 'col-span-1' : 'col-span-2'} ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Formatted JSON</h3>
            {formattedJson && (
              <div className="relative w-48">
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={jsonSearchTerm}
                  onChange={(e) => setJsonSearchTerm(e.target.value)}
                  className={`w-full py-1 px-3 pr-8 rounded text-sm ${
                    isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                  } border focus:outline-none focus:ring-1 ${
                    isDarkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-400'
                  }`}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 absolute right-2 top-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="h-full overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            {formattedJson ? (
              <div ref={jsonOutputRef}>
                <SyntaxHighlighter
                  language="json"
                  style={isDarkMode ? customJsonDarkStyle : customJsonStyle}
                  customStyle={{
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    padding: '1rem',
                    overflowX: 'auto',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    lineHeight: '1.6',
                    height: 'auto',
                    minHeight: '400px'
                  }}
                  showLineNumbers={true}
                  lineNumberStyle={{
                    color: isDarkMode ? '#6b7280' : '#9ca3af',
                    paddingRight: '1.5em',
                    textAlign: 'right',
                    userSelect: 'none',
                    borderRight: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    marginRight: '1.5em',
                    minWidth: '2.5em'
                  }}
                  codeTagProps={{
                    style: {
                      display: 'inline-block',
                      width: '100%'
                    }
                  }}
                >
                  {JSON.stringify(formattedJson, null, 2)}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div className={`flex items-center justify-center h-64 text-center p-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-lg">Klicken Sie auf "Format", um JSON zu formatieren und anzuzeigen</p>
                </div>
              </div>
            )}
            {formattedJson && (
              <div className="mt-4">
                <button 
                  onClick={copyJsonToClipboard} 
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                    isDarkMode 
                      ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-200' 
                      : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  Copy JSON
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rechte Spalte - VAST Explorer (nur wenn VAST gefunden wurde) */}
        {embeddedVastContent && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-md border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>VAST Explorer</h3>
              <div className="relative w-48">
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={vastSearchTerm}
                  onChange={(e) => setVastSearchTerm(e.target.value)}
                  className={`w-full py-1 px-3 pr-8 rounded text-sm ${
                    isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                  } border focus:outline-none focus:ring-1 ${
                    isDarkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-400'
                  }`}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 absolute right-2 top-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="h-full overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
              {/* VAST AdTag URL */}
              <div className="mb-4">
                <h4 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>VAST AdTag URL</h4>
                <div className={`p-3 rounded-md font-mono text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} overflow-x-auto`}>
                  {vastUrl}
                </div>
                
                {/* Copy URL Button unter der VAST URL */}
                <div className="mt-2">
                  <button 
                    onClick={copyVastUrlToClipboard} 
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Copy URL
                  </button>
                </div>
              </div>
              
              {/* Embedded VAST Output */}
              <div>
                <h4 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Embedded VAST</h4>
                <div className={`p-3 rounded-md font-mono text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} overflow-x-auto`} ref={vastOutputRef}>
                  <SyntaxHighlighter
                    language="xml"
                    style={isDarkMode ? syntaxDark : syntaxLight}
                    customStyle={{
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      padding: '1rem',
                      overflowX: 'auto',
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      lineHeight: '1.6',
                      height: 'auto',
                      minHeight: '300px'
                    }}
                    showLineNumbers={true}
                    lineNumberStyle={{
                      color: isDarkMode ? '#6b7280' : '#9ca3af',
                      paddingRight: '1.5em',
                      textAlign: 'right',
                      userSelect: 'none',
                      borderRight: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                      marginRight: '1.5em',
                      minWidth: '2.5em'
                    }}
                    codeTagProps={{
                      style: {
                        display: 'inline-block',
                        width: '100%'
                      }
                    }}
                  >
                    {embeddedVastContent}
                  </SyntaxHighlighter>
                </div>
                
                {/* Copy VAST Button unter dem VAST Inhalt */}
                <div className="mt-4">
                  <button 
                    onClick={copyVastToClipboard} 
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    Copy VAST
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Styles für die Suchfunktion */}
      <style jsx global>{`
        .search-highlight {
          background-color: ${isDarkMode ? '#ffab00' : '#ffff00'};
          color: ${isDarkMode ? '#000000' : '#000000'};
          border-radius: 2px;
          padding: 0 2px;
        }
      `}</style>
    </div>
  );
});

export default JsonVastExplorer; 