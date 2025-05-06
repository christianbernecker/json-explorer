import React, { useState, useRef, useCallback } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import HistoryItem from './shared/HistoryItem';
import { SearchPanel } from './shared';

// VastInfo type for internal use
interface VastInfo {
  path: string;
  content: string;
}

// Definiere addLineNumbersGlobal als useCallback, um ESLint-Warnung zu vermeiden
const useAddLineNumbers = (isDarkMode: boolean) => {
  return useCallback((html: string, language: string) => { // language wird nicht verwendet, kann entfernt werden
    if (!html) return '';
    const lines = html.split('\n');
    const zoomLevel = 1; 
    const fontSize = Math.round(12 * zoomLevel);
    let result = '<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; table-layout: fixed; border-collapse: collapse;">';
    lines.forEach((line, index) => {
      result += `
        <tr>
          <td style="width: 30px; text-align: right; color: ${isDarkMode ? '#9ca3af' : '#999'}; user-select: none; padding-right: 8px; font-size: ${fontSize}px; border-right: 1px solid ${isDarkMode ? '#4b5563' : '#ddd'}; vertical-align: top;">${index + 1}</td>
          <td style="padding-left: 8px; font-family: monospace; font-size: ${fontSize}px;">${line || '&nbsp;'}</td>
        </tr>
      `;
    });
    result += '</table>';
    return result;
  }, [isDarkMode]); // Abhängigkeit von isDarkMode
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
  const [rawVastContent, setRawVastContent] = useState<string | null>(null);
  const [vastUrl, setVastUrl] = useState('');
  const [error, setError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  
  // Suche-States
  const [showJsonSearch, setShowJsonSearch] = useState(false);
  const [showVastSearch, setShowVastSearch] = useState(false);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(false); // State für Zeilenumbruch
  
  // State für die VAST Kette (Wrapper)
  interface VastChainItem {
    uri: string;
    content: string | null;
    isLoading: boolean;
    error: string | null;
  }
  const [vastChain, setVastChain] = useState<VastChainItem[]>([]);
  const MAX_VAST_WRAPPER = 5; // Limit für Rekursion
  
  // State für aktiven Tab (0 = Embedded, 1 = Chain Item 0, 2 = Chain Item 1, ...)
  const [activeVastTabIndex, setActiveVastTabIndex] = useState<number>(0);
  
  // Refs for search functionality
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const jsonOutputRef = useRef<HTMLDivElement>(null);
  const vastOutputRef = useRef<HTMLDivElement>(null);
  
  // Custom hook for Syntax Highlighting
  const { highlightJson, highlightXml, formatXml } = useHighlighter();
  
  // Hook für Zeilennummern aufrufen
  const addLineNumbersGlobal = useAddLineNumbers(isDarkMode);
  
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

  // Extract VAST URL from VASTAdTagURI tag - More specific than the previous one
  const extractAdTagUri = useCallback((content: string | null): string | null => {
    if (!content) return null;
    // Regex to find VASTAdTagURI and extract URL, handles CDATA and trims whitespace
    const match = content.match(/<VASTAdTagURI(?:\s[^>]*)?>(?:<!\[CDATA\[)?\s*(https?:\/\/[^<\s\]]+)\s*(?:\]\]>)?<\/VASTAdTagURI>/i);
    return match ? match[1].trim() : null; // Return the captured group (the URL)
  }, []);

  // Recursive function to fetch VAST chain
  const fetchVastChainRecursive = useCallback(async (uri: string, currentChain: VastChainItem[] = []) => {
    if (currentChain.length >= MAX_VAST_WRAPPER) {
      console.warn(`VAST wrapper limit (${MAX_VAST_WRAPPER}) reached. Stopping fetch for URI: ${uri}`);
      setVastChain(prev => [...prev, { uri, content: null, isLoading: false, error: `Wrapper limit (${MAX_VAST_WRAPPER}) reached.` }]);
      return;
    }
    
    const chainIndex = currentChain.length;
    const newItem: VastChainItem = { uri, content: null, isLoading: true, error: null };
    setVastChain(prev => [...prev, newItem]);

    try {
      // NOTE: CORS restrictions might apply.
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      if (!text.trim().startsWith('<')) { 
        throw new Error('Response does not look like XML.');
      }

      setVastChain(prev => prev.map((item, index) => 
        index === chainIndex ? { ...item, content: text, isLoading: false } : item
      ));

      // Check for next VASTAdTagURI in the fetched content
      const nextUri = extractAdTagUri(text);
      if (nextUri) {
        await fetchVastChainRecursive(nextUri, [...currentChain, { ...newItem, content: text, isLoading: false }]); // Pass updated chain
      } else {
          // No more wrappers found in this VAST
      }

    } catch (err: any) {
      console.error(`Error fetching VAST URI at index ${chainIndex}:`, err);
      const errorMessage = `Failed to fetch VAST from URI: ${err.message}. Possible CORS issue or invalid URL/content.`;
      setVastChain(prev => prev.map((item, index) => 
        index === chainIndex ? { ...item, isLoading: false, error: errorMessage } : item
      ));
    }
  }, [extractAdTagUri]);

  // Format JSON and initiate VAST chain fetching
  const handleFormat = useCallback(() => {
    // Reset fetch states on new format
    setVastChain([]); // Clear the previous chain
    setActiveVastTabIndex(0); // Reset to embedded VAST tab
    
    try {
      const inputStr = jsonInput.trim();
      
      if (!inputStr) {
        setError('Please enter JSON.');
        setParsedJson(null); // Ensure parsedJson is also reset
        setRawVastContent(null);
        return;
      }
      
      const currentParsedJson = JSON.parse(inputStr);
      setParsedJson(currentParsedJson);
      setError('');
      setRawVastContent(null); // Reset raw VAST initially

      const vastInfo = findVastContent(currentParsedJson);
      if (vastInfo) {
        const currentRawVast = vastInfo.content;
        setRawVastContent(currentRawVast);
        
        // Extract original VAST URL (for display above VAST box, might be different from AdTagURI)
        const displayUrl = extractVastUrl(currentRawVast);
        setVastUrl(displayUrl || ''); // Display this URL above the initial VAST

        // Now try to extract and fetch the AdTagURI from the raw VAST content
        const firstAdTagUri = extractAdTagUri(currentRawVast);
        if (firstAdTagUri) {
            fetchVastChainRecursive(firstAdTagUri); // Start recursive fetch
        }
        
        const newHistoryItem: HistoryItemType = {
          type: 'json_vast',
          jsonContent: currentParsedJson,
          vastContent: currentRawVast,
          vastUrl: displayUrl || '', // Use the extracted display URL
          timestamp: Date.now()
        };
        
        addToHistoryItem(newHistoryItem);
      } else {
        setRawVastContent(null); // Already reset above, but good to be explicit
        setVastUrl('');
        setVastChain([]); // Ensure chain is clear if no VAST found
        setActiveVastTabIndex(0); // Reset tab
        
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
      setRawVastContent(null);
      setVastUrl('');
      // Reset fetch states on error
      setVastChain([]);
      setActiveVastTabIndex(0);
      setShowVastSearch(false); // Also hide VAST search on error
    }
  }, [jsonInput, findVastContent, extractVastUrl, extractAdTagUri, fetchVastChainRecursive, addToHistoryItem]);
  
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
      setJsonInput(JSON.stringify(item.content, null, 2));
      setParsedJson(item.content);
      setRawVastContent(null);
      setVastUrl('');
      setError('');
    } else {
      setJsonInput(JSON.stringify(item.jsonContent, null, 2));
      setParsedJson(item.jsonContent);
      setRawVastContent(item.vastContent || null);
      setVastUrl(item.vastUrl || '');
      setError('');
    }
    setShowHistory(false);
  }, [setShowHistory]);
  
  // Clear all fields
  const handleClear = useCallback(() => {
    setJsonInput('');
    setParsedJson(null);
    setRawVastContent(null);
    setVastUrl('');
    setError('');
    setCopyMessage('');
    setShowJsonSearch(false);
    // Reset fetch states on clear
    setVastChain([]);
    setActiveVastTabIndex(0);
    setShowVastSearch(false); // Also hide VAST search on clear
  }, []);

  // Kopieren des JSON-Inhalts in die Zwischenablage
  const copyJsonToClipboard = useCallback(() => {
    if (parsedJson) {
      copyToClipboard(JSON.stringify(parsedJson, null, 2), 'JSON');
    }
  }, [parsedJson, copyToClipboard]);

  // Kopieren der VAST-URL in die Zwischenablage
  const copyVastUrlToClipboard = useCallback(() => {
    if (vastUrl) {
      copyToClipboard(vastUrl, 'URL');
    }
  }, [vastUrl, copyToClipboard]);

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 150px)' }}>
      <div className="mb-4">
        <div className="flex flex-row space-x-4">
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>JSON Input</h3>
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
      
      {(parsedJson || rawVastContent) && (
        <div className="mt-4 flex flex-col flex-1 min-h-0"> 
           <div className="flex flex-row space-x-4 flex-1 min-h-0">
             {parsedJson && (
                <div className={`${rawVastContent ? 'w-1/2' : 'w-full'} min-w-0 flex flex-col flex-1`}>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Formatted JSON</h3>
                   <div 
                     ref={jsonOutputRef}
                     className={`p-4 rounded-lg border shadow-inner overflow-auto min-h-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                   >
                     <div className="flex justify-end space-x-2 mb-2">
                       <button 
                         onClick={() => setIsWordWrapEnabled(!isWordWrapEnabled)}
                         className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                         title={isWordWrapEnabled ? "Disable Word Wrap" : "Enable Word Wrap"}
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           {isWordWrapEnabled 
                             ? <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                             : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                           }
                         </svg>
                         <span className="ml-1.5">{isWordWrapEnabled ? "NoWrap" : "Wrap"}</span>
                       </button>
                       <button 
                         onClick={() => setShowJsonSearch(!showJsonSearch)} 
                         className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                         title="Find in JSON"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                         </svg>
                         <span className="ml-1.5">Find</span>
                       </button>
                       <button 
                         onClick={copyJsonToClipboard} 
                         className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                         title="Copy JSON"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                         </svg>
                         <span className="ml-1.5">Copy</span>
                       </button>
                     </div>
                     {showJsonSearch && (
                       <SearchPanel
                         contentType="JSON"
                         targetRef={jsonOutputRef}
                         isDarkMode={isDarkMode}
                       />
                     )}
                     <div 
                       dangerouslySetInnerHTML={{ __html: addLineNumbersGlobal(highlightJson(parsedJson, isDarkMode), 'json') }}
                       className={`w-full ${isWordWrapEnabled ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}
                       style={{ maxWidth: "100%" }}
                     />
                   </div>
                </div>
             )}
             {rawVastContent && (
               <div className="w-1/2 min-w-0 flex flex-col flex-1">
                 {/* General Headline */}                 
                 <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>VAST-Antworten</h3>
                 
                 {/* Tab Navigation - Dynamic */} 
                 <div className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} mb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800`}>
                    {/* Embedded VAST Tab (Index 0) */}                 
                    <button 
                       onClick={() => setActiveVastTabIndex(0)}
                       className={`py-2 px-4 text-sm font-medium focus:outline-none whitespace-nowrap ${
                         activeVastTabIndex === 0 
                           ? (isDarkMode ? 'border-blue-400 text-blue-300' : 'border-blue-500 text-blue-600') + ' border-b-2'
                           : (isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
                      }`}
                    >
                       Embedded VAST
                    </button>
                    
                    {/* Dynamic VAST Chain Tabs (Index 1+) */}                    
                    {vastChain.map((item, index) => (
                       <button 
                         key={index + 1}
                         onClick={() => setActiveVastTabIndex(index + 1)}
                         className={`py-2 px-4 text-sm font-medium focus:outline-none whitespace-nowrap ${
                          activeVastTabIndex === index + 1 
                          ? (isDarkMode ? 'border-blue-400 text-blue-300' : 'border-blue-500 text-blue-600') + ' border-b-2'
                          : (isDarkMode ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
                         }`}
                       >
                         VASTAdTagURI ({index + 1})
                         {item.isLoading && (
                            <svg className="animate-spin ml-2 h-4 w-4 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                         )}
                         {item.error && !item.isLoading && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4 inline-block text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} >
                               <title>{item.error}</title>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                         )}
                       </button>
                    ))}
                 </div>

                 {/* Conditional Content based on Active Tab Index */}                 
                 {activeVastTabIndex === 0 && rawVastContent && ( /* Show only if rawVastContent exists */
                    <div className="flex flex-col flex-1 min-h-0">
                       {/* Removed specific headline from here */}                       
                       {vastUrl && (
                          <div className={`px-4 pt-2 pb-1 text-xs ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border border-b-0 rounded-t-lg flex items-center justify-between`}>
                            <span className={`truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>URL:</span>
                            <div className="flex items-center ml-2 flex-grow min-w-0">
                              <span className={`truncate flex-grow mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} title={vastUrl}>{vastUrl}</span>
                              <button 
                                onClick={copyVastUrlToClipboard} 
                                className={`p-1 rounded-md ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                                title="Copy VAST URL"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                             </button>
                            </div>
                         </div>
                       )}
                       <div 
                         ref={vastOutputRef} 
                         className={`p-4 border shadow-inner overflow-auto flex-grow min-h-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} ${vastUrl ? 'rounded-b-lg rounded-t-none border-t-0' : 'rounded-lg'} flex flex-col h-full`}>
                         <div className="flex justify-end space-x-2 mb-2 flex-shrink-0">
                           {/* Buttons für den ursprünglichen VAST */}                      
                           <button onClick={() => setIsWordWrapEnabled(!isWordWrapEnabled)} className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title={isWordWrapEnabled ? "Disable Word Wrap" : "Enable Word Wrap"}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{isWordWrapEnabled ? <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />}</svg><span className="ml-1.5">{isWordWrapEnabled ? "NoWrap" : "Wrap"}</span></button>
                           <button onClick={() => setShowVastSearch(true)} className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title="Find in VAST"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><span className="ml-1.5">Find</span></button>
                           <button onClick={() => copyToClipboard(formatXml(rawVastContent!), 'VAST')} className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title="Copy VAST"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span className="ml-1.5">Copy</span></button>
                          </div>
                          {showVastSearch && (
                            <SearchPanel
                              contentType="VAST"
                              targetRef={vastOutputRef}
                              isDarkMode={isDarkMode}
                            />
                          )}
                          <div 
                            dangerouslySetInnerHTML={{ __html: addLineNumbersGlobal(highlightXml(formatXml(rawVastContent as string), isDarkMode), 'xml') }}
                            className={`w-full ${isWordWrapEnabled ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'} flex-grow min-h-0 overflow-auto`}
                            style={{ maxWidth: "100%" }}
                          />
                      </div>
                    </div>
                 )}
                 
                 {activeVastTabIndex > 0 && vastChain[activeVastTabIndex - 1] && ( /* Check if the chain item exists */
                    <div className="flex flex-col flex-1 min-h-0">
                       {/* Removed specific headline from here */}                       
                       {vastChain[activeVastTabIndex - 1].isLoading && (
                           <div className={`flex items-center justify-center p-4 rounded-lg text-sm ${isDarkMode ? 'text-blue-200 bg-gray-700' : 'text-blue-700 bg-blue-50'}`}>
                             <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             Fetching VAST from URI...
                           </div>
                       )}
                       {/* Display Error state for this specific tab */}                       
                       {vastChain[activeVastTabIndex - 1].error && !vastChain[activeVastTabIndex - 1].isLoading && (
                          <div className={`p-4 rounded-lg flex items-center text-sm ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-50 text-red-600'} border-l-4 ${isDarkMode ? 'border-red-600' : 'border-red-500'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{vastChain[activeVastTabIndex - 1].error}</span>
                          </div>
                       )}
                       {/* Display VAST content for this specific tab */}                       
                       {vastChain[activeVastTabIndex - 1].content && !vastChain[activeVastTabIndex - 1].isLoading && (
                           <div className="flex flex-col flex-1 min-h-0">
                              <div 
                                 className={`p-4 border shadow-inner overflow-auto flex-grow min-h-0 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} flex flex-col h-full`}>                                 
                                   <div className="flex justify-end space-x-2 mb-2 flex-shrink-0">                                   
                                    {/* Buttons für Fetched VAST */}                                 
                                    <button onClick={() => setIsWordWrapEnabled(!isWordWrapEnabled)} className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title={isWordWrapEnabled ? "Disable Word Wrap" : "Enable Word Wrap"}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{isWordWrapEnabled ? <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />}</svg><span className="ml-1.5">{isWordWrapEnabled ? "NoWrap" : "Wrap"}</span></button>
                                    {/* TODO: Implement search for this specific VAST Chain item */}                                    
                                    <button onClick={() => alert(`Search in VASTAdTagURI (${activeVastTabIndex}) not implemented yet`)} className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title={`Find in VASTAdTagURI (${activeVastTabIndex})`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><span className="ml-1.5">Find</span></button>
                                    <button onClick={() => copyToClipboard(formatXml(vastChain[activeVastTabIndex - 1].content!), `VASTAdTagURI (${activeVastTabIndex})`)} className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title={`Copy VASTAdTagURI (${activeVastTabIndex})`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg><span className="ml-1.5">Copy</span></button>
                                  </div>
                                  {/* TODO: Implement SearchPanel instance for this specific VAST Chain item */}                                  
                                  {/* {showVastSearch && activeVastTabIndex > 0 && ( <SearchPanel ... /> )} */}                                  
                                  <div 
                                    dangerouslySetInnerHTML={{ __html: addLineNumbersGlobal(highlightXml(formatXml(vastChain[activeVastTabIndex - 1].content as string), isDarkMode), 'xml') }}
                                    className={`w-full ${isWordWrapEnabled ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'} flex-grow min-h-0 overflow-auto`}                                    
                                    style={{ maxWidth: "100%" }}
                                  />
                               </div>
                            </div>
                        )}
                    </div>
                 )}
               </div>
             )}
           </div>
        </div>
      )}
      
      {copyMessage && (
        <div 
          className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg text-sm font-medium z-50 animate-fade-out ${ 
            isDarkMode 
            ? 'bg-green-800 text-green-100' 
            : 'bg-green-100 text-green-800' 
          }`}
        >
          {copyMessage}
        </div>
      )}
      
    </div>
  );
});

export default JsonVastExplorer;

export {};
