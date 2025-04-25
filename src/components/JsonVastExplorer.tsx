import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
import HistoryItem from './shared/HistoryItem';
import SearchPanel from './shared/SearchPanel';
import JsonExplorerHeader from './JsonExplorerHeader';
import FlexibleJsonLayout, { PanelConfig } from './FlexibleJsonLayout';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark as syntaxDark, atomOneLight as syntaxLight } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

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

  // Panel-Konfiguration
  const panels = useMemo(() => {
    return [
      // Input-Panel (1/3 der Breite)
      {
        id: 'input',
        title: 'JSON Input',
        collapsible: true,
        content: (
          <div className="flex flex-col h-full">
            <textarea
              ref={textAreaRef}
              value={jsonInput}
              onChange={handleJsonInputChange}
              className={`flex-1 p-4 font-mono text-sm resize-none outline-none rounded-md ${
                isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-800'
              } border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
              placeholder="Geben Sie hier Ihren JSON-Code ein..."
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleFormat}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                  isDarkMode
                    ? 'bg-green-900 hover:bg-green-800 text-green-200'
                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                Format
              </button>
              <button
                onClick={handleClear}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                  isDarkMode
                    ? 'bg-red-900 hover:bg-red-800 text-red-200'
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
            </div>
          </div>
        ),
      },
      
      // Output-Panel (2/3 der Breite, enthält Formatted JSON und VAST Explorer)
      {
        id: 'output',
        title: 'Output',
        collapsible: true,
        content: (
          <div className="flex flex-col h-full">
            {/* Zoom-Steuerelemente am oberen Rand des Output-Panels */}
            <div className="flex items-center justify-end space-x-2 mb-3">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Zoom:</span>
              <button 
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                className={`p-1 rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Kleiner (Ctrl+Shift+-)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                title="Größer (Ctrl+Shift++)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                title="Zurücksetzen (Ctrl+Shift+0)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
              {/* Formatted JSON-Bereich */}
              <div className="mb-6">
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Formatted JSON</h3>
                <div className="relative">
                  <SyntaxHighlighter
                    language="json"
                    style={isDarkMode ? syntaxDark : syntaxLight}
                    customStyle={{
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      padding: '1rem',
                      overflowX: 'auto',
                    }}
                  >
                    {formattedJson}
                  </SyntaxHighlighter>
                  
                  {/* Copy JSON Button unter dem Formatted JSON */}
                  <div className="mt-2">
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
                </div>
              </div>

              {/* VAST Explorer-Bereich, nur anzeigen wenn VAST-Inhalt vorhanden */}
              {embeddedVastContent && (
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>VAST Explorer</h3>
                  
                  {/* VAST AdTag URL */}
                  <div className="mb-4">
                    <h4 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>VAST AdTag URL</h4>
                    <div className={`p-3 rounded-md font-mono text-sm ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} overflow-x-auto`}>
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
                    <div className={`p-3 rounded-md font-mono text-sm ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} overflow-x-auto`}>
                      <SyntaxHighlighter
                        language="xml"
                        style={isDarkMode ? syntaxDark : syntaxLight}
                        customStyle={{
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          padding: '1rem',
                          overflowX: 'auto',
                        }}
                      >
                        {embeddedVastContent}
                      </SyntaxHighlighter>
                    </div>
                    
                    {/* Copy VAST Button unter dem VAST Inhalt */}
                    <div className="mt-2">
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
              )}
            </div>
          </div>
        ),
      }
    ];
  }, [jsonInput, formattedJson, embeddedVastContent, vastUrl, isDarkMode, zoomLevel, copyJsonToClipboard, 
      copyVastToClipboard, copyVastUrlToClipboard, handleClear, handleFormat]);

  // Layout Konfiguration
  const layouts = useMemo(() => ({
    lg: [
      { i: 'input', x: 0, y: 0, w: 4, h: 12 },   // Input-Panel nimmt 1/3 der Breite ein
      { i: 'output', x: 4, y: 0, w: 8, h: 12 },  // Output-Panel nimmt 2/3 der Breite ein
    ],
    md: [
      { i: 'input', x: 0, y: 0, w: 4, h: 12 },
      { i: 'output', x: 4, y: 0, w: 8, h: 12 },
    ],
    sm: [
      { i: 'input', x: 0, y: 0, w: 4, h: 12 },
      { i: 'output', x: 4, y: 0, w: 8, h: 12 },
    ],
    xs: [
      { i: 'input', x: 0, y: 0, w: 12, h: 6 },   // Auf kleineren Bildschirmen übereinander
      { i: 'output', x: 0, y: 6, w: 12, h: 12 },
    ],
    xxs: [
      { i: 'input', x: 0, y: 0, w: 2, h: 6 },
      { i: 'output', x: 0, y: 6, w: 2, h: 12 },
    ],
  }), []);

  // Return the UI
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
      
      {/* Header mit Status und Aktionen - immer anzeigen */}
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

      {/* FlexibleJsonLayout anstelle des bisherigen Layouts */}
      <FlexibleJsonLayout 
        panels={panels}
        initialLayouts={layouts}
        isDarkMode={isDarkMode}
      />
    </div>
  );
});

export default JsonVastExplorer; 