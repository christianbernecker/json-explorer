import React, { useState, useRef, useCallback, useEffect } from 'react';
import { JsonVastExplorerProps, HistoryItem as HistoryItemType } from '../types';
import JsonHistoryPanel from './shared/JsonHistoryPanel';
import JsonSearch from './search/JsonSearch';
import { performSearch } from './search/SearchFix';
import Button from './shared/Button';
import Card from './shared/Card';

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
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [rawVastContent, setRawVastContent] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // copyMessage wird für Benachrichtigungen nach dem Kopieren verwendet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copyMessage, setCopyMessage] = useState('');
  
  // Suche und Tab-Verwaltung
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Für Debugging-Nachrichten
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchDebugMessage, setSearchDebugMessage] = useState<string | null>(null);
  
  // Suchvariablen für VAST - jetzt als Array für jeden Tab
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
  const [vastSearchTerm, setVastSearchTerm] = useState('');
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
  
  // Ref for Embedded VAST output
  const embeddedVastOutputRef = useRef<HTMLDivElement>(null);
  const fetchedVastOutputRefs = useRef<Map<number, React.RefObject<HTMLDivElement>>>(new Map());
  const getFetchedVastRef = useCallback((index: number): React.RefObject<HTMLDivElement> => {
    if (!fetchedVastOutputRefs.current.has(index)) {
      // Create refs on demand
      fetchedVastOutputRefs.current.set(index, React.createRef<HTMLDivElement>());
    }
    return fetchedVastOutputRefs.current.get(index)!;
  }, []);
  
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
  }, [jsonInput, findVastContent, extractVastUrl, extractAdTagUri, fetchVastChainRecursive, addToHistoryItem, initializeExpandedVastNodes]);
  
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
  }, []);

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
                <div className="my-6 p-5 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Formatted JSON</h3>
                  </div>
                </div>
              </div>
            )}
            {/* VAST Content - Right column or full width if no JSON */}
            {rawVastContent && (
              <div className={`${parsedJson ? 'w-full md:w-1/2' : 'w-full'} min-w-0 flex flex-col`}>
                <div className="my-6 p-5 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>VAST Tags</h3>
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