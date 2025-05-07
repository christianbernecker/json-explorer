import React, { useState, useRef, useCallback } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
import SearchPanel from './SearchPanel';
import JsonHistoryPanel from './shared/JsonHistoryPanel';

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
    const fontSize = Math.round(12 * zoomLevel); // 12px ist die Standardgröße für text-sm
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
  const [error, setError] = useState('');
  
  // copyMessage wird für Benachrichtigungen nach dem Kopieren verwendet
  const [copyMessage, setCopyMessage] = useState('');
  
  // Suche-States
  const [showJsonSearch, setShowJsonSearch] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showVastSearch, setShowVastSearch] = useState(false);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(false); // State für Zeilenumbruch
  
  // State für die VAST Kette (Wrapper)
  interface VastChainItem {
    uri: string;
    content: string | null;
    isLoading: boolean;
    error: string | null;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vastChain, setVastChain] = useState<VastChainItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const MAX_VAST_WRAPPER = 5; // Limit für Rekursion
  
  // State für aktiven Tab (0 = Embedded, 1 = Chain Item 0, 2 = Chain Item 1, ...)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeVastTabIndex, setActiveVastTabIndex] = useState<number>(0);
  
  // Refs for search functionality
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const jsonOutputRef = useRef<HTMLDivElement>(null);
  
  // Ref for Embedded VAST output
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const embeddedVastOutputRef = useRef<HTMLDivElement>(null);
  // Refs for Fetched VAST outputs (dynamic)
  const fetchedVastOutputRefs = useRef<Map<number, React.RefObject<HTMLDivElement>>>(new Map());
  
  // Custom hook for Syntax Highlighting
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  }, [extractAdTagUri, MAX_VAST_WRAPPER]);

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
        
        // Now try to extract and fetch the AdTagURI from the raw VAST content
        const firstAdTagUri = extractAdTagUri(currentRawVast);
        if (firstAdTagUri) {
            fetchVastChainRecursive(firstAdTagUri); // Start recursive fetch
        }
        
        const newHistoryItem: HistoryItemType = {
          type: 'json_vast',
          jsonContent: currentParsedJson,
          vastContent: currentRawVast,
          vastUrl: extractVastUrl(currentRawVast) || '', // Still store in history if needed, but not in state
          timestamp: Date.now()
        };
        
        addToHistoryItem(newHistoryItem);
      } else {
        setRawVastContent(null); // Already reset above, but good to be explicit
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
  const restoreFromHistory = useCallback((item: HistoryItemType) => {
    if (item.type === 'json') {
      setJsonInput(JSON.stringify(item.content, null, 2));
      setParsedJson(item.content);
      setRawVastContent(null);
      setError('');
    } else {
      setJsonInput(JSON.stringify(item.jsonContent, null, 2));
      setParsedJson(item.jsonContent);
      setRawVastContent(item.vastContent || null);
      setError('');
      // Restore VAST chain potentially? For now, just clear it.
      setVastChain([]);
    }
    setShowHistory(false);
  }, [setShowHistory, setJsonInput, setParsedJson, setRawVastContent, setError, setVastChain]);
  
  // Clear all fields
  const handleClear = useCallback(() => {
    setJsonInput('');
    setParsedJson(null);
    setRawVastContent(null);
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

  // Format XML for display - adding proper styling and line breaks
  const formatXmlForDisplay = useCallback((xml: string | null): string => {
    if (!xml) return '';
    
    try {
      // XML mit einer verbesserten Formatierungslogik formatieren
      const formatXml = (xmlText: string): string => {
        // Entferne Leerzeichen und Zeilenumbrüche zwischen Tags
        let xml = xmlText.replace(/>\s*</g, '><');
        
        // Spezialfall: CDATA sollte inline mit Tags bleiben
        xml = xml.replace(/(<[^>]*>)(<!\[CDATA\[(.*?)\]\]>)(<\/[^>]*>)/g, '$1$2$4');
        
        let formatted = '';
        let indent = 0;
        let inCdata = false;
        
        // Gehe jeden Zeichen durch
        for (let i = 0; i < xml.length; i++) {
          const char = xml.charAt(i);
          
          // Prüfe auf CDATA-Beginn
          if (i + 8 < xml.length && xml.substring(i, i+9) === '<![CDATA[') {
            inCdata = true;
            formatted += '<![CDATA[';
            i += 8;
            continue;
          }
          
          // Prüfe auf CDATA-Ende
          if (inCdata && i + 2 < xml.length && xml.substring(i, i+3) === ']]>') {
            inCdata = false;
            formatted += ']]>';
            i += 2;
            continue;
          }
          
          // Wenn in CDATA, füge Zeichen direkt hinzu
          if (inCdata) {
            formatted += char;
            continue;
          }
          
          // Behandle öffnende Tags
          if (char === '<' && xml.charAt(i+1) !== '/') {
            // Ist es ein selbstschließendes Tag?
            const selfClosing = xml.indexOf('/>', i) < xml.indexOf('>', i) && xml.indexOf('/>', i) !== -1;
            // Ist es ein kombiniertes Tag (öffnen + schließen in einem)?
            const combinedTag = xml.substring(i).match(/^<[^>]*>[^<]*<\/[^>]*>/);
            
            if (!selfClosing && !combinedTag) {
              formatted += '\n' + ' '.repeat(indent * 2) + '<';
              indent++;
            } else {
              formatted += '\n' + ' '.repeat(indent * 2) + '<';
            }
          } 
          // Behandle schließende Tags
          else if (char === '<' && xml.charAt(i+1) === '/') {
            indent--;
            formatted += '\n' + ' '.repeat(indent * 2) + '<';
          }
          // Für das Ende eines selbstschließenden Tags oder normalen Tags
          else if (char === '>') {
            formatted += '>';
            
            // Wenn das nächste Zeichen ein öffnendes '<' ist, füge keinen Zeilenumbruch ein
            if (i + 1 < xml.length && xml.charAt(i+1) === '<') {
              // nichts tun
            } else {
              formatted += '\n' + ' '.repeat(indent * 2);
            }
          }
          // Für alle anderen Zeichen
          else {
            formatted += char;
          }
        }
        
        return formatted.trim();
      };
      
      return formatXml(xml);
    } catch (error) {
      console.error('Error formatting XML:', error);
      return xml;
    }
  }, []);
  
  // Handle toggle word wrap
  const toggleWordWrap = useCallback(() => {
    setIsWordWrapEnabled(prev => !prev);
  }, []);
  
  // Copy VAST content to clipboard
  const copyVastToClipboard = useCallback(() => {
    if (activeVastTabIndex === 0 && rawVastContent) {
      copyToClipboard(rawVastContent, 'VAST');
    } else if (activeVastTabIndex === 1 && vastChain[0]?.content) {
      copyToClipboard(vastChain[0].content, 'VAST');
    } else if (activeVastTabIndex === 2 && vastChain[1]?.content) {
      copyToClipboard(vastChain[1].content, 'VAST');
    }
  }, [activeVastTabIndex, rawVastContent, vastChain, copyToClipboard]);
  
  // Render VAST content with proper formatting
  const renderVastContent = useCallback((vastContent: string | null) => {
    if (!vastContent) return <p className="mt-4 text-red-500">No VAST content found</p>;
    
    const formattedVast = formatXmlForDisplay(vastContent);
    
    // Verbesserte Syntax-Highlighting für XML/VAST
    const colorizeVast = (text: string, isDark: boolean): string => {
      let colorized = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // Tags in Blau (mit korrigiertem Regex-Pattern)
      colorized = colorized.replace(/&lt;(\/?)([\w:]+)/g, 
        '&lt;$1<span class="xml-tag" style="color: ' + (isDark ? '#4299e1' : '#3182ce') + '">$2</span>');
      
      // Attribute in Grün (mit korrigiertem Regex-Pattern)
      colorized = colorized.replace(/\s([\w:]+)=/g, 
        ' <span class="xml-attr" style="color: ' + (isDark ? '#48bb78' : '#38a169') + '">$1</span>=');
      
      // Attributwerte in Gelb (mit korrigiertem Regex-Pattern)
      colorized = colorized.replace(/="([^"]*)"/g, 
        '="<span class="xml-value" style="color: ' + (isDark ? '#ecc94b' : '#d69e2e') + '">$1</span>"');
      
      // CDATA-Markierung in Grau
      colorized = colorized.replace(/(&lt;!\[CDATA\[|\]\]&gt;)/g, 
        '<span class="xml-cdata" style="color: ' + (isDark ? '#a0aec0' : '#718096') + '">$1</span>');
      
      // CDATA-Inhalt in Blau - Fix für überlappende Spans
      colorized = colorized.replace(/(&lt;!\[CDATA\[)(.+?)(\]\]&gt;)/g, function(match, p1, p2, p3) {
        return p1 + '<span class="xml-cdata-content" style="color: ' + (isDark ? '#4299e1' : '#3182ce') + '">' + p2 + '</span>' + p3;
      });
      
      return colorized;
    };
    
    const highlightedVast = (
      <div 
        dangerouslySetInnerHTML={{ 
          __html: addLineNumbersGlobal(colorizeVast(formattedVast, isDarkMode), 'xml')
        }}
        className={isWordWrapEnabled ? 'whitespace-normal' : 'whitespace-pre'}
      />
    );
    
    return (
      <div className="mt-2">
        {highlightedVast}
      </div>
    );
  }, [addLineNumbersGlobal, formatXmlForDisplay, isDarkMode, isWordWrapEnabled]);

  // Render the VAST tabs
  const renderVastTabs = useCallback(() => {
    // Helper function to get or create ref for fetched VAST tabs
    const getFetchedVastRef = (index: number): React.RefObject<HTMLDivElement> => {
      if (!fetchedVastOutputRefs.current.has(index)) {
          // Create refs on demand
          fetchedVastOutputRefs.current.set(index, React.createRef<HTMLDivElement>());
      }
      return fetchedVastOutputRefs.current.get(index)!;
    };

    // Interface for tab items
    interface TabItem {
      id: number;
      label: string;
      ref: React.RefObject<HTMLDivElement>;
      content: string | null;
      error?: string | null;
      isLoading?: boolean;
      source?: string;
    }

    // If no VAST content, show empty state
    if (!rawVastContent && vastChain.length === 0) {
      return (
        <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg mt-4`}>
          <p className="text-center text-gray-500">No VAST content detected in the JSON</p>
        </div>
      );
    }

    // Create all tabs
    const tabs: TabItem[] = [
      {
        id: 0,
        label: 'Embedded VAST',
        ref: embeddedVastOutputRef,
        content: rawVastContent,
        source: 'JSON'
      }
    ];
    
    // Füge statische Wrapper-Tabs hinzu
    tabs.push({
      id: 1,
      label: 'VASTAdTagURI (1)',
      ref: getFetchedVastRef(0),
      content: vastChain[0]?.content || null,
      error: vastChain[0]?.error || null,
      isLoading: vastChain[0]?.isLoading || false,
      source: vastChain[0]?.uri || ''
    });
    
    tabs.push({
      id: 2,
      label: 'VASTAdTagURI (2)',
      ref: getFetchedVastRef(1),
      content: vastChain[1]?.content || null,
      error: vastChain[1]?.error || null,
      isLoading: vastChain[1]?.isLoading || false,
      source: vastChain[1]?.uri || ''
    });
    
    // Erstelle Search Panel für den aktuellen Tab
    const renderSearchPanel = (targetRef: React.RefObject<HTMLDivElement> | null) => {
      if (!showVastSearch || !targetRef?.current) return null;
      
      return (
        <SearchPanel
          contentType="VAST"
          targetRef={targetRef}
          isDarkMode={isDarkMode}
        />
      );
    };
    
    // Render source link
    const renderSource = (source?: string) => {
      if (!source) return null;
      
      let displaySource = source;
      
      // Wenn nicht JSON, dann zeige die volle URL an
      if (source !== 'JSON') {
        // Keine Kürzung mehr, zeige die volle URL an
        displaySource = source;
      }
      
      const handleSourceClick = () => {
        if (source !== 'JSON') {
          window.open(source, '_blank', 'noopener,noreferrer');
        }
      };
      
      return (
        <span 
          className={`cursor-pointer hover:underline ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}
          onClick={handleSourceClick}
          title={source}
        >
          {displaySource}
        </span>
      );
    };
    
    return (
      <div className="mt-4">
        {/* Tab Headers */}
        <div className={`rounded-t-lg bg-gray-100 dark:bg-gray-700 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="flex flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveVastTabIndex(tab.id)}
                className={`${
                  activeVastTabIndex === tab.id
                    ? `${isDarkMode ? 'bg-gray-200 text-gray-900' : 'bg-white text-blue-600'} border-b-2 border-blue-500`
                    : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                } px-4 py-2 text-sm font-medium rounded-t-lg`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-b-lg" style={{ height: 'calc(100vh - 350px)', overflow: 'auto' }}>
          {/* Embedded VAST */}
          <div 
            className={activeVastTabIndex === 0 ? 'block' : 'hidden'}
            ref={embeddedVastOutputRef}
          >
            <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="text-xs">
                Source: {renderSource(tabs[0].source)}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={toggleWordWrap}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    Wrap
                  </div>
                </button>
                <button
                  onClick={() => setShowVastSearch(!showVastSearch)}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find
                  </div>
                </button>
                <button
                  onClick={copyVastToClipboard}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </div>
                </button>
              </div>
            </div>
            
            {/* Search Panel for Embedded VAST */}
            {renderSearchPanel(embeddedVastOutputRef)}
            
            <div className="text-sm p-4 overflow-x-auto">
              {renderVastContent(rawVastContent)}
            </div>
          </div>
          
          {/* VASTAdTagURI (1) */}
          <div 
            className={activeVastTabIndex === 1 ? 'block' : 'hidden'}
            ref={getFetchedVastRef(0)}
          >
            <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="text-xs">
                Source: {renderSource(tabs[1].source)}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={toggleWordWrap}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    Wrap
                  </div>
                </button>
                <button
                  onClick={() => setShowVastSearch(!showVastSearch)}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find
                  </div>
                </button>
                <button
                  onClick={copyVastToClipboard}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </div>
                </button>
              </div>
            </div>
            
            {/* Search Panel for VASTAdTagURI (1) */}
            {renderSearchPanel(getFetchedVastRef(0))}
            
            <div className="text-sm p-4 overflow-x-auto">
              {vastChain[0]?.isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : vastChain[0]?.error ? (
                <div className="text-red-500 p-4 rounded-lg bg-red-50 dark:bg-red-900 dark:bg-opacity-20">
                  <p className="font-medium">Error fetching VAST:</p>
                  <p>{vastChain[0]?.error}</p>
                </div>
              ) : vastChain[0]?.content ? (
                renderVastContent(vastChain[0]?.content)
              ) : (
                <div className="text-center py-4">Kein Wrapper gefunden</div>
              )}
            </div>
          </div>
          
          {/* VASTAdTagURI (2) */}
          <div 
            className={activeVastTabIndex === 2 ? 'block' : 'hidden'}
            ref={getFetchedVastRef(1)}
          >
            <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="text-xs">
                Source: {renderSource(tabs[2].source)}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={toggleWordWrap}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    Wrap
                  </div>
                </button>
                <button
                  onClick={() => setShowVastSearch(!showVastSearch)}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find
                  </div>
                </button>
                <button
                  onClick={copyVastToClipboard}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </div>
                </button>
              </div>
            </div>
            
            {/* Search Panel for VASTAdTagURI (2) */}
            {renderSearchPanel(getFetchedVastRef(1))}
            
            <div className="text-sm p-4 overflow-x-auto">
              {vastChain[1]?.isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : vastChain[1]?.error ? (
                <div className="text-red-500 p-4 rounded-lg bg-red-50 dark:bg-red-900 dark:bg-opacity-20">
                  <p className="font-medium">Error fetching VAST:</p>
                  <p>{vastChain[1]?.error}</p>
                </div>
              ) : vastChain[1]?.content ? (
                renderVastContent(vastChain[1]?.content)
              ) : (
                <div className="text-center py-4">Kein Wrapper gefunden</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [rawVastContent, vastChain, activeVastTabIndex, isDarkMode, embeddedVastOutputRef, renderVastContent, showVastSearch, setShowVastSearch, toggleWordWrap, copyVastToClipboard]);

  // Funktion zum Anzeigen der JSON-Outline
  const generateJsonOutline = (json: any, path: string = ''): React.ReactNode => {
    if (!json || typeof json !== 'object') return null;
    
    const isArray = Array.isArray(json);
    
    return (
      <ul className={`${path ? 'ml-4' : ''} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {Object.keys(json).map((key, index) => {
          const currentPath = path ? `${path}.${key}` : key;
          const currentValue = json[key];
          const isObject = currentValue && typeof currentValue === 'object';
          
          // Abkürzung für Arrays mit vielen Elementen
          if (isArray && Object.keys(json).length > 20 && index >= 10 && index < Object.keys(json).length - 5) {
            if (index === 10) {
              return (
                <li key={`${currentPath}-ellipsis`} className="py-1 pl-2 text-gray-500">
                  ... {Object.keys(json).length - 15} more items ...
                </li>
              );
            }
            return null;
          }
          
          return (
            <li key={currentPath} className="py-1">
              <div className="flex items-start">
                <span 
                  className={`cursor-pointer flex items-center ${isDarkMode ? 'hover:text-blue-300' : 'hover:text-blue-600'}`}
                  onClick={() => {
                    // Scroll zur entsprechenden Position im JSON
                    const searchKey = isArray ? `\\[${key}\\]` : `"${key}"`;
                    const elements = jsonOutputRef.current?.querySelectorAll(`[data-key="${searchKey}"]`);
                    if (elements && elements.length > 0) {
                      elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Kurzes Highlighting
                      elements[0].classList.add(isDarkMode ? 'bg-blue-900' : 'bg-blue-100');
                      setTimeout(() => {
                        elements[0].classList.remove(isDarkMode ? 'bg-blue-900' : 'bg-blue-100');
                      }, 1500);
                    }
                  }}
                >
                  {isObject && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <span className={isArray ? 'text-purple-500 dark:text-purple-400' : 'text-blue-500 dark:text-blue-400'}>
                    {key}
                  </span>
                  {!isObject && (
                    <span className="ml-2 text-gray-500 truncate max-w-[150px] text-xs">
                      {typeof currentValue === 'string' 
                        ? `"${currentValue.length > 20 ? currentValue.substring(0, 20) + '...' : currentValue}"`
                        : String(currentValue)
                      }
                    </span>
                  )}
                </span>
              </div>
              {isObject && generateJsonOutline(currentValue, currentPath)}
            </li>
          );
        })}
      </ul>
    );
  };

  // Funktion zum Rendern der JSON-Outline
  const renderJsonOutline = () => {
    if (!parsedJson) return null;
    
    return (
      <div className={`p-4 rounded-lg border overflow-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h4 className={`text-md font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>JSON Structure</h4>
        <div className="text-xs font-mono">
          {generateJsonOutline(parsedJson)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* History Panel */}
      {showHistory && (
        <JsonHistoryPanel
          isDarkMode={isDarkMode}
          history={history}
          onRestore={restoreFromHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* JSON Input/Output Section */}
        <div>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'} mb-2`}>
            JSON Eingabe
          </h2>
          
          <div className={`mb-4 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-t-lg border-b border-gray-300 dark:border-gray-600 flex justify-between items-center">
              <div className="flex space-x-2">
                <label 
                  htmlFor="json-input"
                  className={`text-xs uppercase font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  Eingabe: JSON
                </label>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleClear}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Leeren
                  </div>
                </button>
              </div>
            </div>
            
            <textarea
              id="json-input"
              className={`w-full p-4 font-mono text-sm resize-none outline-none ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-200 placeholder-gray-500' 
                  : 'bg-white text-gray-800 placeholder-gray-400'
              }`}
              style={{ height: '40vh', minHeight: '350px', maxHeight: '50vh' }}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Füge hier dein JSON mit VAST-Inhalt ein..."
              aria-label="JSON input"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleFormat}
              className={`px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white'
                  : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white'
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
        
        {/* VAST Viewer Section */}
        <div>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'} mb-2`}>
            VAST Viewer
          </h2>
          
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${
            isDarkMode ? 'border-gray-700' : 'border-gray-300'} h-full flex flex-col`}
          >
            {renderVastTabs()}
          </div>
        </div>
      </div>
      
      {/* CopyMessage anzeigen */}
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