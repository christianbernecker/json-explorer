/**
 * Hilfsfunktionen für die Suchfunktionalität im JsonVastExplorer
 * Diese Datei behebt Probleme mit der Suche, die durch zirkuläre Abhängigkeiten entstanden sind
 */

interface SearchMatch {
  element: HTMLElement;
  text: string;
  startPos: number;
}

interface SearchOptions {
  caseSensitive?: boolean;
}

/**
 * Verbesserte Suchfunktion für den JSON und VAST Explorer
 * 
 * @param searchTerm Der zu suchende Begriff
 * @param containerRef Die Referenz zum Container (JSON oder VAST)
 * @param directSearchCleanup Callback zum Aufräumen der vorherigen Suche
 * @param options Zusätzliche Suchoptionen wie Groß-/Kleinschreibung
 * @returns Ein Objekt mit den Suchergebnissen und Hilfsfunktionen
 */
export const performSearch = (
  searchTerm: string,
  containerRef: HTMLElement | null,
  directSearchCleanup: (() => void) | null,
  options?: SearchOptions
): {
  matches: SearchMatch[];
  cleanup: (() => void) | null;
  highlightMatch: (index: number, matches: SearchMatch[]) => void;
} => {
  // Leeres Ergebnis bei fehlendem Suchbegriff oder Container
  if (!searchTerm.trim() || !containerRef) {
    return { matches: [], cleanup: null, highlightMatch: () => {} };
  }

  console.log("Performing search for:", searchTerm);
  
  // Cleanup vorherige Suche
  if (directSearchCleanup) {
    directSearchCleanup();
  }
  
  try {
    // Store original text content to restore later
    const originalContents = new Map<HTMLElement, string>();
    
    // Find text nodes within the container
    const walker = document.createTreeWalker(
      containerRef,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    const matches: SearchMatch[] = [];
    const caseSensitive = options?.caseSensitive || false;
    
    let node: Text | null;
    while ((node = walker.nextNode() as Text)) {
      if (node.parentElement && node.textContent) {
        const parent = node.parentElement;
        const text = node.textContent;
        
        // Berücksichtige die Groß-/Kleinschreibung je nach Option
        const searchTermForComparison = caseSensitive ? searchTerm : searchTerm.toLowerCase();
        const textForComparison = caseSensitive ? text : text.toLowerCase();
        
        let position = textForComparison.indexOf(searchTermForComparison);
        while (position !== -1) {
          // Store only the first time we find a match in this element
          if (!originalContents.has(parent)) {
            originalContents.set(parent, parent.innerHTML);
          }
          
          matches.push({
            element: parent,
            text: text,
            startPos: position
          });
          
          position = textForComparison.indexOf(searchTermForComparison, position + 1);
        }
      }
    }
    
    console.log(`Search found ${matches.length} results`);
    
    // Funktion zum Hervorheben eines bestimmten Treffers
    const highlightMatch = (index: number, matchResults: SearchMatch[]) => {
      if (matchResults.length === 0 || index < 0 || index >= matchResults.length) return;
      
      // Clean previous highlights
      document.querySelectorAll('.search-term-current').forEach(el => {
        el.classList.remove('search-term-current');
        el.classList.add('search-term-highlight');
      });
      
      const match = matchResults[index];
      const element = match.element;
      const text = match.text;
      const position = match.startPos;
      
      // Original Suchbegriff extrahieren, um die Groß-/Kleinschreibung zu erhalten
      const actualTerm = text.substring(position, position + searchTerm.length);
      
      // Create a highlighted version of the element content
      const before = text.substring(0, position);
      const after = text.substring(position + searchTerm.length);
      
      // Replace text node with highlight
      const newContent = document.createRange().createContextualFragment(
        `${before}<span class="search-term-current">${actualTerm}</span>${after}`
      );
      
      // Update element with highlighted content
      try {
        // Find the text node and replace it
        const textNodes = Array.from(element.childNodes).filter(node => 
          node.nodeType === Node.TEXT_NODE && node.textContent?.includes(text)
        );
        
        if (textNodes.length > 0) {
          element.replaceChild(newContent, textNodes[0]);
        } else {
          // If exact text node not found, try to replace similar content
          element.innerHTML = element.innerHTML.replace(
            actualTerm, 
            `<span class="search-term-current">${actualTerm}</span>`
          );
        }
      } catch (err) {
        console.error("Error highlighting text:", err);
      }
      
      // Scroll to element
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    };
    
    // Store the original contents for restoration
    const storeOriginalContent = () => {
      const styleElement = document.createElement('style');
      styleElement.id = 'search-highlight-styles';
      styleElement.innerHTML = `
        .search-term-highlight {
          background-color: rgba(255, 215, 0, 0.5);
          padding: 0 2px;
          border-radius: 2px;
          font-weight: bold;
        }
        .search-term-current {
          background-color: rgba(255, 69, 0, 0.8);
          color: white;
          padding: 0 2px;
          border-radius: 2px;
          font-weight: bold;
          outline: 1px solid black;
        }
      `;
      document.head.appendChild(styleElement);
      
      // Save the function to remove elements on cleanup
      return () => {
        // Remove highlight styles
        const styleEl = document.getElementById('search-highlight-styles');
        if (styleEl) document.head.removeChild(styleEl);
        
        // Restore original content
        originalContents.forEach((innerHTML, element) => {
          if (element.parentElement) {
            element.innerHTML = innerHTML;
          }
        });
      };
    };
    
    // Erstelle Cleanup-Funktion
    const cleanup = storeOriginalContent();
    
    return {
      matches,
      cleanup,
      highlightMatch
    };
  } catch (err) {
    console.error("Error in search:", err);
    return { matches: [], cleanup: null, highlightMatch: () => {} };
  }
}; 