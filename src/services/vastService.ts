/**
 * Service für VAST-spezifische Operationen
 * 
 * Bietet Funktionen zum Finden, Analysieren und Abrufen von VAST-Tags.
 */

// Maximale Anzahl von VAST-Wrappern, die verfolgt werden sollen
export const MAX_VAST_WRAPPER = 5;

/**
 * Repräsentiert Informationen über ein VAST-Tag im JSON
 */
export interface VastInfo {
  path: string;
  content: string;
}

/**
 * Repräsentiert ein Element in der VAST-Wrapper-Kette
 */
export interface VastChainItem {
  uri: string;
  content: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Findet VAST-XML-Inhalte in einem JSON-Objekt
 * 
 * @param obj Das JSON-Objekt, in dem gesucht werden soll
 * @returns Eine VastInfo mit Pfad und Inhalt oder null, wenn nichts gefunden wurde
 */
export function findVastContent(obj: any): VastInfo | null {
  if (typeof obj !== 'object' || obj === null) return null;
  
  // Rekursive Traversierung des Objekts
  const traverse = (obj: any, path = ''): VastInfo | null => {
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Prüfen, ob der aktuelle Wert ein VAST-XML-String ist
      if (typeof obj[key] === 'string' && 
          obj[key].includes('<VAST') && 
          obj[key].includes('</VAST>')) {
        return { path: currentPath, content: obj[key] };
      }
      
      // Rekursive Suche in verschachtelten Objekten
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const result: VastInfo | null = traverse(obj[key], currentPath);
        if (result) return result;
      }
    }
    return null;
  };
  
  return traverse(obj);
}

/**
 * Extrahiert einen VAST-URL aus einem String
 * 
 * @param content Der String, in dem nach einem VAST-URL gesucht werden soll
 * @returns Den gefundenen URL oder null
 */
export function extractVastUrl(content: string | null): string | null {
  if (!content) return null;
  const match = content.match(/https?:\/\/[^\s"'<>]+vast[^\s"'<>]*/i);
  return match ? match[0] : null;
}

/**
 * Extrahiert den VAST-URL aus einem VASTAdTagURI-Tag
 * 
 * @param content Der XML-String, in dem nach einem VASTAdTagURI-Tag gesucht werden soll
 * @returns Den gefundenen URL oder null
 */
export function extractAdTagUri(content: string | null): string | null {
  if (!content) return null;
  
  // Regex, um VASTAdTagURI zu finden und URL zu extrahieren
  // Behandelt CDATA und entfernt Whitespace
  const regex = /<VASTAdTagURI(?:\s[^>]*)?>\s*(?:<!\[CDATA\[\s*)?(https?:\/\/[^\s<\]]+)\s*(?:\]\]>)?\s*<\/VASTAdTagURI>/i;
  const match = content.match(regex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return null;
}

/**
 * Ruft einen VAST-Tag von einer URL ab und verfolgt optional die Wrapper-Kette
 * 
 * @param uri Die URL des abzurufenden VAST-Tags
 * @param onChainUpdate Callback-Funktion, die bei jeder Aktualisierung der Kette aufgerufen wird
 * @param currentChain Die aktuelle Wrapper-Kette (für rekursive Aufrufe)
 */
export async function fetchVastChain(
  uri: string,
  onChainUpdate: (chain: VastChainItem[]) => void,
  currentChain: VastChainItem[] = []
): Promise<void> {
  if (currentChain.length >= MAX_VAST_WRAPPER) {
    console.warn(`VAST wrapper limit (${MAX_VAST_WRAPPER}) reached. Stopping fetch for URI: ${uri}`);
    
    // Aktuelle Kette um ein Fehler-Item erweitern
    const updatedChain = [
      ...currentChain,
      { 
        uri, 
        content: null, 
        isLoading: false, 
        error: `Wrapper limit (${MAX_VAST_WRAPPER}) reached.`
      }
    ];
    
    onChainUpdate(updatedChain);
    return;
  }
  
  // Neues Item für die aktuelle URI erstellen
  const chainIndex = currentChain.length;
  const newItem: VastChainItem = { 
    uri, 
    content: null, 
    isLoading: true, 
    error: null 
  };
  
  // Aktualisierte Kette zurückgeben
  const updatedChain = [...currentChain, newItem];
  onChainUpdate(updatedChain);

  try {
    // VAST-Inhalt von der URL abrufen
    // Hinweis: CORS-Einschränkungen können gelten
    const response = await fetch(uri);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Prüfen, ob die Antwort XML ist
    if (!text.trim().startsWith('<')) {
      throw new Error('Response does not look like XML.');
    }

    // Item in der Kette aktualisieren
    const chainWithContent = updatedChain.map((item, index) => 
      index === chainIndex ? { ...item, content: text, isLoading: false } : item
    );
    
    onChainUpdate(chainWithContent);

    // Nach einem weiteren VAST-Wrapper in der Antwort suchen
    const nextUri = extractAdTagUri(text);
    
    if (nextUri) {
      // Rekursiv den nächsten Wrapper in der Kette abrufen
      await fetchVastChain(
        nextUri, 
        onChainUpdate,
        chainWithContent
      );
    }
    
  } catch (err: any) {
    console.error(`Error fetching VAST URI at index ${chainIndex}:`, err);
    
    // Fehlermeldung für den Benutzer erstellen
    const errorMessage = `Failed to fetch VAST from URI: ${err.message}. Possible CORS issue or invalid URL/content.`;
    
    // Kette mit Fehler aktualisieren
    const chainWithError = updatedChain.map((item, index) => 
      index === chainIndex ? { ...item, isLoading: false, error: errorMessage } : item
    );
    
    onChainUpdate(chainWithError);
  }
} 