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
      copyToClipboard(formattedJson, 'JSON');
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
      
      <div className="w-full h-[calc(100vh-200px)] flex mt-4 overflow-hidden">
        {/* Left Panel - JSON Input (1/3 width) */}
        <div className="w-1/3 px-4 flex flex-col h-full">
          <div className={`flex justify-between items-center mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            <Typography variant="subtitle1" className="font-semibold">
              JSON Input
            </Typography>
          </div>
          
          <div className="relative flex-grow mb-4 overflow-hidden flex flex-col">
            <textarea
              ref={textAreaRef}
              value={jsonInput}
              onChange={handleJsonInputChange}
              wrap="soft"
              className={`w-full h-full p-3 resize-none rounded border ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-100 border-gray-700' 
                  : 'bg-white text-gray-800 border-gray-300'
              } font-mono text-sm outline-none flex-grow`}
              placeholder="Paste JSON here..."
              style={{
                width: '100%',
                height: '100%',
                resize: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                boxSizing: 'border-box',
                display: 'block',
                maxWidth: '100%'
              }}
            />
            
            {error && (
              <div className="mt-2 p-2 text-sm text-white bg-red-500 rounded">
                {error}
              </div>
            )}
          </div>
          
          {/* Format und Clear Buttons unter dem Input-Feld */}
          <div className="flex space-x-2 mb-2">
            <Button
              fullWidth
              size="small"
              variant="contained"
              color="primary"
              startIcon={<FormatAlignLeft />}
              onClick={handleFormat}
              className="text-xs"
            >
              Format
            </Button>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleClear}
              className="text-xs"
              color={isDarkMode ? "inherit" : "primary"}
            >
              Clear
            </Button>
          </div>
          
          <div className="mt-auto">
            <KeyboardShortcutsBox 
              isDarkMode={isDarkMode}
              keyboardShortcuts={[
                { key: 'Ctrl/Cmd + Enter', description: 'Format JSON' },
                { key: 'Esc', description: 'Clear all' }
              ]}
            />
          </div>
        </div>
        
        {/* Middle Panel - Formatted JSON (1/3 width, or 2/3 if no VAST) */}
        <div className={`${embeddedVastContent ? 'w-1/3' : 'w-2/3'} px-4 flex flex-col h-full relative`}>
          <div className={`flex justify-between items-center mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            <Typography variant="subtitle1" className="font-semibold">
              Formatted JSON
            </Typography>
            <div className="flex space-x-2">
              <Button
                size="small"
                variant="outlined"
                startIcon={<Search />}
                onClick={() => setShowJsonSearch(!showJsonSearch)}
                className="text-xs"
                color={isDarkMode ? "inherit" : "primary"}
              >
                Find
              </Button>
              {formattedJson && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={copyJsonToClipboard}
                  className="text-xs"
                  color={isDarkMode ? "inherit" : "primary"}
                >
                  Copy
                </Button>
              )}
            </div>
          </div>
          
          {showJsonSearch && (
            <SearchPanel
              contentType="JSON"
              onSearch={(term) => {
                setJsonSearchTerm(term);
              }}
              targetRef={jsonOutputRef}
              isDarkMode={isDarkMode}
            />
          )}
          
          <div
            ref={jsonOutputRef}
            className={`flex-grow overflow-auto border rounded ${
              isDarkMode
                ? 'bg-gray-900 border-gray-700'
                : 'bg-gray-50 border-gray-300'
            } h-full max-w-full`}
            style={{ maxWidth: '100%', overflowX: 'auto' }}
          >
            {formattedJson && (
              <Box p={0} sx={{ height: '100%', maxWidth: '100%', overflow: 'auto' }}>
                <SyntaxHighlighter
                  language="json"
                  style={isDarkMode ? customJsonDarkStyle : customJsonStyle}
                  customStyle={{
                    margin: 0,
                    padding: '16px',
                    height: '100%',
                    fontSize: '13px',
                    backgroundColor: 'transparent',
                    borderRadius: '4px',
                    maxWidth: '100%',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all' // <-- Fix hinzugefügt
                  }}
                  showLineNumbers={true}
                  lineNumberStyle={{
                    minWidth: '3em',
                    paddingRight: '1em',
                    color: isDarkMode ? '#606366' : '#A9A9A9',
                    textAlign: 'right',
                    userSelect: 'none',
                  }}
                  wrapLongLines={true}
                >
                  {formattedJson}
                </SyntaxHighlighter>
              </Box>
            )}
          </div>
        </div>
        
        {/* Right Panel - VAST Content (1/3 width) - Only shown if VAST content exists */}
        {embeddedVastContent && (
          <div className="w-1/3 px-4 flex flex-col h-full relative">
            <div className={`flex justify-between items-center mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <Typography variant="subtitle1" className="font-semibold">
                VAST Explorer
              </Typography>
              <div className="flex space-x-2">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={() => setShowVastSearch(!showVastSearch)}
                  className="text-xs"
                  color={isDarkMode ? "inherit" : "primary"}
                >
                  Find
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={copyVastToClipboard}
                  className="text-xs"
                  color={isDarkMode ? "inherit" : "primary"}
                >
                  Copy
                </Button>
              </div>
            </div>
            
            {showVastSearch && (
              <SearchPanel
                contentType="VAST"
                onSearch={(term) => {
                  setVastSearchTerm(term);
                }}
                targetRef={vastOutputRef}
                isDarkMode={isDarkMode}
              />
            )}
            
            <div
              ref={vastOutputRef}
              className={`flex-grow overflow-auto border rounded ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-700'
                  : 'bg-gray-50 border-gray-300'
              } h-full max-w-full`}
              style={{ maxWidth: '100%', overflowX: 'auto' }}
            >
              {embeddedVastContent && (
                <Box p={0} sx={{ height: '100%', maxWidth: '100%', overflow: 'auto' }}>
                  <SyntaxHighlighter
                    language="xml"
                    style={isDarkMode ? syntaxDark : syntaxLight}
                    customStyle={{
                      margin: 0,
                      padding: '16px',
                      height: '100%',
                      fontSize: '13px',
                      backgroundColor: 'transparent',
                      borderRadius: '4px',
                      maxWidth: '100%',
                      overflowX: 'auto',
                      overflowY: 'auto',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all' // <-- Fix hinzugefügt
                    }}
                    showLineNumbers={true}
                    lineNumberStyle={{
                      minWidth: '3em',
                      paddingRight: '1em',
                      color: isDarkMode ? '#606366' : '#A9A9A9',
                      textAlign: 'right',
                      userSelect: 'none',
                    }}
                    wrapLongLines={true}
                  >
                    {embeddedVastContent}
                  </SyntaxHighlighter>
                </Box>
              )}
            </div>
            
            {vastUrl && (
              <div className={`mt-2 p-2 text-sm rounded flex justify-between items-center ${
                isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
              }`}>
                <Typography variant="caption" className="truncate flex-grow" title={vastUrl} style={{ maxWidth: '200px' }}>
                  {vastUrl}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={copyVastUrlToClipboard}
                  className="text-xs"
                >
                  Copy URL
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default JsonVastExplorer;

// Leere Export-Anweisung hinzufügen, um TS2306-Fehler zu beheben
export {};
