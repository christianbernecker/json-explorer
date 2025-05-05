import React, { useState, useRef, useCallback, useEffect } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import HistoryItem from './shared/HistoryItem';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark as syntaxDark, atomOneLight as syntaxLight } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { Box, Button, Typography } from '@mui/material';
import { FormatAlignLeft, Clear, Search, ContentCopy } from '@mui/icons-material';
import { KeyboardShortcutsBox, SearchPanel } from './shared';
import JsonExplorerHeader from './JsonExplorerHeader';
import FlexibleJsonLayout from './FlexibleJsonLayout';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const customJsonStyle = {
  ...syntaxLight,
  "punctuation": { "color": "#24292e" },
  "property": { "color": "#005cc5" },
  "string": { "color": "#22863a" },
  "number": { "color": "#e36209" },
  "boolean": { "color": "#005cc5" },
  "null": { "color": "#005cc5" }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copyMessage, setCopyMessage] = useState('');
  
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
      
      // Parse JSON, then stringify it with proper formatting
      const parsedJson = JSON.parse(inputStr);
      const formattedJsonString = JSON.stringify(parsedJson, null, 2);
      
      // Search for VAST content
      const vastInfo = findVastContent(parsedJson);
      if (vastInfo) {
        const formattedVast = formatXml(vastInfo.content);
        const url = extractVastUrl(vastInfo.content);
        
        setFormattedJson(formattedJsonString);
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
        setFormattedJson(formattedJsonString);
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    setJsonSearchTerm('');
    setVastSearchTerm('');
    setShowJsonSearch(false);
    setShowVastSearch(false);
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

  return (
    <div className="w-full h-full overflow-hidden">
      <JsonExplorerHeader 
        isDarkMode={isDarkMode}
        hasJsonContent={!!formattedJson}
        hasVastContent={!!embeddedVastContent}
        characterCount={jsonInput.length}
        resetFields={handleClear}
        handleFormat={handleFormat}
        copyJsonToClipboard={copyJsonToClipboard}
        copyVastToClipboard={copyVastToClipboard}
        copyVastUrlToClipboard={copyVastUrlToClipboard}
        zoomLevel={1}
        setZoomLevel={() => {}}
      />
      
      <div className="flex-grow h-[calc(100%-60px)]">
        <FlexibleJsonLayout
          panels={[
            {
              id: 'input',
              title: 'JSON Input',
              content: (
                <div className="h-full flex flex-col">
                  <textarea
                    ref={textAreaRef}
                    className={`w-full h-full p-4 font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-opacity-50 ${
                      isDarkMode 
                        ? 'bg-gray-800 text-gray-200 focus:ring-blue-500 border border-gray-700' 
                        : 'bg-white text-gray-800 focus:ring-blue-600 border border-gray-300'
                    } rounded-md`}
                    value={jsonInput}
                    onChange={handleJsonInputChange}
                    placeholder="Paste JSON here..."
                    data-testid="json-input"
                  />
                  {error && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-200 text-red-800 rounded text-sm">
                      {error}
                    </div>
                  )}
                </div>
              ),
              visible: true
            },
            {
              id: 'output',
              title: 'Formatted JSON',
              content: (
                <div ref={jsonOutputRef} className="h-full overflow-auto">
                  {formattedJson ? (
                    <SyntaxHighlighter
                      language="json"
                      style={isDarkMode ? syntaxDark : syntaxLight}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        height: '100%',
                        fontSize: '0.875rem',
                        borderRadius: '0.375rem',
                        background: isDarkMode ? '#1f2937' : '#fff',
                      }}
                      wrapLines={true}
                      lineProps={(lineNumber: number) => {
                        return {
                          style: {
                            display: 'block',
                            width: '100%',
                          },
                          id: `line-${lineNumber}`
                        };
                      }}
                    >
                      {formattedJson}
                    </SyntaxHighlighter>
                  ) : (
                    <div className={`h-full flex items-center justify-center text-center p-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Format your JSON to see the result here.</p>
                      </div>
                    </div>
                  )}
                </div>
              ),
              visible: true
            },
            {
              id: 'vast',
              title: 'VAST Explorer',
              content: (
                <div ref={vastOutputRef} className="h-full overflow-auto">
                  {embeddedVastContent ? (
                    <div className="h-full">
                      {vastUrl && (
                        <div className={`mb-4 p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border rounded-md text-sm`}>
                          <p className={`font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>VAST URL:</p>
                          <a 
                            href={vastUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`inline-block max-w-full truncate ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                          >
                            {vastUrl}
                          </a>
                        </div>
                      )}
                      <SyntaxHighlighter
                        language="xml"
                        style={isDarkMode ? syntaxDark : syntaxLight}
                        customStyle={{
                          margin: 0,
                          padding: '1rem',
                          height: vastUrl ? 'calc(100% - 5rem)' : '100%',
                          overflow: 'auto',
                          fontSize: '0.875rem',
                          borderRadius: '0.375rem',
                          background: isDarkMode ? '#1f2937' : '#fff'
                        }}
                        wrapLines={true}
                        lineProps={(lineNumber: number) => {
                          return {
                            style: {
                              display: 'block',
                              width: '100%',
                            },
                            id: `vast-line-${lineNumber}`
                          };
                        }}
                      >
                        {embeddedVastContent}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <div className={`h-full flex items-center justify-center text-center p-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">When a VAST tag is found in the JSON, it will be displayed here.</p>
                      </div>
                    </div>
                  )}
                </div>
              ),
              visible: !!embeddedVastContent
            }
          ]}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
});

export default JsonVastExplorer; 