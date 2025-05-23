import React, { useState, useRef, useCallback, useEffect } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
import JsonHistoryPanel from './shared/JsonHistoryPanel';
import Button from './shared/Button';
import Card from './shared/Card';
// Neue Suchkomponente importieren
import EnhancedJsonSearch from './search/EnhancedJsonSearch';

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
  const [copyMessageVisible, setCopyMessageVisible] = useState(false);
  
  // Suche und Tab-Verwaltung
  const [isJsonSearchOpen, setIsJsonSearchOpen] = useState(false);
  const [isVastSearchOpen, setIsVastSearchOpen] = useState(false);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(false); // State für Zeilenumbruch
  const [showStructure, setShowStructure] = useState(false); // State für JSON-Struktur-Ansicht
  
  // Für Debugging-Nachrichten
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchDebugMessage, setSearchDebugMessage] = useState<string | null>(null);
  
  // Separate Suchvariablen für JSON und VAST
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [jsonSearchTerm] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [jsonSearchResults, setJsonSearchResults] = useState<{element: HTMLElement, text: string, startPos: number}[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [jsonCurrentResultIndex, setJsonCurrentResultIndex] = useState(-1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [jsonSearchCleanup, setJsonSearchCleanup] = useState<(() => void) | null>(null);
  const [jsonSearchStatus] = useState<'idle' | 'no-results' | 'results'>('idle');
  
  // Suchvariablen für VAST - jetzt als Array für jeden Tab
  const [vastSearchTerm] = useState('');
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
  const jsonRef = useRef<HTMLDivElement>(null);
  const vastRef = useRef<HTMLDivElement>(null);
  
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
      
      setExpandedJsonPaths(paths);
    } catch (error) {
      console.error("Error initializing expanded VAST nodes:", error);
    }
  }, []);

  // Stelle sicher, dass die Refs korrekt initialisiert werden, wenn Daten verfügbar sind
  useEffect(() => {
    // Refs-Status loggen
    if (parsedJson && jsonRef.current) {
      console.log("JsonRef ist initialisiert und bereit für die Suche");
    }
    
    if (rawVastContent && vastRef.current) {
      console.log("VastRef ist initialisiert und bereit für die Suche");
    }
    
    // Aktive Suche deaktivieren, wenn keine gültigen Refs mehr vorhanden sind
    if (isJsonSearchOpen && (!jsonRef.current && !vastRef.current)) {
      console.warn("Suche ist aktiv, aber keine Refs sind gültig - deaktiviere Suche");
      setIsJsonSearchOpen(false);
    }
  }, [parsedJson, rawVastContent, isJsonSearchOpen]);

  // Tastaturkürzel für die Suche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+F für Suchfunktion
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsJsonSearchOpen(true);
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
          id: Date.now().toString(),
          type: 'json_vast',
          content: JSON.stringify(currentParsedJson).slice(0, 50) + '...', // Kurze Zusammenfassung für content
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
      setIsJsonSearchOpen(false); // Also hide search on error
    }
  }, [jsonInput, findVastContent, extractVastUrl, extractAdTagUri, fetchVastChainRecursive, addToHistoryItem, initializeExpandedPaths, initializeExpandedVastNodes]);
  
  // Copy content to clipboard - Optimized with useCallback
  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyMessage(`${type} copied!`);
        setCopyMessageVisible(true);
        setTimeout(() => {
          setCopyMessageVisible(false);
          setTimeout(() => setCopyMessage(''), 300); // Warte auf Fade-Out-Animation
        }, 2000);
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
    setIsJsonSearchOpen(false);
  }, [setIsJsonSearchOpen, setJsonInput, setParsedJson, setRawVastContent, setError, setVastChain]);
  
  // Clear all fields
  const handleClear = useCallback(() => {
    setJsonInput('');
    setParsedJson(null);
    setRawVastContent(null);
    setError('');
    setCopyMessage('');
    setIsJsonSearchOpen(false);
    // Reset fetch states on clear
    setVastChain([]);
    setActiveVastTabIndex(0);
    setIsJsonSearchOpen(false); // Also hide search on clear
    // Leere die aufgeklappten Pfade
    setExpandedJsonPaths(new Set());
  }, []);

  // Format XML for display - adding proper styling and line breaks
  const formatXmlForDisplay = useCallback((xml: string | null): string => {
    if (!xml) return '';
    
    try {
      // Verbesserte XML-Formatierung mit korrekter Einrückung
      const formatXml = (xml: string): string => {
        // Entferne unnötige Leerzeichen aber behalte die Struktur
        xml = xml.trim().replace(/>\s+</g, '><');
        
        // XML-Parser für korrekte Strukturierung
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');
        
        // Prüfen ob es Parsing-Fehler gab
        const parseError = xmlDoc.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
          // Fallback zur manuellen Formatierung, wenn Parsing fehlschlägt
          return formatXmlManually(xml);
        }
        
        // Rekursive Funktion zum Formatieren der XML-Struktur
        const formatNode = (node: Node, level: number): string => {
          const indent = '  '.repeat(level);
          let result = '';
          
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const tagName = element.tagName;
            
            // Öffnendes Tag mit Attributen
            result += `${indent}<${tagName}`;
            
            // Attribute hinzufügen
            for (let i = 0; i < element.attributes.length; i++) {
              const attr = element.attributes[i];
              result += ` ${attr.name}="${attr.value}"`;
            }
            
            // Prüfen ob Element Kinder hat
            if (element.childNodes.length === 0) {
              // Selbstschließendes Tag
              result += '/>\n';
            } else if (element.childNodes.length === 1 && 
                      element.childNodes[0].nodeType === Node.TEXT_NODE && 
                      element.childNodes[0].textContent && 
                      element.childNodes[0].textContent.trim().length < 50) {
              // Kurzer Text-Inhalt - in einer Zeile darstellen
              result += `>${element.childNodes[0].textContent.trim()}</${tagName}>\n`;
            } else {
              // Komplexer Inhalt - mit Einrückung formatieren
              result += '>\n';
              
              // Alle Kindelemente formatieren
              for (let i = 0; i < element.childNodes.length; i++) {
                const child = element.childNodes[i];
                
                if (child.nodeType === Node.TEXT_NODE) {
                  const text = child.textContent ? child.textContent.trim() : '';
                  if (text) {
                    result += `${indent}  ${text}\n`;
                  }
                } else if (child.nodeType === Node.CDATA_SECTION_NODE) {
                  // CDATA-Abschnitte
                  result += `${indent}  <![CDATA[${child.textContent}]]>\n`;
                } else {
                  // Rekursiver Aufruf für verschachtelte Elemente
                  result += formatNode(child, level + 1);
                }
              }
              
              // Schließendes Tag
              result += `${indent}</${tagName}>\n`;
            }
          } else if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent ? node.textContent.trim() : '';
            if (text) {
              result += `${indent}${text}\n`;
            }
          } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
            result += `${indent}<![CDATA[${node.textContent}]]>\n`;
          } else if (node.nodeType === Node.COMMENT_NODE) {
            result += `${indent}<!-- ${node.textContent} -->\n`;
          } else if (node.nodeType === Node.DOCUMENT_NODE) {
            // Dokument-Knoten - alle Kinder verarbeiten
            const doc = node as Document;
            
            // XML-Deklaration
            result += '<?xml version="1.0" encoding="UTF-8"?>\n';
            
            // Root-Element formatieren
            if (doc.documentElement) {
              result += formatNode(doc.documentElement, 0);
            }
          }
          
          return result;
        };
        
        // Formatieren des gesamten Dokuments
        return formatNode(xmlDoc, 0);
      };
      
      // Fallback-Methode für manuelles Formatieren
      const formatXmlManually = (xml: string): string => {
        let formatted = '';
        let indent = '';
        let inTag = false;
        let inCData = false;
        
        // XML-Deklaration extrahieren
        const xmlHeaderMatch = xml.match(/^\s*<\?xml[^>]*\?>/);
        if (xmlHeaderMatch) {
          formatted += xmlHeaderMatch[0] + '\n';
          xml = xml.substring(xmlHeaderMatch[0].length);
        }
        
        // Zeichen für Zeichen durchgehen
        for (let i = 0; i < xml.length; i++) {
          const char = xml.charAt(i);
          const nextChar = i < xml.length - 1 ? xml.charAt(i + 1) : '';
          
          // CDATA-Marker erkennen
          if (char === '<' && xml.substr(i, 9) === '<![CDATA[') {
            inCData = true;
            formatted += '<![CDATA[';
            i += 8; // Überspringe <![CDATA[
            continue;
          } else if (inCData && xml.substr(i, 3) === ']]>') {
            inCData = false;
            formatted += ']]>';
            i += 2; // Überspringe ]]>
            continue;
          }
          
          // Im CDATA-Bereich alles unverändert übernehmen
          if (inCData) {
            formatted += char;
            continue;
          }
          
          // Tag-Anfang
          if (char === '<' && !inTag) {
            // Prüfe, ob es ein schließendes Tag ist
            if (nextChar === '/') {
              indent = indent.slice(2); // Einrückung verringern
            }
            
            // Zeilenumbruch vor dem Tag, außer es ist das erste
            if (formatted.length > 0) formatted += '\n';
            formatted += indent + '<';
            inTag = true;
          } 
          // Tag-Ende
          else if (char === '>' && inTag) {
            formatted += '>';
            inTag = false;
            
            // Prüfen, ob selbstschließend oder schließendes Tag
            if (xml.charAt(i - 1) !== '/' && xml.charAt(i - 1) !== '-' && nextChar !== '<' && nextChar !== '\r' && nextChar !== '\n') {
              formatted += '\n' + indent + '  ';
            }
            
            // Einrückung erhöhen bei öffnenden, nicht-selbstschließenden Tags
            if (xml.charAt(i - 1) !== '/' && xml.charAt(i - 2) !== '?' && xml.charAt(i - 1) !== '-' && nextChar !== '/') {
              if (nextChar !== '<') {
                indent += '  ';
              }
            }
          } 
          // Text innerhalb der Tags
          else {
            formatted += char;
          }
        }
        
        return formatted;
      };
      
      // Versuche zuerst den DOM-Parser, falls das fehlschlägt, verwende den manuellen Ansatz
      try {
        return formatXml(xml);
      } catch (e) {
        console.error('DOM parsing failed, using manual formatting', e);
        return formatXmlManually(xml);
      }
    } catch (error) {
      console.error('Error formatting XML:', error);
      return xml;
    }
  }, []);
  
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
        className={`overflow-auto break-words ${isWordWrapEnabled ? 'whitespace-normal' : 'whitespace-pre'}`}
      />
    );
    
    return (
      <div className="mt-2">
        {highlightedVast}
      </div>
    );
  }, [addLineNumbersGlobal, formatXmlForDisplay, highlightXml, isDarkMode, isWordWrapEnabled]);

  // Log search state changes
  useEffect(() => {
    console.log("Search state changed:", isJsonSearchOpen);
    setSearchDebugMessage(`Search state: ${isJsonSearchOpen ? 'OPEN' : 'CLOSED'}`);
    // Clear message after 3 seconds
    const timer = setTimeout(() => setSearchDebugMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [isJsonSearchOpen]);

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

  // Perform VAST search function - robustere Implementation
  const performVastSearch = useCallback(() => {
    // Hole den aktuellen Tab-Suchstatus
    const currentTabSearch = vastTabSearches[activeVastTabIndex];
    if (!currentTabSearch) return;
    
    // Entferne zuerst alle vorherigen Hervorhebungen
    document.querySelectorAll('.search-term-highlight, .search-term-current').forEach(el => {
      if (el instanceof HTMLElement) {
        const text = el.textContent || '';
        const textNode = document.createTextNode(text);
        if (el.parentNode) {
          el.parentNode.replaceChild(textNode, el);
        }
      }
    });
    
    // Führe die alte Cleanup-Funktion aus, falls vorhanden
    if (currentTabSearch.cleanup) {
      currentTabSearch.cleanup();
    }
    
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
    
    try {
      // Get the appropriate VAST container for the current tab
      const vastContainer = activeVastTabIndex === 0 
        ? embeddedVastOutputRef.current 
        : getFetchedVastRef(activeVastTabIndex - 1).current;
      
      if (!vastContainer) {
        console.error("VAST container not found for search");
        return;
      }
      
      console.log("Performing VAST search for:", vastSearchTerm);
      
      // Sammle alle Textelemente im VAST-Container
      const allTextElements: Array<{ node: Node, text: string, parent: HTMLElement | null }> = [];
      const walker = document.createTreeWalker(
        vastContainer,
        NodeFilter.SHOW_TEXT,
        { acceptNode: (node) => node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
      );
      
      let currentNode: Node | null;
      // eslint-disable-next-line no-cond-assign
      while (currentNode = walker.nextNode()) {
        // Überspringe Elemente, die bereits Teil einer Suche sind
        if (currentNode.parentElement?.classList.contains('search-term-highlight') ||
            currentNode.parentElement?.classList.contains('search-term-current')) {
          continue;
        }
        
        allTextElements.push({
          node: currentNode,
          text: currentNode.textContent || '',
          parent: currentNode.parentElement
        });
      }
      
      // Suche nach dem Term in allen Textelementen
      const matches: Array<{ element: HTMLElement | null, text: string, startPos: number, node: Node }> = [];
      const searchTermLower = vastSearchTerm.toLowerCase();
      
      for (const element of allTextElements) {
        const textLower = element.text.toLowerCase();
        let startPos = 0;
        let pos;
        
        // Finde alle Vorkommen im Text
        while ((pos = textLower.indexOf(searchTermLower, startPos)) !== -1) {
          if (element.parent) {
            matches.push({
              element: element.parent,
              text: element.text,
              startPos: pos,
              node: element.node
            });
          }
          startPos = pos + searchTermLower.length;
        }
      }
      
      console.log(`Found ${matches.length} VAST search matches for tab ${activeVastTabIndex}`);
      
      // Filtere gültige Matches
      const validMatches = matches.filter(match => match.element !== null) as { 
        element: HTMLElement, 
        text: string, 
        startPos: number, 
        node: Node 
      }[];
      
      // Update the current tab's search state
      const newUpdatedSearches = [...vastTabSearches];
      
      if (validMatches.length > 0) {
        // Highlight-Funktion für VAST-Suche
        const highlightVastMatches = (currentIndex: number) => {
          // Entferne alte Highlights
          document.querySelectorAll('.search-term-highlight, .search-term-current').forEach(el => {
            if (el instanceof HTMLElement) {
              const text = el.textContent || '';
              const textNode = document.createTextNode(text);
              if (el.parentNode) {
                el.parentNode.replaceChild(textNode, el);
              }
            }
          });
          
          // Markiere alle Treffer
          validMatches.forEach((match, index) => {
            if (!match.node || !match.node.textContent) return;
            
            const originalText = match.node.textContent;
            const startPos = match.startPos;
            const endPos = startPos + vastSearchTerm.length;
            
            const before = originalText.substring(0, startPos);
            const term = originalText.substring(startPos, endPos);
            const after = originalText.substring(endPos);
            
            const spanClass = index === currentIndex ? 'search-term-current' : 'search-term-highlight';
            
            const newContent = document.createRange().createContextualFragment(
              `${before}<span class="${spanClass}">${term}</span>${after}`
            );
            
            if (match.node.parentNode) {
              match.node.parentNode.replaceChild(newContent, match.node);
            }
          });
          
          // Scroll zum aktuellen Ergebnis
          if (validMatches[currentIndex]?.element) {
            scrollToElement(validMatches[currentIndex].element);
          }
        };
        
        // Cleanup-Funktion für VAST-Suche
        const cleanup = () => {
          document.querySelectorAll('.search-term-highlight, .search-term-current').forEach(el => {
            if (el instanceof HTMLElement) {
              const text = el.textContent || '';
              const textNode = document.createTextNode(text);
              if (el.parentNode) {
                el.parentNode.replaceChild(textNode, el);
              }
            }
          });
        };
        
        // Aktualisiere den Suchstatus für den aktuellen Tab
        newUpdatedSearches[activeVastTabIndex] = {
          results: validMatches.map(({ element, text, startPos }) => ({
            element,
            text,
            startPos
          })),
          currentIndex: 0,
          cleanup: cleanup,
          status: 'results' as const
        };
        
        // Highlight first match
        highlightVastMatches(0);
      } else {
        newUpdatedSearches[activeVastTabIndex] = {
          results: [],
          currentIndex: -1,
          cleanup: null,
          status: 'no-results' as const
        };
      }
      
      setVastTabSearches(newUpdatedSearches);
    } catch (error) {
      console.error("Error in VAST search:", error);
    }
  }, [vastSearchTerm, activeVastTabIndex, vastTabSearches, embeddedVastOutputRef, getFetchedVastRef, scrollToElement]);

  // Navigation für die VAST-Tabs
  const goToNextVastResult = useCallback(() => {
    const currentTabSearch = vastTabSearches[activeVastTabIndex];
    if (!currentTabSearch || currentTabSearch.results.length === 0) return;
    
    const nextIndex = (currentTabSearch.currentIndex + 1) % currentTabSearch.results.length;
    
    // Aktualisiere den Index im Tab-spezifischen Zustand und führe Highlight durch
    const updatedSearches = [...vastTabSearches];
    updatedSearches[activeVastTabIndex] = {
      ...updatedSearches[activeVastTabIndex],
      currentIndex: nextIndex
    };
    setVastTabSearches(updatedSearches);
    
    // Highlight ohne vollständige Neusuche
    const highlightVastMatches = (idx: number) => {
      // Entferne nur die "current" Hervorhebung, behalte alle anderen
      document.querySelectorAll('.search-term-current').forEach(el => {
        if (el instanceof HTMLElement) {
          el.classList.remove('search-term-current');
          el.classList.add('search-term-highlight');
        }
      });
      
      // Setze die neue "current" Hervorhebung
      const allHighlights = document.querySelectorAll('.search-term-highlight');
      if (idx >= 0 && idx < allHighlights.length) {
        const currentElement = allHighlights[idx];
        if (currentElement instanceof HTMLElement) {
          currentElement.classList.remove('search-term-highlight');
          currentElement.classList.add('search-term-current');
          
          // Scroll zum Ergebnis
          scrollToElement(currentElement);
        }
      }
    };
    
    highlightVastMatches(nextIndex);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  }, [vastTabSearches, activeVastTabIndex, scrollToElement]);

  const goToPrevVastResult = useCallback(() => {
    const currentTabSearch = vastTabSearches[activeVastTabIndex];
    if (!currentTabSearch || currentTabSearch.results.length === 0) return;
    
    const prevIndex = (currentTabSearch.currentIndex - 1 + currentTabSearch.results.length) % currentTabSearch.results.length;
    
    // Aktualisiere den Index im Tab-spezifischen Zustand und führe Highlight durch
    const updatedSearches = [...vastTabSearches];
    updatedSearches[activeVastTabIndex] = {
      ...updatedSearches[activeVastTabIndex],
      currentIndex: prevIndex
    };
    setVastTabSearches(updatedSearches);
    
    // Highlight ohne vollständige Neusuche
    const highlightVastMatches = (idx: number) => {
      // Entferne nur die "current" Hervorhebung, behalte alle anderen
      document.querySelectorAll('.search-term-current').forEach(el => {
        if (el instanceof HTMLElement) {
          el.classList.remove('search-term-current');
          el.classList.add('search-term-highlight');
        }
      });
      
      // Setze die neue "current" Hervorhebung
      const allHighlights = document.querySelectorAll('.search-term-highlight');
      if (idx >= 0 && idx < allHighlights.length) {
        const currentElement = allHighlights[idx];
        if (currentElement instanceof HTMLElement) {
          currentElement.classList.remove('search-term-highlight');
          currentElement.classList.add('search-term-current');
          
          // Scroll zum Ergebnis
          scrollToElement(currentElement);
        }
      }
    };
    
    highlightVastMatches(prevIndex);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  }, [vastTabSearches, activeVastTabIndex, scrollToElement]);

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const vastContainer = newTabIndex === 0 
          ? embeddedVastOutputRef.current 
          : getFetchedVastRef(newTabIndex - 1).current;
        
        /* TODO: Diese Stelle nutzte performSearch, die aus dem Code entfernt wurde
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
        */
      }
    }, 100);
  }, [activeVastTabIndex, embeddedVastOutputRef, getFetchedVastRef, vastTabSearches]);

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

  // Füge diese Handler-Definitionen nach performJsonSearch und performVastSearch ein
  const handleJsonSearchButtonClick = useCallback(() => {
    setIsJsonSearchOpen(prev => !prev);
  }, []);

  const handleVastSearchButtonClick = useCallback(() => {
    setIsVastSearchOpen(prev => !prev);
  }, []);

  const handleToggleWordWrapClick = useCallback(() => {
    setIsWordWrapEnabled(prev => !prev);
  }, []);

  const handleCopyJsonButtonClick = useCallback(() => {
    if (parsedJson) {
      copyToClipboard(JSON.stringify(parsedJson, null, 2), 'JSON');
    }
  }, [parsedJson, copyToClipboard]);

  const handleCopyVastButtonClick = useCallback(() => {
    if (activeVastTabIndex === 0 && rawVastContent) {
      copyToClipboard(rawVastContent, 'VAST');
    } else if (activeVastTabIndex > 0 && vastChain[activeVastTabIndex - 1]?.content) {
      const content = vastChain[activeVastTabIndex - 1].content;
      if (content) {
        copyToClipboard(content, 'VAST');
      }
    }
  }, [activeVastTabIndex, rawVastContent, vastChain, copyToClipboard]);

  return (
    <div className="w-full h-full flex flex-col px-0 sm:px-1 md:px-3 lg:px-4">
      {/* History Panel */}
      {showHistory && (
        <JsonHistoryPanel
          isDarkMode={isDarkMode}
          history={history}
          onClick={restoreFromHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Copy Confirmation Message - Jetzt rechts unten mit Icon */}
      {copyMessageVisible && (
        <div className={`fixed bottom-4 right-4 flex items-center p-3 rounded-md shadow-lg transition-opacity duration-300 z-50 ${
          isDarkMode ? 'bg-gray-700 text-white' : 'bg-green-100 text-green-800'
        } ${copyMessageVisible ? 'opacity-100' : 'opacity-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {copyMessage}
        </div>
      )}

      <Card isDarkMode={isDarkMode} className="mt-8 mb-8" withPadding>
        <div className="mb-2">
          <h3 className={`text-base md:text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>JSON Input</h3>
          <textarea
            ref={textAreaRef}
            value={jsonInput}
            onChange={handleJsonInputChange}
            placeholder="Paste your JSON here..."
            className={`w-full h-32 p-3 border rounded-lg font-mono text-xs mb-2 outline-none transition ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              onClick={handleFormat}
              variant="primary"
              isDarkMode={isDarkMode}
              title="Format JSON (Ctrl+Shift+F)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Format
            </Button>
            <Button
              onClick={handleClear}
              variant="secondary"
              isDarkMode={isDarkMode}
              title="Clear Input (Ctrl+Shift+L)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Fehlermeldungen vereinheitlichen */}
      {error && (
        <div className={`mb-4 p-3 border border-red-400 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200`}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {(parsedJson || rawVastContent) && (
        <div className="my-6 flex flex-col min-h-0">
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 lg:space-x-3 flex-1 min-h-0">
            {/* JSON Content - Left column */}
            {parsedJson && (
              <div className={`${rawVastContent ? 'w-full md:w-1/2' : 'w-full'} min-w-0 flex flex-col`}>
                <div className="my-6 p-5 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Formatted JSON</h3>
                    {/* Control buttons für JSON */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleJsonSearchButtonClick}
                        variant="secondary"
                        isDarkMode={isDarkMode}
                        size="sm"
                        title="Search (Ctrl+F)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </Button>
                      <Button
                        onClick={handleToggleWordWrapClick}
                        variant="secondary"
                        isDarkMode={isDarkMode}
                        size="sm"
                        title={isWordWrapEnabled ? "Disable word wrap" : "Enable word wrap"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </Button>
                      <Button
                        onClick={handleCopyJsonButtonClick}
                        variant="secondary"
                        isDarkMode={isDarkMode}
                        size="sm"
                        title="Copy JSON to clipboard"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Inline JSON Search */}
                  <EnhancedJsonSearch 
                    isDarkMode={isDarkMode}
                    containerRef={jsonRef}
                    isVisible={isJsonSearchOpen}
                    onClose={() => setIsJsonSearchOpen(false)}
                  />
                  
                  {/* JSON Outline/Content */}
                  <div className="flex mb-2 mt-2">
                    <Button
                      onClick={() => setShowStructure(!showStructure)}
                      variant="secondary"
                      isDarkMode={isDarkMode}
                      size="sm"
                      title={showStructure ? "Show JSON" : "Show Structure"}
                    >
                      {showStructure ? "Show JSON" : "Show Structure"}
                    </Button>
                    {jsonSearchStatus !== 'idle' && (
                      <div className={`ml-4 text-sm ${jsonSearchStatus === 'results' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {jsonSearchStatus === 'results' ? `${jsonSearchResults.length} matches found` : 'No matches'}
                      </div>
                    )}
                  </div>
                  {!showStructure ? (
                    <div 
                      ref={jsonRef}
                      key={`json-output-${parsedJson ? 'loaded' : 'empty'}`}
                      className={`w-full overflow-auto ${isWordWrapEnabled ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}
                      style={{ maxWidth: "100%" }}
                    >
                      <div 
                        dangerouslySetInnerHTML={{ __html: addLineNumbersGlobal(highlightJson(parsedJson, isDarkMode), 'json') }}
                      />
                    </div>
                  ) : (
                    <div className="text-xs font-mono">
                      {generateJsonOutline(parsedJson)}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* VAST Content - Right column or full width if no JSON */}
            {rawVastContent && (
              <div className={`${parsedJson ? 'w-full md:w-1/2' : 'w-full'} min-w-0 flex flex-col`}>
                <div className="my-6 p-5 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-md overflow-hidden">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>VAST Tags</h3>
                    {/* Control buttons für VAST */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleVastSearchButtonClick}
                        variant="secondary"
                        isDarkMode={isDarkMode}
                        size="sm"
                        title="Search (Ctrl+F)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </Button>
                      <Button
                        onClick={handleToggleWordWrapClick}
                        variant="secondary"
                        isDarkMode={isDarkMode}
                        size="sm"
                        title={isWordWrapEnabled ? "Disable word wrap" : "Enable word wrap"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                      </Button>
                      <Button
                        onClick={handleCopyVastButtonClick}
                        variant="secondary"
                        isDarkMode={isDarkMode}
                        size="sm"
                        title="Copy VAST to clipboard"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  {/* Inline VAST Search */}
                  <EnhancedJsonSearch 
                    isDarkMode={isDarkMode}
                    containerRef={vastRef}
                    isVisible={isVastSearchOpen}
                    onClose={() => setIsVastSearchOpen(false)}
                  />

                  {/* VAST Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button
                      onClick={() => handleVastTabChange(0)}
                      className={`py-2 px-4 text-sm font-medium ${
                        activeVastTabIndex === 0
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Embedded VAST
                    </button>
                    
                    {vastChain.map((item, index) => (
                      <button
                        key={`vast-tab-${index}`}
                        onClick={() => handleVastTabChange(index + 1)}
                        className={`py-2 px-4 text-sm font-medium ${
                          activeVastTabIndex === index + 1
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        {item.isLoading ? (
                          <span>Wrapper {index + 1} (loading...)</span>
                        ) : item.error ? (
                          <span>Wrapper {index + 1} (error)</span>
                        ) : (
                          <span>Wrapper {index + 1}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* VAST Content Display */}
                  <div ref={vastRef} className="vast-content-container overflow-auto">
                    {activeVastTabIndex === 0 ? (
                      <div ref={embeddedVastOutputRef} className={`break-words ${isWordWrapEnabled ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}>
                        {renderVastContent(rawVastContent)}
                      </div>
                    ) : (
                      <div ref={getFetchedVastRef(activeVastTabIndex - 1)} className={`break-words ${isWordWrapEnabled ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}>
                        {vastChain[activeVastTabIndex - 1]?.isLoading ? (
                          <div className="flex justify-center items-center p-10">
                            <span className="animate-pulse text-blue-500 dark:text-blue-400">Loading VAST data...</span>
                          </div>
                        ) : vastChain[activeVastTabIndex - 1]?.error ? (
                          <div className="text-red-500 dark:text-red-400 p-4">
                            <p className="font-bold">Error loading VAST:</p>
                            <p>{vastChain[activeVastTabIndex - 1].error}</p>
                          </div>
                        ) : (
                          renderVastContent(vastChain[activeVastTabIndex - 1]?.content)
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default JsonVastExplorer;