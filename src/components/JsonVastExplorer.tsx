import React, { useState, useRef, useCallback, useEffect } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
import JsonHistoryPanel from './shared/JsonHistoryPanel';
import JsonSearch from './search/JsonSearch';
import { performSearch } from './search/SearchFix';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copyMessage, setCopyMessage] = useState('');
  
  // Suche und Tab-Verwaltung
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(false); // State für Zeilenumbruch
  
  // Für Debugging-Nachrichten
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchDebugMessage, setSearchDebugMessage] = useState<string | null>(null);
  
  // Separate Suchvariablen für JSON und VAST
  const [jsonSearchTerm, setJsonSearchTerm] = useState('');
  const [jsonSearchResults, setJsonSearchResults] = useState<{element: HTMLElement, text: string, startPos: number}[]>([]);
  const [jsonCurrentResultIndex, setJsonCurrentResultIndex] = useState(-1);
  const [jsonSearchCleanup, setJsonSearchCleanup] = useState<(() => void) | null>(null);
  const [jsonSearchStatus, setJsonSearchStatus] = useState<'idle' | 'no-results' | 'results'>('idle');
  
  // Suchvariablen für VAST - jetzt als Array für jeden Tab
  const [vastSearchTerm, setVastSearchTerm] = useState('');
  const [vastTabSearches, setVastTabSearches] = useState<{
    results: {element: HTMLElement, text: string, startPos: number}[];
    currentIndex: number;
    cleanup: (() => void) | null;
    status: 'idle' | 'no-results' | 'results';
  }[]>([]);
  
  // Alte VAST-Suchvariablen für Abwärtskompatibilität - markiert als unbenutzt
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vastSearchResults, setVastSearchResults] = useState<{element: HTMLElement, text: string, startPos: number}[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vastCurrentResultIndex, setVastCurrentResultIndex] = useState(-1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vastSearchCleanup, setVastSearchCleanup] = useState<(() => void) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vastSearchStatus, setVastSearchStatus] = useState<'idle' | 'no-results' | 'results'>('idle');
  
  // Alte Variablen für Abwärtskompatibilität - markiert als unbenutzt
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [directSearchTerm, setDirectSearchTerm] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [directSearchResults, setDirectSearchResults] = useState<{element: HTMLElement, text: string, startPos: number}[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentDirectResultIndex, setCurrentDirectResultIndex] = useState(-1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [directSearchCleanup, setDirectSearchCleanup] = useState<(() => void) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeTabIndex, _setActiveTabIndex] = useState(0);
  
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
  
  // Refs for DOM elements and content
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const jsonOutputRef = useRef<HTMLDivElement>(null);
  
  // Ref for Embedded VAST output
  const embeddedVastOutputRef = useRef<HTMLDivElement>(null);
  const fetchedVastOutputRefs = useRef<Map<number, React.RefObject<HTMLDivElement>>>(new Map());
  
  // Custom hook for Syntax Highlighting
  const { highlightJson, highlightXml /* formatXml */ } = useHighlighter();
  
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
    
    // Verbesserte Regex, um VASTAdTagURI zu finden und URL zu extrahieren
    // Behandelt CDATA und entfernt Whitespace
    const regex = /<VASTAdTagURI(?:\s[^>]*)?>\s*(?:<!\[CDATA\[\s*)?(https?:\/\/[^\s<\]]+)\s*(?:\]\]>)?\s*<\/VASTAdTagURI>/i;
    const match = content.match(regex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return null;
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
  }, [extractAdTagUri, MAX_VAST_WRAPPER]);

  // Zuerst füge ich einen State für die aufgeklappten JSON-Elemente hinzu
  const [expandedJsonPaths, setExpandedJsonPaths] = useState<Set<string>>(new Set());
  const [expandedVastNodes, setExpandedVastNodes] = useState<Set<string>>(new Set());

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
          const isExpanded = expandedJsonPaths.has(currentPath);
          
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
                    if (isObject) {
                      // Toggle expanded state für diesen Pfad
                      const newExpandedPaths = new Set(expandedJsonPaths);
                      if (isExpanded) {
                        newExpandedPaths.delete(currentPath);
                      } else {
                        newExpandedPaths.add(currentPath);
                      }
                      setExpandedJsonPaths(newExpandedPaths);
                    } else {
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
                    }
                  }}
                >
                  {isObject && (
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 mr-1 transition-transform duration-200 ${isExpanded ? 'transform rotate-90' : ''}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
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
              {isObject && isExpanded && generateJsonOutline(currentValue, currentPath)}
            </li>
          );
        })}
      </ul>
    );
  };

  // Funktion zum Generieren der XML-Outline - Verbesserte Version
  const generateVastOutline = useCallback((xmlContent: string | null): React.ReactNode => {
    if (!xmlContent) return null;
    
    try {
      // XML parsen und als Baumstruktur darstellen
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      
      // Rekursive Funktion zum Aufbau der Outline
      const traverseNode = (node: Node, depth: number = 0, parentPath: string = ''): React.ReactNode => {
        // Textknoten ignorieren
        if (node.nodeType === Node.TEXT_NODE) {
          const textContent = node.textContent?.trim();
          if (!textContent) return null;
          
          // Nur Textknoten mit Inhalt anzeigen (maximal 20 Zeichen)
          return (
            <li className="py-1 pl-2 ml-4 text-gray-500 text-xs">
              {textContent.length > 20 ? `${textContent.substring(0, 20)}...` : textContent}
            </li>
          );
        }
        
        // Element-Knoten verarbeiten
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const nodeName = element.nodeName;
          const hasChildren = element.childNodes.length > 0;
          const attributes = element.attributes;
          const nodePath = `${parentPath}/${nodeName}`;
          const isExpanded = expandedVastNodes.has(nodePath);
          
          return (
            <li key={`${nodeName}-${depth}`} className="py-1">
              <div className="flex items-start">
                <span 
                  className={`cursor-pointer flex items-center ${isDarkMode ? 'hover:text-blue-300' : 'hover:text-blue-600'}`}
                  onClick={() => {
                    if (hasChildren) {
                      // Toggle expanded state für diesen Pfad
                      const newExpandedNodes = new Set(expandedVastNodes);
                      if (isExpanded) {
                        newExpandedNodes.delete(nodePath);
                      } else {
                        newExpandedNodes.add(nodePath);
                      }
                      setExpandedVastNodes(newExpandedNodes);
                    }
                  }}
                >
                  {hasChildren && (
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 mr-1 transition-transform duration-200 ${isExpanded ? 'transform rotate-90' : ''}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <span className="text-orange-500 dark:text-orange-400">
                    {nodeName}
                  </span>
                  
                  {/* Zeige Attribute an, wenn vorhanden */}
                  {attributes.length > 0 && (
                    <span className="ml-2 text-blue-500 text-xs">
                      {Array.from(attributes).map((attr) => 
                        <span key={attr.name}>{attr.name}="{attr.value}" </span>
                      )}
                    </span>
                  )}
                </span>
              </div>
              
              {/* Rekursion für Kinder-Elemente, nur wenn ausgeklappt */}
              {hasChildren && isExpanded && (
                <ul className="ml-4">
                  {Array.from(element.childNodes).map((childNode, index) => (
                    <React.Fragment key={index}>
                      {traverseNode(childNode, depth + 1, nodePath)}
                    </React.Fragment>
                  ))}
                </ul>
              )}
            </li>
          );
        }
        
        // CDATA-Knoten explizit verarbeiten
        if (node.nodeType === Node.CDATA_SECTION_NODE) {
          const cdataContent = node.nodeValue?.trim();
          if (!cdataContent) return null;
          
          return (
            <li className="py-1 pl-2 ml-4">
              <span className="text-purple-500 dark:text-purple-400 text-xs">
                {'<![CDATA['}{cdataContent.length > 30 ? `${cdataContent.substring(0, 30)}...` : cdataContent}{']]>'}
              </span>
            </li>
          );
        }
        
        // Comment-Knoten verarbeiten
        if (node.nodeType === Node.COMMENT_NODE) {
          const commentContent = node.nodeValue?.trim();
          if (!commentContent) return null;
          
          return (
            <li className="py-1 pl-2 ml-4 text-gray-400 text-xs">
              {'<!-- '}{commentContent.length > 20 ? `${commentContent.substring(0, 20)}...` : commentContent}{' -->'}
            </li>
          );
        }
        
        return null;
      };
      
      // Traversiere vom Root-Element aus
      const rootElement = xmlDoc.documentElement;
      return (
        <ul className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {traverseNode(rootElement)}
        </ul>
      );
    } catch (error) {
      console.error("Error generating XML outline:", error);
      return <p className="text-red-500">Failed to parse XML</p>;
    }
  }, [isDarkMode, expandedVastNodes]);

  // Zuerst füge ich die State-Variablen für die Ansichtsumschaltung hinzu
  const [showJsonStructure, setShowJsonStructure] = useState(false);
  const [showVastStructure, setShowVastStructure] = useState(false);

  // Helper function für VAST Refs
  const getFetchedVastRef = useCallback((index: number): React.RefObject<HTMLDivElement> => {
    if (!fetchedVastOutputRefs.current.has(index)) {
      // Create refs on demand
      fetchedVastOutputRefs.current.set(index, React.createRef<HTMLDivElement>());
    }
    return fetchedVastOutputRefs.current.get(index)!;
  }, []);

  // Hilfsfunktion, um alle JSON-Pfade rekursiv aufzuklappen
  const initializeExpandedPaths = useCallback((json: any, path: string = '', paths: Set<string> = new Set<string>()) => {
    if (!json || typeof json !== 'object') return paths;
    
    // Aktuellen Pfad hinzufügen
    if (path) {
      paths.add(path);
    }
    
    // Rekursiv alle Kinder durchgehen
    Object.keys(json).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      if (json[key] && typeof json[key] === 'object') {
        initializeExpandedPaths(json[key], currentPath, paths);
      }
    });
    
    setExpandedJsonPaths(paths);
    return paths;
  }, []);
  
  // Hilfsfunktion, um alle XML-Knoten rekursiv aufzuklappen
  const initializeExpandedVastNodes = useCallback((xmlContent: string) => {
    if (!xmlContent) return;
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const paths = new Set<string>();
      
      // Rekursive Funktion, um alle Pfade zu sammeln
      const traverseNode = (node: Node, parentPath: string = '') => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const nodeName = element.nodeName;
          const nodePath = `${parentPath}/${nodeName}`;
          
          // Pfad zur Liste hinzufügen
          paths.add(nodePath);
          
          // Rekursiv für alle Kinder
          Array.from(element.childNodes).forEach(childNode => {
            traverseNode(childNode, nodePath);
          });
        }
      };
      
      // Starte mit dem Root-Element
      traverseNode(xmlDoc.documentElement);
      
      setExpandedVastNodes(paths);
    } catch (error) {
      console.error("Error initializing expanded VAST nodes:", error);
    }
  }, []);

  // Stelle sicher, dass die Refs korrekt initialisiert werden, wenn Daten verfügbar sind
  useEffect(() => {
    // Refs-Status loggen
    if (parsedJson && jsonOutputRef.current) {
      console.log("JsonOutputRef ist initialisiert und bereit für die Suche");
    }
    
    if (rawVastContent && embeddedVastOutputRef.current) {
      console.log("EmbeddedVastOutputRef ist initialisiert und bereit für die Suche");
    }
    
    // Aktive Suche deaktivieren, wenn keine gültigen Refs mehr vorhanden sind
    if (isSearchOpen && !jsonOutputRef.current) {
      console.warn("Suche ist aktiv, aber Ref ist nicht mehr gültig - deaktiviere Suche");
      setIsSearchOpen(false);
    }
  }, [parsedJson, rawVastContent, jsonOutputRef, isSearchOpen]);

  // Tastaturkürzel für die Suche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+F für Suchfunktion
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        
        // Initialisiere die aufgeklappten JSON-Pfade, wenn neue Daten geladen werden
        initializeExpandedPaths(currentParsedJson);
        
        // Initialisiere die aufgeklappten VAST-Nodes, wenn neue VAST-Daten geladen werden
        if (currentRawVast) {
          initializeExpandedVastNodes(currentRawVast);
        }
        
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
        
        // Initialisiere die aufgeklappten JSON-Pfade, auch wenn kein VAST gefunden wurde
        initializeExpandedPaths(currentParsedJson);
        
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
      setIsSearchOpen(false); // Also hide search on error
    }
  }, [jsonInput, findVastContent, extractVastUrl, extractAdTagUri, fetchVastChainRecursive, addToHistoryItem, initializeExpandedPaths, initializeExpandedVastNodes]);
  
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
    setIsSearchOpen(false);
  }, [setIsSearchOpen, setJsonInput, setParsedJson, setRawVastContent, setError, setVastChain]);
  
  // Clear all fields
  const handleClear = useCallback(() => {
    setJsonInput('');
    setParsedJson(null);
    setRawVastContent(null);
    setError('');
    setCopyMessage('');
    setIsSearchOpen(false);
    // Reset fetch states on clear
    setVastChain([]);
    setActiveVastTabIndex(0);
    setIsSearchOpen(false); // Also hide search on clear
    // Leere die aufgeklappten Pfade
    setExpandedJsonPaths(new Set());
    setExpandedVastNodes(new Set());
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
      // Verbesserte XML-Formatierung mit korrekter Einrückung
      const formatXml = (xml: string): string => {
        // XML in einzelne Zeichen aufteilen für bessere Kontrolle
        let formattedXml = '';
        let indentLevel = 0;
        let inCdata = false;
        
        // CDATA-Inhalte inline lassen und nicht umbrechen
        xml = xml.replace(/(<!\[CDATA\[.*?\]\]>)/g, function(match) {
          return match.replace(/\s+/g, ' ');
        });
        
        // Tag-Inhalte und Tags durch Zeilenumbrüche trennen
        xml = xml.replace(/>\s*</g, '>\n<');
        
        // Durch die Zeilen gehen und Einrückung hinzufügen
        const lines = xml.split('\n');
        for (let i = 0; i < lines.length; i++) {
          let line = lines[i].trim();
          if (!line) continue;
          
          // Prüfen, ob es ein schließendes Tag ist
          const isClosingTag = line.startsWith('</');
          // Prüfen, ob es ein selbstschließendes Tag ist
          const isSelfClosingTag = line.match(/<[^>]*\/>/);
          // Prüfen, ob es ein CDATA-Block ist
          const isCdataTag = line.match(/!\[CDATA\[.*?\]\]/);
          
          // Einrückung für schließende Tags reduzieren
          if (isClosingTag) {
            indentLevel--;
          }
          
          // Einrückung hinzufügen (nur wenn nicht in CDATA-Block)
          if (!inCdata) {
            formattedXml += '  '.repeat(Math.max(0, indentLevel)) + line + '\n';
          } else {
            formattedXml += line + '\n';
          }
          
          // Einrückung für öffnende Tags erhöhen
          // Wenn es ein öffnendes, nicht selbstschließendes Tag ist
          if (!isClosingTag && !isSelfClosingTag && line.startsWith('<') && !isCdataTag) {
            indentLevel++;
          }
          
          // CDATA-Status verfolgen
          if (line.includes('<![CDATA[')) {
            inCdata = true;
          }
          if (line.includes(']]>')) {
            inCdata = false;
          }
        }
        
        return formattedXml;
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
    } else if (activeVastTabIndex > 0 && vastChain[activeVastTabIndex - 1]?.content) {
      // Stellen sicher, dass content nicht null ist
      const content = vastChain[activeVastTabIndex - 1].content;
      if (content) {
        copyToClipboard(content, 'VAST');
      }
    }
  }, [activeVastTabIndex, rawVastContent, vastChain, copyToClipboard]);
  
  // Render VAST content with proper formatting
  const renderVastContent = useCallback((vastContent: string | null) => {
    if (!vastContent) return <p className="mt-4 text-red-500">No VAST content found</p>;
    
    const formattedVast = formatXmlForDisplay(vastContent);
    
    // Verwende die highlightXml-Funktion aus useHighlighter statt eigener Implementierung
    const highlightedVast = (
      <div 
        dangerouslySetInnerHTML={{ 
          __html: addLineNumbersGlobal(highlightXml(formattedVast, isDarkMode), 'xml')
        }}
        className={isWordWrapEnabled ? 'whitespace-normal' : 'whitespace-pre'}
      />
    );
    
    return (
      <div className="mt-2">
        {highlightedVast}
      </div>
    );
  }, [addLineNumbersGlobal, formatXmlForDisplay, highlightXml, isDarkMode, isWordWrapEnabled]);

  // Referenzen für DOM-Elemente
  const jsonRef = useRef<HTMLDivElement>(null);
  const vastRef = useRef<HTMLDivElement>(null);

  // Log search state changes
  useEffect(() => {
    console.log("Search state changed:", isSearchOpen);
    setSearchDebugMessage(`Search state: ${isSearchOpen ? 'OPEN' : 'CLOSED'}`);
    // Clear message after 3 seconds
    const timer = setTimeout(() => setSearchDebugMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [isSearchOpen]);

  // Hilfsfunktion zum Scrollen zu einem Element (vertikal UND horizontal)
  const scrollToElement = useCallback((element: HTMLElement) => {
    // Prüfen, ob das Element existiert
    if (!element) return;
    
    // Finde das nächste scrollbare Elternelement
    let scrollContainer = element.parentElement;
    while (scrollContainer) {
      // Prüfe, ob das Element scrollbar ist
      const hasVerticalScroll = scrollContainer.scrollHeight > scrollContainer.clientHeight;
      const hasHorizontalScroll = scrollContainer.scrollWidth > scrollContainer.clientWidth;
      
      if (hasVerticalScroll || hasHorizontalScroll) {
        break;
      }
      scrollContainer = scrollContainer.parentElement;
    }
    
    if (scrollContainer) {
      // Element-Position im Container ermitteln
      const elementRect = element.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      
      // Berechne die Scroll-Positionen
      const verticalScroll = 
        element.offsetTop - scrollContainer.offsetTop - (containerRect.height / 2) + (elementRect.height / 2);
      
      const horizontalScroll = 
        element.offsetLeft - scrollContainer.offsetLeft - (containerRect.width / 2) + (elementRect.width / 2);
      
      // Scrolle vertikal und horizontal
      scrollContainer.scrollTo({
        top: verticalScroll,
        left: Math.max(0, horizontalScroll), // Sicherstellen, dass wir nicht negativ scrollen
        behavior: 'smooth'
      });
    } else {
      // Fallback zur normalen scrollIntoView-Methode
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center' // Zentrieren auch horizontal
      });
    }
  }, []);

  // Navigate to next/previous result - jetzt ohne zirkuläre Abhängigkeit
  const goToNextJsonResult = useCallback(() => {
    if (jsonSearchResults.length === 0) return;
    
    const nextIndex = (jsonCurrentResultIndex + 1) % jsonSearchResults.length;
    setJsonCurrentResultIndex(nextIndex);
    
    const { highlightMatch } = performSearch(jsonSearchTerm, jsonRef.current, null);
    highlightMatch(nextIndex, jsonSearchResults);
  }, [jsonSearchResults, jsonCurrentResultIndex, jsonSearchTerm, jsonRef]);
  
  const goToPrevJsonResult = useCallback(() => {
    if (jsonSearchResults.length === 0) return;
    
    const prevIndex = (jsonCurrentResultIndex - 1 + jsonSearchResults.length) % jsonSearchResults.length;
    setJsonCurrentResultIndex(prevIndex);
    
    const { highlightMatch } = performSearch(jsonSearchTerm, jsonRef.current, null);
    highlightMatch(prevIndex, jsonSearchResults);
  }, [jsonSearchResults, jsonCurrentResultIndex, jsonSearchTerm, jsonRef]);

  // Initialisiere neue VAST-Tab-Suchobjekte, wenn sich die Chain ändert
  useEffect(() => {
    // Erstelle ein Array mit einem Eintrag für den Embedded VAST-Tab 
    // und je einem für jeden Chain-Tab
    const initialSearches = Array(vastChain.length + 1).fill(null).map(() => ({
      results: [],
      currentIndex: -1,
      cleanup: null,
      status: 'idle' as const
    }));
    
    setVastTabSearches(initialSearches);
  }, [vastChain.length]);

  // Cleanup beim Tab-Wechsel
  useEffect(() => {
    // Wenn wir unsere VAST-Tabs wechseln, rufen wir die Cleanup-Funktion 
    // des aktuellen Tabs auf, um Hervorhebungen zu entfernen
    return () => {
      if (vastTabSearches[activeVastTabIndex]?.cleanup) {
        vastTabSearches[activeVastTabIndex].cleanup?.();
      }
    };
  }, [activeVastTabIndex, vastTabSearches]);

  // Aktiver Tab hat sich geändert - saubere Trennung der Tabs sicherstellen
  useEffect(() => {
    // Entferne alle Hervorhebungen im DOM, wenn sich der Tab ändert
    const removeAllHighlights = () => {
      document.querySelectorAll('.search-term-highlight, .search-term-current').forEach(el => {
        if (el instanceof HTMLElement) {
          // Wir erstellen ein TextNode mit dem ursprünglichen Inhalt
          const text = el.textContent || '';
          const textNode = document.createTextNode(text);
          // Und ersetzen das hervorgehobene Element durch diesen TextNode
          if (el.parentNode) {
            el.parentNode.replaceChild(textNode, el);
          }
        }
      });
    };
    
    // Rufe die Bereinigungsfunktion auf
    removeAllHighlights();
    
    // Setze auch die Tab-spezifischen Such-Statuswerte zurück
    if (vastTabSearches.length > 0) {
      performVastSearch();
    }
  }, [activeVastTabIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Perform JSON search function
  const performJsonSearch = useCallback(() => {
    // Reset previous search results
    setJsonSearchResults([]);
    setJsonCurrentResultIndex(-1);
    
    if (!jsonSearchTerm.trim()) {
      setJsonSearchStatus('idle');
      return;
    }
    
    // Perform the search
    const { matches, cleanup, highlightMatch } = performSearch(
      jsonSearchTerm,
      jsonRef.current,
      jsonSearchCleanup
    );
    
    // Set the results and cleanup function
    setJsonSearchResults(matches);
    setJsonSearchCleanup(() => cleanup);
    
    // Set appropriate status
    if (matches.length > 0) {
      setJsonSearchStatus('results');
      setJsonCurrentResultIndex(0);
      highlightMatch(0, matches);
      
      // Scroll zum ersten Ergebnis (auch horizontal)
      if (matches[0] && matches[0].element) {
        const element = matches[0].element;
        
        // Verbesserte Scroll-Funktion mit horizontalem Scrollen
        scrollToElement(element);
      }
    } else {
      setJsonSearchStatus('no-results');
    }
  }, [jsonSearchTerm, jsonRef, jsonSearchCleanup, scrollToElement]);

  // Navigation für die VAST-Tabs
  const goToNextVastResult = useCallback(() => {
    const currentTabSearch = vastTabSearches[activeVastTabIndex];
    if (!currentTabSearch || currentTabSearch.results.length === 0) return;
    
    const nextIndex = (currentTabSearch.currentIndex + 1) % currentTabSearch.results.length;
    
    // Aktualisiere den Index im Tab-spezifischen Zustand
    const updatedSearches = [...vastTabSearches];
    updatedSearches[activeVastTabIndex] = {
      ...updatedSearches[activeVastTabIndex],
      currentIndex: nextIndex
    };
    setVastTabSearches(updatedSearches);
    
    // Get the appropriate VAST container for the current tab
    const vastContainer = activeVastTabIndex === 0 
      ? embeddedVastOutputRef.current 
      : getFetchedVastRef(activeVastTabIndex - 1).current;
    
    // Perform the highlight
    const { highlightMatch } = performSearch(vastSearchTerm, vastContainer, null);
    highlightMatch(nextIndex, currentTabSearch.results);
    
    // Scroll zum Ergebnis
    if (currentTabSearch.results[nextIndex]?.element) {
      scrollToElement(currentTabSearch.results[nextIndex].element);
    }
  }, [vastTabSearches, activeVastTabIndex, vastSearchTerm, embeddedVastOutputRef, getFetchedVastRef, scrollToElement]);

  const goToPrevVastResult = useCallback(() => {
    const currentTabSearch = vastTabSearches[activeVastTabIndex];
    if (!currentTabSearch || currentTabSearch.results.length === 0) return;
    
    const prevIndex = (currentTabSearch.currentIndex - 1 + currentTabSearch.results.length) % currentTabSearch.results.length;
    
    // Aktualisiere den Index im Tab-spezifischen Zustand
    const updatedSearches = [...vastTabSearches];
    updatedSearches[activeVastTabIndex] = {
      ...updatedSearches[activeVastTabIndex],
      currentIndex: prevIndex
    };
    setVastTabSearches(updatedSearches);
    
    // Get the appropriate VAST container for the current tab
    const vastContainer = activeVastTabIndex === 0 
      ? embeddedVastOutputRef.current 
      : getFetchedVastRef(activeVastTabIndex - 1).current;
    
    // Perform the highlight
    const { highlightMatch } = performSearch(vastSearchTerm, vastContainer, null);
    highlightMatch(prevIndex, currentTabSearch.results);
    
    // Scroll zum Ergebnis
    if (currentTabSearch.results[prevIndex]?.element) {
      scrollToElement(currentTabSearch.results[prevIndex].element);
    }
  }, [vastTabSearches, activeVastTabIndex, vastSearchTerm, embeddedVastOutputRef, getFetchedVastRef, scrollToElement]);

  // Perform VAST search function - jetzt tabspezifisch
  const performVastSearch = useCallback(() => {
    // Hole den aktuellen Tab-Suchstatus
    const currentTabSearch = vastTabSearches[activeVastTabIndex];
    if (!currentTabSearch) return;
    
    // Entferne zuerst alle vorherigen Hervorhebungen
    document.querySelectorAll('.search-term-highlight, .search-term-current').forEach(el => {
      if (el instanceof HTMLElement) {
        // Wir erstellen ein TextNode mit dem ursprünglichen Inhalt
        const text = el.textContent || '';
        const textNode = document.createTextNode(text);
        // Und ersetzen das hervorgehobene Element durch diesen TextNode
        if (el.parentNode) {
          el.parentNode.replaceChild(textNode, el);
        }
      }
    });
    
    // Aktualisiere das Array mit leeren Ergebnissen für die aktuelle Suche
    const updatedSearches = [...vastTabSearches];
    updatedSearches[activeVastTabIndex] = {
      ...updatedSearches[activeVastTabIndex],
      results: [],
      currentIndex: -1,
      status: 'idle' as const
    };
    setVastTabSearches(updatedSearches);
    
    // Wenn Suchbegriff leer ist, breche ab
    if (!vastSearchTerm.trim()) {
      return;
    }
    
    // Get the appropriate VAST container for the current tab
    const vastContainer = activeVastTabIndex === 0 
      ? embeddedVastOutputRef.current 
      : getFetchedVastRef(activeVastTabIndex - 1).current;
    
    // Führe die alte Cleanup-Funktion aus, falls vorhanden
    if (currentTabSearch.cleanup) {
      currentTabSearch.cleanup();
    }
    
    // Perform the search
    const { matches, cleanup, highlightMatch } = performSearch(
      vastSearchTerm,
      vastContainer,
      null // Kein direktes Cleanup, wir verwalten es selbst im Array
    );
    
    // Update the current tab's search state
    const newUpdatedSearches = [...vastTabSearches];
    
    if (matches.length > 0) {
      newUpdatedSearches[activeVastTabIndex] = {
        results: matches,
        currentIndex: 0,
        cleanup: cleanup,
        status: 'results' as const
      };
      
      // Highlight first match
      highlightMatch(0, matches);
      
      // Scroll zum ersten Ergebnis (auch horizontal)
      if (matches[0] && matches[0].element) {
        scrollToElement(matches[0].element);
      }
    } else {
      newUpdatedSearches[activeVastTabIndex] = {
        results: [],
        currentIndex: -1,
        cleanup: cleanup,
        status: 'no-results' as const
      };
    }
    
    setVastTabSearches(newUpdatedSearches);
  }, [vastSearchTerm, activeVastTabIndex, vastTabSearches, embeddedVastOutputRef, getFetchedVastRef, scrollToElement]);

  // WICHTIG: Tab-Wechsel-Handler um Hervorhebungen zu aktualisieren
  const handleVastTabChange = useCallback((newTabIndex: number) => {
    // Wenn der aktuelle Tab mit dem neuen Tab identisch ist, nichts tun
    if (activeVastTabIndex === newTabIndex) return;
    
    // Entferne alle Hervorhebungen
    document.querySelectorAll('.search-term-highlight, .search-term-current').forEach(el => {
      if (el instanceof HTMLElement) {
        // Wir erstellen ein TextNode mit dem ursprünglichen Inhalt
        const text = el.textContent || '';
        const textNode = document.createTextNode(text);
        // Und ersetzen das hervorgehobene Element durch diesen TextNode
        if (el.parentNode) {
          el.parentNode.replaceChild(textNode, el);
        }
      }
    });
    
    // Führe die Cleanup-Funktion für den aktuellen Tab aus
    if (vastTabSearches[activeVastTabIndex]?.cleanup) {
      vastTabSearches[activeVastTabIndex].cleanup?.();
    }
    
    // Setze den neuen Tab-Index
    setActiveVastTabIndex(newTabIndex);
    
    // Verzögert die Hervorhebung neu erstellen, wenn der neue Tab gerendert wurde
    setTimeout(() => {
      // Wenn es Ergebnisse im neuen Tab gibt, hervorheben
      if (vastTabSearches[newTabIndex]?.results.length > 0) {
        const vastContainer = newTabIndex === 0 
          ? embeddedVastOutputRef.current 
          : getFetchedVastRef(newTabIndex - 1).current;
        
        // Hervorhebe das letzte aktive Ergebnis im neuen Tab
        const { highlightMatch } = performSearch(vastSearchTerm, vastContainer, null);
        const currentIndex = vastTabSearches[newTabIndex].currentIndex;
        
        if (currentIndex >= 0 && vastTabSearches[newTabIndex].results.length > currentIndex) {
          highlightMatch(currentIndex, vastTabSearches[newTabIndex].results);
          
          // Scroll zum Ergebnis
          if (vastTabSearches[newTabIndex].results[currentIndex]?.element) {
            scrollToElement(vastTabSearches[newTabIndex].results[currentIndex].element);
          }
        }
      }
    }, 100);
  }, [activeVastTabIndex, embeddedVastOutputRef, getFetchedVastRef, scrollToElement, vastSearchTerm, vastTabSearches]);

  // Wenn sich die Tab-Struktur ändert, müssen wir die VAST-Tabs-Suche neu initialisieren
  useEffect(() => {
    if (vastChain.length > 0) {
      // Beim Ändern der VAST-Kette die Suchhervorhebungen entfernen
      document.querySelectorAll('.search-term-highlight, .search-term-current').forEach(el => {
        if (el instanceof HTMLElement) {
          // Wir erstellen ein TextNode mit dem ursprünglichen Inhalt
          const text = el.textContent || '';
          const textNode = document.createTextNode(text);
          // Und ersetzen das hervorgehobene Element durch diesen TextNode
          if (el.parentNode) {
            el.parentNode.replaceChild(textNode, el);
          }
        }
      });
    }
  }, [vastChain]);

  // Add CSS for search highlighting - jetzt mit Hervorhebung aller Treffer
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    style.innerHTML = `
      .search-term-highlight {
        background-color: rgba(59, 130, 246, 0.3);
        padding: 1px;
        border-radius: 2px;
        font-weight: bold;
      }
      .search-term-current {
        background-color: rgba(239, 68, 68, 0.7);
        color: white;
        padding: 1px;
        border-radius: 2px;
        outline: 2px solid rgba(239, 68, 68, 0.9);
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col px-0 sm:px-1 md:px-3 lg:px-4">
      {/* Original search component - keeping this for reference */}
      {console.log("Rendering with isSearchOpen:", isSearchOpen)}
      <JsonSearch 
        isDarkMode={isDarkMode}
        jsonRef={jsonRef}
        vastRef={vastRef}
        activeTabIndex={0}
        isVisible={isSearchOpen}
        onClose={() => {
          console.log("Closing search panel");
          setIsSearchOpen(false);
        }}
        onSearchComplete={(count) => {
          // count Parameter beibehalten, aber nicht verwenden
          console.log(`Search completed with ${count} results`);
          // Die Variable searchResults wurde entfernt und wird hier nicht mehr gesetzt
        }}
      />
    
      {/* History Panel */}
      {showHistory && (
        <JsonHistoryPanel
          isDarkMode={isDarkMode}
          history={history}
          onRestore={restoreFromHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      <div className="mb-2 sm:mb-3 md:mb-4">
        <div className="flex flex-row space-x-2 sm:space-x-3 md:space-x-4">
          <div className="flex-1">
            <h3 className={`text-base md:text-lg font-semibold mb-1 md:mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>JSON Input</h3>
            <textarea
              ref={textAreaRef}
              value={jsonInput}
              onChange={handleJsonInputChange}
              placeholder="Paste your JSON here..."
              className={`w-full h-28 sm:h-32 p-2 sm:p-3 border rounded-lg font-mono text-xs mb-1 md:mb-2 outline-none transition ${
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

      {error && (
        <div className={`p-3 md:p-4 mb-3 md:mb-4 rounded-lg flex items-center ${
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
        <div className="flex-1 flex flex-col min-h-0 mt-1 sm:mt-2">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 lg:space-x-3 flex-1 min-h-0">
            {/* JSON Content - Left column */}
            {parsedJson && (
              <div className={`${rawVastContent ? 'w-full md:w-1/2' : 'w-full'} min-w-0 flex flex-col`}>
                <div className="flex justify-between items-center mb-1 md:mb-2">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    Formatted JSON
                  </h3>
                  
                  {/* Control buttons mit Toggle für Structure */}
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setShowJsonStructure(!showJsonStructure)}
                      className={`flex items-center px-2 py-1 rounded-md text-xs ${
                        showJsonStructure 
                          ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white') 
                          : (isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                      }`}
                      title="Toggle between JSON view and structure view"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Structure
                    </button>
                    <button 
                      onClick={() => setIsWordWrapEnabled(!isWordWrapEnabled)}
                      className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                      title={isWordWrapEnabled ? "Disable Word Wrap" : "Enable Word Wrap"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                      </svg>
                      Wrap
                    </button>
                    <button 
                      onClick={copyJsonToClipboard} 
                      className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                      title="Copy JSON"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                    
                    {/* Integrierte Suchleiste direkt im UI - jetzt ganz rechts und mit Outline */}
                    <div className="relative flex items-center ml-auto">
                      <div className={`flex items-center border ${isDarkMode ? 'border-blue-500' : 'border-blue-400'} rounded-md overflow-hidden`}>
                        <input
                          type="text"
                          className={`w-32 sm:w-48 px-2 py-1 text-xs search-input ${
                            isDarkMode 
                              ? 'bg-gray-700 text-gray-200 focus:outline-none' 
                              : 'bg-white text-gray-700 focus:outline-none'
                          }`}
                          placeholder="JSON suchen..."
                          value={jsonSearchTerm}
                          onChange={(e) => setJsonSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (e.shiftKey) {
                                // Shift+Enter für die Suche rückwärts
                                if (jsonSearchStatus === 'results') {
                                  goToPrevJsonResult();
                                } else {
                                  performJsonSearch();
                                }
                              } else {
                                // Enter für die Suche vorwärts
                                if (jsonSearchStatus === 'results' && jsonSearchResults.length > 0) {
                                  goToNextJsonResult();
                                } else {
                                  performJsonSearch();
                                }
                              }
                            }
                          }}
                        />
                        <button
                          onClick={performJsonSearch}
                          className={`px-2 py-1 text-xs ${
                            isDarkMode 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                          title="Suche (Enter)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                      </div>
                      
                      {jsonSearchStatus === 'no-results' && (
                        <div className="absolute top-full mt-1 right-0 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 text-xs px-2 py-1 rounded">
                          Keine Treffer
                        </div>
                      )}
                      
                      {jsonSearchResults.length > 0 && (
                        <div className="flex items-center ml-1">
                          <span className="text-xs text-gray-600 dark:text-gray-300 mr-1">
                            {jsonCurrentResultIndex + 1}/{jsonSearchResults.length}
                          </span>
                          
                          <button 
                            onClick={goToPrevJsonResult}
                            className={`p-1 rounded ${
                              isDarkMode 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Vorheriges Ergebnis (Shift+Enter)"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={goToNextJsonResult}
                            className={`p-1 rounded ${
                              isDarkMode 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Nächstes Ergebnis (Enter)"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toggle zwischen JSON und Structure */}
                {showJsonStructure ? (
                  <div className={`p-4 rounded-lg border h-full overflow-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-xs font-mono">
                      {generateJsonOutline(parsedJson)}
                    </div>
                  </div>
                ) : (
                  <div 
                    ref={jsonRef}
                    key={`json-output-${parsedJson ? 'loaded' : 'empty'}`}
                    className={`flex-1 p-2 sm:p-3 md:p-4 rounded-lg border shadow-inner overflow-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                    style={{ height: 'calc(100vh - 300px)' }}
                  >
                    <div 
                      dangerouslySetInnerHTML={{ __html: addLineNumbersGlobal(highlightJson(parsedJson, isDarkMode), 'json') }}
                      className={`w-full ${isWordWrapEnabled ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}
                      style={{ maxWidth: "100%" }}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* VAST Content - Right column or full width if no JSON */}
            {rawVastContent && (
              <div className={`${parsedJson ? 'w-full md:w-1/2' : 'w-full'} min-w-0 flex flex-col`}>
                <h3 className={`text-lg font-semibold mb-1 md:mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>VAST Tags</h3>
                
                {/* Tabs und Toggle für Structure - MIT MEHR ABSTAND */}
                <div className="flex flex-col mb-3 md:mb-4">
                  <div className={`rounded-t-lg bg-gray-100 dark:bg-gray-700 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} overflow-hidden mb-1 md:mb-2`} style={{ maxWidth: 'calc(100% - 8px)' }}>
                    <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', msOverflowStyle: 'none' }}>
                      <div className="flex whitespace-nowrap" style={{ minWidth: 'max-content' }}>
                        {vastChain.length > 0 ? (
                          <>
                            <button
                              onClick={() => handleVastTabChange(0)}
                              className={`${
                                activeVastTabIndex === 0
                                  ? `${isDarkMode ? 'bg-gray-200 text-gray-900' : 'bg-white text-blue-600'} border-b-2 border-blue-500`
                                  : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                              } px-4 py-2 text-sm font-medium rounded-t-lg flex-shrink-0`}
                            >
                              Embedded VAST
                            </button>
                            {vastChain.map((item, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  handleVastTabChange(index + 1);
                                }}
                                className={`${
                                  activeVastTabIndex === index + 1
                                    ? `${isDarkMode ? 'bg-gray-200 text-gray-900' : 'bg-white text-blue-600'} border-b-2 border-blue-500`
                                    : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
                                } px-4 py-2 text-sm font-medium rounded-t-lg flex-shrink-0`}
                              >
                                VASTAdTagURI ({index + 1})
                              </button>
                            ))}
                          </>
                        ) : (
                          <button
                            className={`${isDarkMode ? 'bg-gray-200 text-gray-900' : 'bg-white text-blue-600'} border-b-2 border-blue-500 px-4 py-2 text-sm font-medium rounded-t-lg flex-shrink-0`}
                          >
                            Embedded VAST
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => setShowVastStructure(!showVastStructure)}
                      className={`flex items-center px-2 py-1 rounded-md text-xs ${
                        showVastStructure 
                          ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white') 
                          : (isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                      }`}
                      title="Toggle between VAST view and structure view"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Structure
                    </button>
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
                    
                    {/* Integrierte Suchleiste auch im VAST-Panel - jetzt ganz rechts und mit Outline */}
                    <div className="relative flex items-center ml-auto">
                      <div className={`flex items-center border ${isDarkMode ? 'border-blue-500' : 'border-blue-400'} rounded-md overflow-hidden`}>
                        <input
                          type="text"
                          className={`w-32 sm:w-48 px-2 py-1 text-xs search-input ${
                            isDarkMode 
                              ? 'bg-gray-700 text-gray-200 focus:outline-none' 
                              : 'bg-white text-gray-700 focus:outline-none'
                          }`}
                          placeholder="VAST suchen..."
                          value={vastSearchTerm}
                          onChange={(e) => setVastSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const currentTabSearch = vastTabSearches[activeVastTabIndex];
                              
                              if (e.shiftKey) {
                                // Shift+Enter für die Suche rückwärts
                                if (currentTabSearch?.status === 'results') {
                                  goToPrevVastResult();
                                } else {
                                  performVastSearch();
                                }
                              } else {
                                // Enter für die Suche vorwärts
                                if (currentTabSearch?.status === 'results' && currentTabSearch.results.length > 0) {
                                  goToNextVastResult();
                                } else {
                                  performVastSearch();
                                }
                              }
                            }
                          }}
                        />
                        <button
                          onClick={performVastSearch}
                          className={`px-2 py-1 text-xs ${
                            isDarkMode 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                          title="Suche (Enter)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </button>
                      </div>
                      
                      {vastTabSearches[activeVastTabIndex]?.status === 'no-results' && (
                        <div className="absolute top-full mt-1 right-0 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 text-xs px-2 py-1 rounded">
                          Keine Treffer
                        </div>
                      )}
                      
                      {vastTabSearches[activeVastTabIndex]?.results.length > 0 && (
                        <div className="flex items-center ml-1">
                          <span className="text-xs text-gray-600 dark:text-gray-300 mr-1">
                            {vastTabSearches[activeVastTabIndex]?.currentIndex + 1}/{vastTabSearches[activeVastTabIndex]?.results.length}
                          </span>
                          
                          <button 
                            onClick={goToPrevVastResult}
                            className={`p-1 rounded ${
                              isDarkMode 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Vorheriges Ergebnis (Shift+Enter)"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={goToNextVastResult}
                            className={`p-1 rounded ${
                              isDarkMode 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Nächstes Ergebnis (Enter)"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Toggle zwischen VAST und Structure */}
                {showVastStructure ? (
                  <div className={`p-4 rounded-lg border h-full overflow-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-xs font-mono">
                      {generateVastOutline(rawVastContent)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner" style={{ height: 'calc(100vh - 280px)', overflow: 'auto' }}>
                    {/* Content des aktuellen Tabs */}
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <div className="text-xs">
                        Source: {activeVastTabIndex === 0 
                          ? <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>JSON</span> 
                          : (vastChain[activeVastTabIndex - 1]?.uri && (
                            <span 
                              className={`cursor-pointer hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                              onClick={() => {
                                if (vastChain[activeVastTabIndex - 1]?.uri) {
                                  window.open(vastChain[activeVastTabIndex - 1].uri, '_blank', 'noopener,noreferrer');
                                }
                              }}
                              title={vastChain[activeVastTabIndex - 1]?.uri}
                            >
                              {vastChain[activeVastTabIndex - 1]?.uri}
                            </span>
                          ))}
                      </div>
                    </div>
                    
                    {/* VAST Content Display */}
                    <div className="text-sm p-4 overflow-x-auto" 
                      ref={activeVastTabIndex === 0 ? embeddedVastOutputRef : getFetchedVastRef(activeVastTabIndex - 1)}
                      key={`vast-output-${activeVastTabIndex}`}
                    >
                      {activeVastTabIndex === 0 
                        ? renderVastContent(rawVastContent)
                        : renderVastContent(vastChain[activeVastTabIndex - 1]?.content || null)
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default JsonVastExplorer;