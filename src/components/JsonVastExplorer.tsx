import React, { useState, useRef, useCallback, useEffect } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import HistoryItem from './shared/HistoryItem';
import { KeyboardShortcutsBox } from './shared';

// VastInfo type for internal use
interface VastInfo {
  path: string;
  content: string;
}

// Definiere addLineNumbers hier, da es nicht vom Hook kommt
const addLineNumbersGlobal = (html: string, language: string, isDarkMode: boolean) => {
  if (!html) return '';
  const lines = html.split('\n');
  // Angepasste Zoom-Logik (hier fix auf 100%)
  const zoomLevel = 1;
  const fontSize = Math.round(12 * zoomLevel);
  let result = '<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; table-layout: fixed; border-collapse: collapse;">';
  lines.forEach((line, index) => {
    result += `
      <tr>
        <td style="width: 30px; text-align: right; color: ${isDarkMode ? '#9ca3af' : '#999'}; user-select: none; padding-right: 8px; font-size: ${fontSize}px; border-right: 1px solid ${isDarkMode ? '#4b5563' : '#ddd'}; vertical-align: top;">${index + 1}</td>
        <td style="padding-left: 8px; white-space: pre-wrap; font-family: monospace; font-size: ${fontSize}px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-all; max-width: calc(100% - 38px);">${line}</td>
      </tr>
    `;
  });
  result += '</table>';
  return result;
};

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
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [formattedVast, setFormattedVast] = useState<string | null>(null);
  const [vastUrl, setVastUrl] = useState('');
  const [error, setError] = useState('');
  
  // Suche-States
  const [jsonSearchTerm, setJsonSearchTerm] = useState('');
  const [vastSearchTerm, setVastSearchTerm] = useState('');
  const [showJsonSearch, setShowJsonSearch] = useState(false);
  const [showVastSearch, setShowVastSearch] = useState(false);
  
  // Refs for search functionality
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const jsonOutputRef = useRef<HTMLDivElement>(null);
  const vastOutputRef = useRef<HTMLDivElement>(null);
  
  // Custom hook for Syntax Highlighting
  const { highlightJson, formatXml } = useHighlighter();
  
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
      
      const currentParsedJson = JSON.parse(inputStr);
      setParsedJson(currentParsedJson);
      setError('');
      
      const vastInfo = findVastContent(currentParsedJson);
      if (vastInfo) {
        const currentFormattedVast = formatXml(vastInfo.content);
        const url = extractVastUrl(vastInfo.content);
        
        setFormattedVast(currentFormattedVast);
        setVastUrl(url || '');
        
        const newHistoryItem: HistoryItemType = {
          type: 'json_vast',
          jsonContent: currentParsedJson,
          vastContent: currentFormattedVast,
          vastUrl: url || '',
          timestamp: Date.now()
        };
        
        addToHistoryItem(newHistoryItem);
      } else {
        setFormattedVast(null);
        setVastUrl('');
        
        const newHistoryItem: HistoryItemType = {
          type: 'json',
          content: currentParsedJson,
          timestamp: Date.now()
        };
        
        addToHistoryItem(newHistoryItem);
      }
    } catch (err: any) {
      setError(`Parsing error: ${err.message}`);
      setParsedJson(null);
      setFormattedVast(null);
      setVastUrl('');
    }
  }, [jsonInput, findVastContent, formatXml, extractVastUrl, addToHistoryItem]);
  
  // Copy content to clipboard - Optimized with useCallback
  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        console.log(`${type} copied!`);
      },
      (err) => console.error('Error copying: ', err)
    );
  }, []);
  
  // Handle JSON input change
  const handleJsonInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonInput(e.target.value);
  }, []);
  
  // Restore from history
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const restoreFromHistory = useCallback((item: HistoryItemType) => {
    if (item.type === 'json') {
      setJsonInput(JSON.stringify(item.content, null, 2));
      setParsedJson(item.content);
      setFormattedVast(null);
      setVastUrl('');
      setError('');
    } else {
      setJsonInput(JSON.stringify(item.jsonContent, null, 2));
      setParsedJson(item.jsonContent);
      setFormattedVast(item.vastContent || null);
      setVastUrl(item.vastUrl || '');
      setError('');
    }
    setShowHistory(false);
  }, [setShowHistory]);
  
  // Clear all fields
  const handleClear = useCallback(() => {
    setJsonInput('');
    setParsedJson(null);
    setFormattedVast(null);
    setVastUrl('');
    setError('');
    setJsonSearchTerm('');
    setVastSearchTerm('');
    setShowJsonSearch(false);
    setShowVastSearch(false);
  }, []);

  // Kopieren des JSON-Inhalts in die Zwischenablage
  const copyJsonToClipboard = useCallback(() => {
    if (parsedJson) {
      copyToClipboard(JSON.stringify(parsedJson, null, 2), 'JSON');
    }
  }, [parsedJson, copyToClipboard]);

  // Kopieren des VAST-Inhalts in die Zwischenablage
  const copyVastToClipboard = useCallback(() => {
    if (formattedVast) {
      copyToClipboard(formattedVast, 'VAST');
    }
  }, [formattedVast, copyToClipboard]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleExplorerKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not in input fields (except for specific ones)
      const isInputActive = document.activeElement?.tagName === 'INPUT' || 
                            document.activeElement?.tagName === 'TEXTAREA';
                            
      // Format JSON with Ctrl+Enter or Cmd+Enter (always allow, even in text area)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleFormat();
        return;
      }
      
      // Don't handle other shortcuts if in input fields
      if (isInputActive) return;
      
      // Clear with Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };
    
    document.addEventListener('keydown', handleExplorerKeyDown);
    return () => document.removeEventListener('keydown', handleExplorerKeyDown);
  }, [handleFormat, handleClear]);

  // Helfer zum Rendern des Highlighting-Outputs
  const renderHighlightedOutput = (content: any, language: 'json' | 'xml', ref: React.RefObject<HTMLDivElement>) => {
    if (!content) return null;
    let highlightedHtml = '';
    if (language === 'json') {
      highlightedHtml = highlightJson(content, isDarkMode);
    } else if (language === 'xml') {
      highlightedHtml = content; // formatXml hat bereits <pre> etc.
    }
    
    // Verwende die hier definierte Funktion
    const contentWithLines = addLineNumbersGlobal(highlightedHtml, language, isDarkMode); 

    return (
      <div 
        ref={ref}
        dangerouslySetInnerHTML={{ __html: contentWithLines }}
        className="overflow-x-auto whitespace-pre break-words w-full"
        style={{ maxWidth: "100%" }} // Stellt sicher, dass die Tabelle nicht überläuft
      />
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex flex-row space-x-4">
          <div className="flex-1">
            <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>JSON Input</h3>
            <textarea
              ref={textAreaRef}
              value={jsonInput}
              onChange={handleJsonInputChange}
              placeholder="Paste your JSON here..."
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
            onClick={handleFormat}
            className={`px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="Format JSON (Ctrl+Shift+F)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /> 
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
            title="Clear Input (Ctrl+Shift+L)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

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
      
      {(parsedJson || formattedVast) && (
        <div className="mt-6">
           <h2 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Output</h2>
           <div className="flex flex-row space-x-4">
             {parsedJson && (
                <div className={`${formattedVast ? 'w-1/2' : 'w-full'} min-w-0`}>
                  <div className={`p-2 rounded-lg font-semibold text-center mb-2 ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200'}`}>Formatted JSON</div>
                   <div className={`p-4 rounded-lg border shadow-inner overflow-auto max-h-96 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-end space-x-2 mb-2">
                         <button onClick={() => setShowJsonSearch(!showJsonSearch)} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>Find</button>
                         <button onClick={copyJsonToClipboard} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>Copy</button>
                      </div>
                      {renderHighlightedOutput(parsedJson, 'json', jsonOutputRef)}
                   </div>
               </div>
             )}
             {formattedVast && (
               <div className="w-1/2 min-w-0">
                 <div className={`p-2 rounded-lg font-semibold text-center mb-2 ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200'}`}>VAST Explorer</div>
                 <div className={`p-4 rounded-lg border shadow-inner overflow-auto max-h-96 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-end space-x-2 mb-2">
                        <button onClick={() => setShowVastSearch(!showVastSearch)} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>Find</button>
                        <button onClick={copyVastToClipboard} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>Copy</button>
                     </div>
                     {renderHighlightedOutput(formattedVast, 'xml', vastOutputRef)}
                     {vastUrl && (
                       <div className={`mt-2 p-2 text-xs rounded flex justify-between items-center ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                         <span className="truncate flex-grow mr-2" title={vastUrl}>{vastUrl}</span>
                         <button onClick={copyVastUrlToClipboard} className={`px-2 py-0.5 rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}>Copy URL</button>
                       </div>
                     )}
                 </div>
               </div>
             )}
           </div>
        </div>
      )}
      
      <div className="mt-6 relative">
           <KeyboardShortcutsBox
             isDarkMode={isDarkMode}
             keyboardShortcuts={[
               { key: 'Ctrl+Shift+F', description: 'Format JSON' },
               { key: 'Ctrl+Shift+L', description: 'Clear Input' }
             ]}
           />
      </div>
      
    </div>
  );
});

export default JsonVastExplorer;

export {};
