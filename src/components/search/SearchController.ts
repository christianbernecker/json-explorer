/**
 * Suchtrefferobjekt mit Kontextinformationen
 */
export interface SearchMatch {
  id: string;          // Eindeutige ID für jeden Treffer
  text: string;        // Der gefundene Text
  context: string;     // Text um den Treffer herum
  lineNumber?: number; // Zeilennummer, falls verfügbar
  elementType: 'key' | 'value' | 'text'; // Art des Elements
  node?: HTMLElement;  // DOM-Referenz zum Element (falls verfügbar)
  path?: string;       // JSON/XML-Pfad zum Element
}

/**
 * Suchoptionen für die Suchengine
 */
export interface SearchOptions {
  caseSensitive: boolean;   // Groß-/Kleinschreibung beachten
  wholeWord: boolean;       // Nur ganze Wörter suchen
  regexSearch: boolean;     // Regulären Ausdruck verwenden
  searchInKeys: boolean;    // In JSON-Schlüsseln suchen
  highlightAll: boolean;    // Alle Treffer hervorheben
}

/**
 * Vereinfachte Such-Controller-Klasse für den JSON/VAST-Explorer
 */
export class SearchController {
  private searchResults: SearchMatch[] = [];
  private searchTerm: string = '';
  private currentIndex: number = -1;
  private options: SearchOptions;
  private jsonElements: HTMLElement[] = [];
  private vastElements: HTMLElement[] = [];

  constructor(options?: Partial<SearchOptions>) {
    this.options = {
      caseSensitive: false,
      wholeWord: false,
      regexSearch: false,
      searchInKeys: true,
      highlightAll: true,
      ...options
    };
  }

  /**
   * Setzt die Suchoptionen
   */
  setOptions(options: Partial<SearchOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Setzt die DOM-Element-Referenzen für die JSON-Suche
   */
  setJsonElements(container: HTMLElement | null): void {
    this.jsonElements = [];
    if (!container) return;
    
    // Sammle alle Elemente außer denen in der Suchleiste
    const allElements = container.querySelectorAll('*');
    allElements.forEach(el => {
      if (el instanceof HTMLElement && !el.closest('.floating-search-container')) {
        this.jsonElements.push(el);
      }
    });
  }

  /**
   * Setzt die DOM-Element-Referenzen für die VAST-Suche
   */
  setVastElements(container: HTMLElement | null): void {
    this.vastElements = [];
    if (!container) return;
    
    // Sammle alle Elemente außer denen in der Suchleiste
    const allElements = container.querySelectorAll('*');
    allElements.forEach(el => {
      if (el instanceof HTMLElement && !el.closest('.floating-search-container')) {
        this.vastElements.push(el);
      }
    });
  }

  /**
   * Hilfsfunktion zum Escapen von Regex-Zeichen
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Sucht nach dem angegebenen Term
   */
  search(term: string): SearchMatch[] {
    if (!term.trim()) return [];
    
    this.searchTerm = term;
    this.searchResults = [];
    this.currentIndex = -1;

    try {
      // Erstelle das Suchmuster
      let pattern: RegExp;
      
      if (this.options.regexSearch) {
        try {
          pattern = new RegExp(term, this.options.caseSensitive ? '' : 'i');
        } catch (e) {
          console.error('Ungültiger regulärer Ausdruck:', e);
          throw new Error(`Ungültiger regulärer Ausdruck: ${term}`);
        }
      } else {
        const escapedTerm = this.escapeRegExp(term);
        const flags = this.options.caseSensitive ? '' : 'i';
        
        if (this.options.wholeWord) {
          pattern = new RegExp(`\\b${escapedTerm}\\b`, flags);
        } else {
          pattern = new RegExp(escapedTerm, flags);
        }
      }

      // Durchsuche alle DOM-Elemente
      this.searchInDom(this.jsonElements, pattern, 'json');
      this.searchInDom(this.vastElements, pattern, 'vast');

      // Sortiere nach Zeilennummer
      this.searchResults.sort((a, b) => {
        if (a.lineNumber !== undefined && b.lineNumber !== undefined) {
          return a.lineNumber - b.lineNumber;
        }
        return 0;
      });

      return this.searchResults;
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
      throw error;
    }
  }

  /**
   * Durchsucht DOM-Elemente nach Übereinstimmungen
   */
  private searchInDom(elements: HTMLElement[], pattern: RegExp, context: 'json' | 'vast'): void {
    elements.forEach(element => {
      // 1. Textinhalt sammeln
      const textContent = element.textContent?.trim() || '';
      if (!textContent) return;
      
      // 2. Daten-Attribute hinzufügen
      let attributeContent = '';
      ['data-key', 'data-value', 'data-path'].forEach(attr => {
        const attrValue = element.getAttribute(attr);
        if (attrValue) {
          attributeContent += ' ' + attrValue;
        }
      });
      
      // 3. Bestimme den Typ des Elements (vereinfacht)
      let elementType: 'key' | 'value' | 'text' = 'text';
      
      if (element.classList.contains('json-key') || element.getAttribute('data-type') === 'key') {
        // Wenn es sich um einen Schlüssel handelt und wir nicht in Schlüsseln suchen sollen, überspringe
        if (!this.options.searchInKeys) return;
        elementType = 'key';
      } else if (element.classList.contains('json-value') || element.getAttribute('data-type') === 'value') {
        elementType = 'value';
      }
      
      // 4. Durchsuchbarer Text
      const searchableText = (textContent + ' ' + attributeContent).trim();
      
      // 5. Suche nach dem Muster
      if (pattern.test(searchableText)) {
        // 6. Bestimme die Zeilennummer, falls vorhanden
        let lineNumber: number | undefined;
        const lineElement = element.closest('tr, [data-line]');
        if (lineElement) {
          const lineText = lineElement.getAttribute('data-line') || 
                          lineElement.firstChild?.textContent?.trim();
          if (lineText) {
            const parsedLine = parseInt(lineText, 10);
            if (!isNaN(parsedLine)) {
              lineNumber = parsedLine;
            }
          }
        }
        
        // 7. Extrahiere Pfad, falls verfügbar
        const path = element.getAttribute('data-path') || undefined;
        
        // 8. Erstelle ein Match-Objekt
        this.searchResults.push({
          id: `${context}-${this.searchResults.length}`,
          text: searchableText,
          context: this.getContext(searchableText),
          lineNumber,
          elementType,
          node: element,
          path
        });
      }
    });
  }

  /**
   * Erzeugt Kontext um einen Suchbegriff
   */
  private getContext(text: string): string {
    try {
      const term = this.searchTerm;
      
      if (!text || !term) return text;
      
      const termIndex = this.options.caseSensitive 
        ? text.indexOf(term)
        : text.toLowerCase().indexOf(term.toLowerCase());
      
      if (termIndex === -1) return text.slice(0, 50) + (text.length > 50 ? '...' : '');
      
      const contextStart = Math.max(0, termIndex - 20);
      const contextEnd = Math.min(text.length, termIndex + term.length + 20);
      
      let context = text.slice(contextStart, contextEnd);
      
      if (contextStart > 0) context = '...' + context;
      if (contextEnd < text.length) context = context + '...';
      
      return context;
    } catch (e) {
      return text.slice(0, 50) + (text.length > 50 ? '...' : '');
    }
  }

  /**
   * Gibt alle Suchergebnisse zurück
   */
  getResults(): SearchMatch[] {
    return this.searchResults;
  }

  /**
   * Gibt die Anzahl der Ergebnisse zurück
   */
  getResultCount(): number {
    return this.searchResults.length;
  }

  /**
   * Geht zum nächsten Treffer
   */
  getNextMatch(): SearchMatch | null {
    if (this.searchResults.length === 0) return null;
    
    this.currentIndex = (this.currentIndex + 1) % this.searchResults.length;
    return this.searchResults[this.currentIndex];
  }

  /**
   * Geht zum vorherigen Treffer
   */
  getPreviousMatch(): SearchMatch | null {
    if (this.searchResults.length === 0) return null;
    
    this.currentIndex = (this.currentIndex - 1 + this.searchResults.length) % this.searchResults.length;
    return this.searchResults[this.currentIndex];
  }

  /**
   * Geht zu einem bestimmten Treffer
   */
  goToMatch(index: number): SearchMatch | null {
    if (index < 0 || index >= this.searchResults.length) return null;
    
    this.currentIndex = index;
    return this.searchResults[index];
  }

  /**
   * Gibt den aktuellen Trefferindex zurück
   */
  getCurrentMatchIndex(): number {
    return this.currentIndex;
  }

  /**
   * Löscht den Suchzustand
   */
  clear(): void {
    this.searchResults = [];
    this.searchTerm = '';
    this.currentIndex = -1;
  }
} 