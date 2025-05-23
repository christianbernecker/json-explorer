/**
 * Verbesserte, robustere Suchfunktionalität für den JSON-Explorer
 * Diese Implementierung umgeht DOM-Manipulationen soweit möglich und nutzt
 * einen zuverlässigeren Ansatz für das Highlighting von Ergebnissen
 */

export interface SearchResult {
  element: HTMLElement;
  text: string;
  startPos: number;
  originalContent?: string;
  lineNumber?: number;
  jsonPath?: string;
  context?: string; // Text around the match for context
}

export interface SearchOptions {
  caseSensitive?: boolean;
  matchWholeWord?: boolean;
  highlightAll?: boolean; // Option to highlight all results at once
  extractJsonPath?: boolean; // Try to extract JSON path for results
}

/**
 * Extracts a JSON path for an element if possible
 * Traverses up the DOM to find data attributes or structure that indicates JSON path
 */
function tryExtractJsonPath(element: HTMLElement): string | undefined {
  // Try to find data attributes that might contain path info
  let current: HTMLElement | null = element;
  let pathParts: string[] = [];
  
  while (current) {
    // Check for data attributes that might contain path information
    const dataKey = current.getAttribute('data-key');
    const dataPath = current.getAttribute('data-path');
    const dataIndex = current.getAttribute('data-index');
    
    if (dataPath) {
      return dataPath;
    }
    
    if (dataKey) {
      pathParts.unshift(dataKey);
    }
    
    if (dataIndex) {
      pathParts.unshift(`[${dataIndex}]`);
    }
    
    // Check for parent with specific classes that might indicate structure
    current = current.parentElement;
  }
  
  return pathParts.length > 0 ? pathParts.join('.') : undefined;
}

/**
 * Attempt to determine line number from DOM structure
 */
function tryGetLineNumber(element: HTMLElement): number | undefined {
  // Try to find line number from table rows or data attributes
  let current = element;
  
  // Look for specific line number attributes
  const lineAttr = current.getAttribute('data-line-number');
  if (lineAttr) {
    const lineNum = parseInt(lineAttr, 10);
    if (!isNaN(lineNum)) return lineNum;
  }
  
  // Look for table structure (common in code displays)
  while (current && current.tagName !== 'TR') {
    current = current.parentElement as HTMLElement;
    if (!current) break;
  }
  
  if (current && current.tagName === 'TR') {
    // Try to get line number from first cell
    const firstCell = current.querySelector('td:first-child');
    if (firstCell && firstCell.textContent) {
      const lineNum = parseInt(firstCell.textContent.trim(), 10);
      if (!isNaN(lineNum)) return lineNum;
    }
  }
  
  return undefined;
}

/**
 * Extract context around the match for better preview
 */
function extractContext(text: string, startPos: number, matchLength: number, contextSize: number = 20): string {
  const contextStart = Math.max(0, startPos - contextSize);
  const contextEnd = Math.min(text.length, startPos + matchLength + contextSize);
  
  let context = text.substring(contextStart, contextEnd);
  
  // Add ellipsis if truncated
  if (contextStart > 0) context = '...' + context;
  if (contextEnd < text.length) context = context + '...';
  
  return context;
}

/**
 * Neue verbesserte Suchfunktion
 * 
 * @param searchTerm Der Suchbegriff
 * @param container Der DOM-Container, in dem gesucht werden soll
 * @param options Optionen für die Suche
 * @returns Suchergebnisse und Hilfsfunktionen
 */
export function runSearch(
  searchTerm: string,
  container: HTMLElement | null,
  options: SearchOptions = {}
) {
  // Tracking für Highlight-Elemente
  const highlightedElements: HTMLElement[] = [];
  const originalStyles = new Map<HTMLElement, string>();
  const allHighlightedElements: HTMLElement[] = [];
  const allOriginalStyles = new Map<HTMLElement, string>();

  // Ergebnis bei leerem Suchbegriff oder fehlendem Container
  if (!searchTerm?.trim() || !container) {
    return {
      results: [] as SearchResult[],
      totalResults: 0,
      highlightResult: (index: number) => {},
      highlightAllResults: () => {},
      clearHighlights: () => {}
    };
  }
  
  console.log(`Searching for "${searchTerm}"`);
  
  // Finde alle Text-Nodes im Container
  const results: SearchResult[] = [];
  
  // Funktion zum Extrahieren aller Text-Nodes
  function collectTextNodes(node: Node, textNodes: Text[] = []): Text[] {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      textNodes.push(node as Text);
    } else {
      // Rekursiv durch alle Kinder
      for (let i = 0; i < node.childNodes.length; i++) {
        collectTextNodes(node.childNodes[i], textNodes);
      }
    }
    return textNodes;
  }
  
  // Sammle alle Text-Nodes
  const textNodes = collectTextNodes(container);
  
  // Konfiguriere Suchoptionen
  const { 
    caseSensitive = false, 
    matchWholeWord = false,
    extractJsonPath = true
  } = options;
  
  // Suche in allen Text-Nodes
  for (const node of textNodes) {
    const text = node.textContent || '';
    let compareText = caseSensitive ? text : text.toLowerCase();
    const compareSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    const matchLength = searchTerm.length;
    
    // Bei "ganzes Wort" die Suche entsprechend konfigurieren
    if (matchWholeWord) {
      const regex = new RegExp(`\\b${compareSearchTerm}\\b`, caseSensitive ? 'g' : 'gi');
      let match;
      while ((match = regex.exec(compareText)) !== null) {
        if (node.parentElement) {
          const element = node.parentElement;
          const lineNumber = tryGetLineNumber(element);
          const jsonPath = extractJsonPath ? tryExtractJsonPath(element) : undefined;
          const context = extractContext(text, match.index, matchLength);
          
          results.push({
            element,
            text,
            startPos: match.index,
            lineNumber,
            jsonPath,
            context
          });
        }
      }
    } else {
      // Normale Suche
      let startPos = 0;
      while (true) {
        const pos = compareText.indexOf(compareSearchTerm, startPos);
        if (pos === -1) break;
        
        if (node.parentElement) {
          const element = node.parentElement;
          const lineNumber = tryGetLineNumber(element);
          const jsonPath = extractJsonPath ? tryExtractJsonPath(element) : undefined;
          const context = extractContext(text, pos, matchLength);
          
          results.push({
            element,
            text,
            startPos: pos,
            lineNumber,
            jsonPath,
            context
          });
        }
        
        startPos = pos + compareSearchTerm.length;
      }
    }
  }
  
  console.log(`Found: ${results.length} results`);

  // Apply a soft highlight to an element
  function softHighlight(element: HTMLElement) {
    allOriginalStyles.set(element, element.getAttribute('style') || '');
    
    // Setze einen subtilen Hintergrund für alle Ergebnisse
    element.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    element.style.borderRadius = '2px';
    
    // Füge zur Liste aller hervorgehobenen Elemente hinzu
    allHighlightedElements.push(element);
  }
  
  // Funktion zum Hervorheben aller Ergebnisse
  function highlightAllResults() {
    // Zuerst aktuelles Highlight entfernen
    clearHighlights();
    
    // Dann alle Ergebnisse sanft hervorheben
    results.forEach(result => {
      softHighlight(result.element);
    });
  }

  // Funktion zum Hervorheben eines bestimmten Ergebnisses
  function highlightResult(index: number) {
    // Zuerst aktuelle starke Hervorhebung entfernen
    clearHighlights();
    
    if (index < 0 || index >= results.length) return;
    
    const result = results[index];
    const element = result.element;
    
    // Scrolle zum Element mit verbesserter Animation
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    // Hervorheben durch Styles, nicht durch DOM-Manipulation
    // Speichere den originalen Style
    originalStyles.set(element, element.getAttribute('style') || '');
    
    // Setze neuen Style für Hervorhebung
    element.style.backgroundColor = 'rgba(255, 100, 0, 0.3)';
    element.style.outline = '2px solid rgba(255, 100, 0, 0.7)';
    element.style.borderRadius = '2px';
    element.style.transition = 'background-color 0.3s ease-in-out, outline 0.3s ease-in-out, transform 0.2s ease-in-out';
    element.style.transform = 'scale(1.01)'; // Subtle zoom effect
    
    // Füge zur Liste der hervorgehobenen Elemente hinzu
    highlightedElements.push(element);
    
    // Blinken für bessere Sichtbarkeit
    setTimeout(() => {
      element.style.backgroundColor = 'rgba(255, 100, 0, 0.5)';
      element.style.outline = '2px solid rgba(255, 100, 0, 0.9)';
    }, 100);
    
    setTimeout(() => {
      element.style.backgroundColor = 'rgba(255, 100, 0, 0.3)';
      element.style.outline = '2px solid rgba(255, 100, 0, 0.7)';
      element.style.transform = 'scale(1)'; // Reset zoom effect
    }, 500);
  }
  
  // Funktion zum Entfernen aller Hervorhebungen
  function clearHighlights() {
    // Clear current highlight
    highlightedElements.forEach(element => {
      const originalStyle = originalStyles.get(element) || '';
      element.setAttribute('style', originalStyle);
    });
    
    // Clear all soft highlights
    allHighlightedElements.forEach(element => {
      const originalStyle = allOriginalStyles.get(element) || '';
      element.setAttribute('style', originalStyle);
    });
    
    // Liste leeren
    highlightedElements.length = 0;
    originalStyles.clear();
    allHighlightedElements.length = 0;
    allOriginalStyles.clear();
  }
  
  // Ergebnis zurückgeben
  return {
    results,
    totalResults: results.length,
    highlightResult,
    highlightAllResults,
    clearHighlights
  };
}

/**
 * Durchsucht einen Container direkt und gibt eine einfache Suchschnittstelle zurück
 * 
 * @param searchTerm Suchbegriff
 * @param container Container-Element
 * @param options Suchoptionen
 * @returns Einfaches Suchinterface
 */
export function createSearcher(container: HTMLElement | null) {
  let currentResults: SearchResult[] = [];
  let currentIndex = -1;
  let searchTerm = '';
  let options: SearchOptions = { 
    caseSensitive: false, 
    matchWholeWord: false,
    highlightAll: false,
    extractJsonPath: true
  };
  
  // Initiale Suche durchführen
  let searchHandler = runSearch('', container, options);
  
  // Neue Suche durchführen
  function search(term: string, searchOptions?: SearchOptions) {
    searchTerm = term;
    options = { ...options, ...searchOptions };
    
    // Bereinige vorherige Suche
    searchHandler.clearHighlights();
    
    // Führe neue Suche durch
    searchHandler = runSearch(searchTerm, container, options);
    currentResults = searchHandler.results;
    currentIndex = currentResults.length > 0 ? 0 : -1;
    
    // Wenn "highlight all" aktiviert ist, markiere alle Ergebnisse
    if (options.highlightAll && currentResults.length > 0) {
      searchHandler.highlightAllResults();
    }
    
    // Markiere erstes Ergebnis, falls vorhanden
    if (currentIndex >= 0) {
      searchHandler.highlightResult(currentIndex);
    }
    
    return {
      totalResults: currentResults.length,
      currentIndex,
      results: currentResults
    };
  }
  
  // Zum nächsten Ergebnis
  function next() {
    if (currentResults.length === 0) return false;
    
    currentIndex = (currentIndex + 1) % currentResults.length;
    searchHandler.highlightResult(currentIndex);
    
    return true;
  }
  
  // Zum vorherigen Ergebnis
  function previous() {
    if (currentResults.length === 0) return false;
    
    currentIndex = (currentIndex - 1 + currentResults.length) % currentResults.length;
    searchHandler.highlightResult(currentIndex);
    
    return true;
  }
  
  // Alle Ergebnisse hervorheben
  function highlightAll() {
    if (currentResults.length === 0) return false;
    
    searchHandler.highlightAllResults();
    searchHandler.highlightResult(currentIndex);
    
    return true;
  }
  
  // Suche beenden und Hervorhebungen entfernen
  function cleanup() {
    searchHandler.clearHighlights();
    currentResults = [];
    currentIndex = -1;
  }
  
  return {
    search,
    next,
    previous,
    highlightAll,
    cleanup,
    get currentIndex() { return currentIndex; },
    get totalResults() { return currentResults.length; },
    get results() { return currentResults; }
  };
} 