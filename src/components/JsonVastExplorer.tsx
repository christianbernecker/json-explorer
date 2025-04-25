import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
import HistoryItem from './shared/HistoryItem';
import SearchPanel from './shared/SearchPanel';
import JsonExplorerHeader from './JsonExplorerHeader';

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
  }, [handleFormat, handleClear]); // Add dependencies

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

  return (
    <div className={`px-4 py-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} min-h-screen transition-colors`}>
      {showHistory && (
        <div className={`mb-6 p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
      
      {/* Header mit Status und Aktionen */}
      <JsonExplorerHeader 
        isDarkMode={isDarkMode}
        hasJsonContent={!!formattedJson}
        hasVastContent={!!embeddedVastContent}
        characterCount={jsonInput ? jsonInput.length : 0}
        resetFields={handleClear}
        handleFormat={handleFormat}
        copyJsonToClipboard={copyJsonToClipboard}
        copyVastToClipboard={copyVastToClipboard}
        copyVastUrlToClipboard={copyVastUrlToClipboard}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
      />
      
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
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Formatted JSON</h2>
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
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>VAST AdTag URL</h2>
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
          <div className="flex items-center mb-3">
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
});

export default JsonVastExplorer; 