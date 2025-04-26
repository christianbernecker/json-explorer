import React, { useState, useRef, useCallback, useEffect } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
import HistoryItem from './shared/HistoryItem';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark as syntaxDark, atomOneLight as syntaxLight } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { Box, Button, Typography } from '@mui/material';
import { FormatAlignLeftIcon, ClearIcon, SearchIcon, ContentCopyIcon } from '@mui/icons-material';
import TextareaAutosize from 'react-textarea-autosize';
import { KeyboardShortcutsBox } from './shared';

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

  // SearchPanel einbinden und stylen analog zum JsonDiffInspector
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = useCallback(() => {
    setShowSearch(!showSearch);
  }, [showSearch]);

  // Anpassung der Farben und Typografie ähnlich wie im JsonDiffInspector
  const customStyle = {
    'hljs-attr': { color: isDarkMode ? '#6fb3d2' : '#2d5b7a' },
    'hljs-string': { color: isDarkMode ? '#ce9178' : '#a31515' },
    'hljs-number': { color: isDarkMode ? '#b5cea8' : '#098658' },
    'hljs-boolean': { color: isDarkMode ? '#569cd6' : '#0000ff' },
    'hljs-null': { color: isDarkMode ? '#569cd6' : '#0000ff' },
    'hljs': {
      background: isDarkMode ? '#1e1e1e' : '#f8f8f8',
      color: isDarkMode ? '#d4d4d4' : '#000000',
      padding: '18px',
      borderRadius: '4px',
      overflowX: 'auto',
      fontSize: '14px',
      lineHeight: '1.4',
    },
  };

  // Return the UI - Festes Layout mit Drei-Spalten
  return (
    <Box
      sx={{
        fontFamily: "'Inter', sans-serif",
        p: 2,
        background: isDarkMode ? '#121212' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#000000',
        height: '100vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <JsonExplorerHeader
        title="JSON/VAST Explorer"
        description="Formatiere JSON, extrahiere und untersuche VAST-Inhalte"
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <Box sx={{ display: 'flex', mb: 2, mt: 1 }}>
        <Button
          startIcon={<FormatAlignLeftIcon />}
          variant="contained"
          color="primary"
          onClick={handleFormat}
          sx={{ mr: 1, backgroundColor: isDarkMode ? '#333' : '#f0f0f0', color: isDarkMode ? '#fff' : '#000' }}
          disabled={jsonInput.trim() === ''}
        >
          Format
        </Button>
        <Button
          startIcon={<ClearIcon />}
          variant="outlined"
          onClick={handleClear}
          sx={{ mr: 1, borderColor: isDarkMode ? '#555' : '#ccc', color: isDarkMode ? '#fff' : '#000' }}
        >
          Löschen
        </Button>
        <Button
          startIcon={<SearchIcon />}
          variant={showSearch ? "contained" : "outlined"}
          onClick={handleSearch}
          sx={{ 
            mr: 1, 
            backgroundColor: showSearch ? (isDarkMode ? '#333' : '#f0f0f0') : 'transparent',
            borderColor: isDarkMode ? '#555' : '#ccc', 
            color: isDarkMode ? '#fff' : '#000'
          }}
        >
          Suchen
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          startIcon={<ContentCopyIcon />}
          variant="outlined"
          onClick={copyJsonToClipboard}
          sx={{ mr: 1, borderColor: isDarkMode ? '#555' : '#ccc', color: isDarkMode ? '#fff' : '#000' }}
          disabled={!formattedJson}
        >
          JSON kopieren
        </Button>
        <Button
          startIcon={<ContentCopyIcon />}
          variant="outlined"
          onClick={copyVastToClipboard}
          sx={{ borderColor: isDarkMode ? '#555' : '#ccc', color: isDarkMode ? '#fff' : '#000' }}
          disabled={!embeddedVastContent}
        >
          VAST kopieren
        </Button>
      </Box>

      {showSearch && (
        <SearchPanel 
          onSearch={handleJsonSearch} 
          isDarkMode={isDarkMode} 
          sx={{ mb: 2, p: 2, borderRadius: '4px', bgcolor: isDarkMode ? '#1e1e1e' : '#f8f8f8' }}
        />
      )}

      <Box sx={{ display: 'flex', flexGrow: 1, gap: 2, height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        {/* Input Panel - 1/3 Breite */}
        <Box sx={{ width: '33%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: isDarkMode ? '#aaa' : '#555' }}>
            JSON-Eingabe
          </Typography>
          <Box 
            sx={{ 
              flexGrow: 1, 
              position: 'relative',
              border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
              borderRadius: '4px',
              backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f8f8',
            }}
          >
            <TextareaAutosize
              ref={textAreaRef}
              value={jsonInput}
              onChange={handleJsonInputChange}
              placeholder="JSON hier einfügen..."
              style={{
                width: '100%',
                height: '100%',
                padding: '18px',
                border: 'none',
                backgroundColor: 'transparent',
                color: isDarkMode ? '#d4d4d4' : '#000000',
                resize: 'none',
                fontFamily: 'monospace',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: '1.4',
              }}
              onKeyDown={handleKeyDown}
            />
            <KeyboardShortcutsBox isDarkMode={isDarkMode} />
          </Box>
        </Box>

        {/* Output Panel - 2/3 Breite, aufgeteilt in JSON und VAST wenn VAST vorhanden */}
        <Box sx={{ width: '67%', display: 'flex', gap: 2 }}>
          {/* Formatted JSON Panel */}
          <Box 
            sx={{ 
              width: embeddedVastContent ? '50%' : '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'width 0.3s ease'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isDarkMode ? '#aaa' : '#555' }}>
                Formatiertes JSON
              </Typography>
              {error && (
                <Typography variant="caption" sx={{ ml: 2, color: 'error.main' }}>
                  {error}
                </Typography>
              )}
            </Box>
            <Box 
              sx={{ 
                flexGrow: 1, 
                border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
                borderRadius: '4px',
                overflow: 'auto',
              }}
            >
              {formattedJson ? (
                <SyntaxHighlighter
                  language="json"
                  style={customStyle}
                  showLineNumbers
                  lineNumberStyle={{
                    minWidth: '40px',
                    textAlign: 'right',
                    marginRight: '12px',
                    color: isDarkMode ? '#6e6e6e' : '#a0a0a0',
                    paddingRight: '12px',
                    borderRight: `1px solid ${isDarkMode ? '#333' : '#eee'}`,
                    userSelect: 'none',
                  }}
                  wrapLongLines={false}
                  customStyle={{
                    margin: 0,
                    height: '100%',
                    background: isDarkMode ? '#1e1e1e' : '#f8f8f8',
                  }}
                >
                  {formattedJson}
                </SyntaxHighlighter>
              ) : (
                <Box 
                  sx={{ 
                    p: 2, 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: isDarkMode ? '#888' : '#999',
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f8f8'
                  }}
                >
                  <Typography variant="body2">Formatiertes JSON wird hier angezeigt</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* VAST Content Panel - nur anzeigen, wenn VAST vorhanden */}
          {embeddedVastContent && (
            <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: isDarkMode ? '#aaa' : '#555' }}>
                VAST-Inhalt
              </Typography>
              <Box 
                sx={{ 
                  flexGrow: 1, 
                  border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
                  borderRadius: '4px',
                  overflow: 'auto',
                }}
              >
                <SyntaxHighlighter
                  language="xml"
                  style={customStyle}
                  showLineNumbers
                  lineNumberStyle={{
                    minWidth: '40px',
                    textAlign: 'right',
                    marginRight: '12px',
                    color: isDarkMode ? '#6e6e6e' : '#a0a0a0',
                    paddingRight: '12px',
                    borderRight: `1px solid ${isDarkMode ? '#333' : '#eee'}`,
                    userSelect: 'none',
                  }}
                  wrapLongLines={false}
                  customStyle={{
                    margin: 0,
                    height: '100%',
                    background: isDarkMode ? '#1e1e1e' : '#f8f8f8',
                  }}
                >
                  {embeddedVastContent}
                </SyntaxHighlighter>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
});

export default JsonVastExplorer; 