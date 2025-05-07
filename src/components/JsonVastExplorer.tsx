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
      setShowVastSearch(false); // Also hide VAST search on error
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

  return (
    <div className="w-full h-full flex flex-col px-2 sm:px-3 md:px-4 lg:px-6">
      {/* History Panel */}
      {showHistory && (
        <JsonHistoryPanel
          isDarkMode={isDarkMode}
          history={history}
          onRestore={restoreFromHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      <div className="mb-3 md:mb-4">
        <div className="flex flex-row space-x-4">
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>JSON Input</h3>
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
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 lg:space-x-4 flex-1 min-h-0">
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
                      onClick={() => setShowJsonSearch(!showJsonSearch)} 
                      className={`flex items-center px-2 py-1 rounded-md text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                      title="Find in JSON"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Find
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
                    ref={jsonOutputRef}
                    className={`flex-1 p-2 sm:p-3 md:p-4 rounded-lg border shadow-inner overflow-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                    style={{ height: 'calc(100vh - 350px)' }}
                  >
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
                              onClick={() => setActiveVastTabIndex(0)}
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
                                onClick={() => setActiveVastTabIndex(index + 1)}
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
                
                {/* Toggle zwischen VAST und Structure */}
                {showVastStructure ? (
                  <div className={`p-4 rounded-lg border h-full overflow-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-xs font-mono">
                      {generateVastOutline(activeVastTabIndex === 0 
                        ? rawVastContent 
                        : vastChain[activeVastTabIndex - 1]?.content || null)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner" style={{ height: 'calc(100vh - 320px)', overflow: 'auto' }}>
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
                    
                    {/* Search Panel */}
                    {showVastSearch && activeVastTabIndex === 0 && embeddedVastOutputRef.current && (
                      <SearchPanel
                        contentType="VAST"
                        targetRef={embeddedVastOutputRef}
                        isDarkMode={isDarkMode}
                      />
                    )}
                    {showVastSearch && activeVastTabIndex > 0 && getFetchedVastRef(activeVastTabIndex - 1) && (
                      <SearchPanel
                        contentType="VAST"
                        targetRef={getFetchedVastRef(activeVastTabIndex - 1)}
                        isDarkMode={isDarkMode}
                      />
                    )}
                    
                    <div className="text-sm p-4 overflow-x-auto" ref={activeVastTabIndex === 0 
                        ? embeddedVastOutputRef 
                        : (getFetchedVastRef(activeVastTabIndex - 1) || null)}>
                      {activeVastTabIndex === 0 ? (
                        renderVastContent(rawVastContent)
                      ) : vastChain[activeVastTabIndex - 1]?.isLoading ? (
                        <div className="flex justify-center items-center py-12">
                          <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : vastChain[activeVastTabIndex - 1]?.error ? (
                        <div className="text-red-500 p-4 rounded-lg bg-red-50 dark:bg-red-900 dark:bg-opacity-20">
                          <p className="font-medium">Error fetching VAST:</p>
                          <p>{vastChain[activeVastTabIndex - 1]?.error}</p>
                        </div>
                      ) : vastChain[activeVastTabIndex - 1]?.content ? (
                        renderVastContent(vastChain[activeVastTabIndex - 1]?.content)
                      ) : (
                        <div className="text-center py-4">Kein Wrapper gefunden</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
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