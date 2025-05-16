/**
 * HistoryService - Ein gemeinsamer Dienst zur Verwaltung von Verlaufsdaten für alle Tools
 */

// Gemeinsame Schnittstelle für alle Verlaufseinträge
export interface HistoryItem {
  id: number;
  type: 'json' | 'tcf' | 'vast' | 'data' | 'other';
  content: string;
  timestamp: number;
  title?: string;
  metadata?: Record<string, any>;
}

// Service-Einstellungen
const STORAGE_KEY_PREFIX = 'adtech_toolbox_history_';
const MAX_HISTORY_ITEMS = 50; // Maximale Anzahl von Verlaufseinträgen pro Tool

/**
 * Lädt den Verlauf für einen bestimmten Tool-Typ aus dem Local Storage
 */
export const loadHistory = (type: HistoryItem['type']): HistoryItem[] => {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${type}`;
    const savedHistory = localStorage.getItem(storageKey);
    
    if (savedHistory) {
      return JSON.parse(savedHistory);
    }
  } catch (error) {
    console.error(`Failed to load ${type} history:`, error);
  }
  
  return [];
};

/**
 * Speichert den Verlauf für einen bestimmten Tool-Typ im Local Storage
 */
export const saveHistory = (type: HistoryItem['type'], history: HistoryItem[]): void => {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${type}`;
    localStorage.setItem(storageKey, JSON.stringify(history));
  } catch (error) {
    console.error(`Failed to save ${type} history:`, error);
  }
};

/**
 * Fügt einen neuen Eintrag zum Verlauf eines Tools hinzu
 */
export const addHistoryItem = (
  type: HistoryItem['type'], 
  content: string, 
  title?: string,
  metadata?: Record<string, any>
): HistoryItem[] => {
  const history = loadHistory(type);
  
  // Prüfen ob der Inhalt bereits existiert
  const exists = history.some(item => item.content === content);
  if (exists) {
    // Optional: Bestehenden Eintrag nach vorne verschieben und Zeitstempel aktualisieren
    const updatedHistory = history
      .filter(item => item.content !== content)
      .concat([{
        ...history.find(item => item.content === content)!,
        timestamp: Date.now()
      }])
      .sort((a, b) => b.timestamp - a.timestamp);
      
    saveHistory(type, updatedHistory);
    return updatedHistory;
  }
  
  // Neuen Eintrag erstellen
  const newItem: HistoryItem = {
    id: Date.now(), // Eindeutige ID basierend auf aktuellem Zeitstempel
    type,
    content,
    timestamp: Date.now(),
    title,
    metadata
  };
  
  // Füge neuen Eintrag hinzu und begrenze auf maximale Anzahl
  const newHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
  saveHistory(type, newHistory);
  
  return newHistory;
};

/**
 * Löscht einen bestimmten Eintrag aus dem Verlauf
 */
export const removeHistoryItem = (type: HistoryItem['type'], id: number): HistoryItem[] => {
  const history = loadHistory(type);
  const filteredHistory = history.filter(item => item.id !== id);
  
  saveHistory(type, filteredHistory);
  return filteredHistory;
};

/**
 * Löscht den gesamten Verlauf eines Tools
 */
export const clearHistory = (type: HistoryItem['type']): void => {
  saveHistory(type, []);
};

/**
 * Holt den gesamten verlauf für alle Tools
 */
export const getAllHistory = (): Record<string, HistoryItem[]> => {
  const types: HistoryItem['type'][] = ['json', 'tcf', 'vast', 'data', 'other'];
  
  return types.reduce((result, type) => {
    result[type] = loadHistory(type);
    return result;
  }, {} as Record<string, HistoryItem[]>);
}; 