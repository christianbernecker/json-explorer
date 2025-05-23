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
}

export interface SearchOptions {
  caseSensitive?: boolean;
  matchWholeWord?: boolean;
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

  // Ergebnis bei leerem Suchbegriff oder fehlendem Container
  if (!searchTerm?.trim() || !container) {
    return {
      results: [] as SearchResult[],
      totalResults: 0,
      highlightResult: (index: number) => {},
      clearHighlights: () => {}
    };
  }
  
  console.log(`Durchsuche nach "${searchTerm}"`);
  
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
  const { caseSensitive = false, matchWholeWord = false } = options;
  
  // Suche in allen Text-Nodes
  for (const node of textNodes) {
    const text = node.textContent || '';
    let compareText = caseSensitive ? text : text.toLowerCase();
    const compareSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    
    // Bei "ganzes Wort" die Suche entsprechend konfigurieren
    if (matchWholeWord) {
      const regex = new RegExp(`\\b${compareSearchTerm}\\b`, caseSensitive ? 'g' : 'gi');
      let match;
      while ((match = regex.exec(compareText)) !== null) {
        if (node.parentElement) {
          results.push({
            element: node.parentElement,
            text: text,
            startPos: match.index
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
          results.push({
            element: node.parentElement,
            text: text,
            startPos: pos
          });
        }
        
        startPos = pos + compareSearchTerm.length;
      }
    }
  }
  
  console.log(`Gefunden: ${results.length} Ergebnisse`);

  // Funktion zum Hervorheben eines bestimmten Ergebnisses
  function highlightResult(index: number) {
    // Zuerst alle Hervorhebungen entfernen
    clearHighlights();
    
    if (index < 0 || index >= results.length) return;
    
    const result = results[index];
    const element = result.element;
    
    // Scrolle zum Element
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
    element.style.transition = 'background-color 0.2s ease-in-out, outline 0.2s ease-in-out';
    
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
    }, 300);
  }
  
  // Funktion zum Entfernen aller Hervorhebungen
  function clearHighlights() {
    highlightedElements.forEach(element => {
      const originalStyle = originalStyles.get(element) || '';
      element.setAttribute('style', originalStyle);
    });
    
    // Liste leeren
    highlightedElements.length = 0;
    originalStyles.clear();
  }
  
  // Ergebnis zurückgeben
  return {
    results,
    totalResults: results.length,
    highlightResult,
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
  let options: SearchOptions = { caseSensitive: false, matchWholeWord: false };
  
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
    
    // Markiere erstes Ergebnis, falls vorhanden
    if (currentIndex >= 0) {
      searchHandler.highlightResult(currentIndex);
    }
    
    return {
      totalResults: currentResults.length,
      currentIndex
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
    cleanup,
    get currentIndex() { return currentIndex; },
    get totalResults() { return currentResults.length; }
  };
} 