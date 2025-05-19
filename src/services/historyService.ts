/**
 * Service zur Verwaltung der Verlaufsdaten
 * Speichert und lädt Verlaufsdaten für verschiedene Funktionen der Anwendung
 */

// Konstante für maximale Anzahl von History-Einträgen
const MAX_HISTORY_ITEMS = 20;

// Typen von History (können erweitert werden)
export type HistoryType = 'tcf' | 'json' | 'vast';

/**
 * Repräsentiert einen Eintrag im Verlauf
 */
export interface HistoryItem {
  id: number;
  timestamp: number;
  content: string;
  title?: string;
  type: HistoryType;
}

/**
 * Lädt Verlaufsdaten für einen bestimmten Typ
 * 
 * @param type Typ des Verlaufs ('tcf', 'json', 'vast')
 * @returns Array von Verlaufseinträgen
 */
export const getHistoryItems = (type: HistoryType): HistoryItem[] => {
  try {
    const key = `${type}_history`;
    const historyJson = localStorage.getItem(key);
    
    if (!historyJson) return [];
    
    const historyData = JSON.parse(historyJson);
    if (!Array.isArray(historyData)) return [];
    
    return historyData.map((item: any) => ({
      ...item,
      type
    }));
  } catch (error) {
    console.error(`Error loading ${type} history:`, error);
    return [];
  }
};

/**
 * Fügt einen neuen Eintrag zum Verlauf hinzu
 * 
 * @param type Typ des Verlaufs
 * @param content Inhalt des Eintrags
 */
export const addHistoryItem = (type: HistoryType, content: string): void => {
  if (!content.trim()) return;
  
  try {
    const key = `${type}_history`;
    const existingHistory = getHistoryItems(type);
    
    // Wenn der Eintrag bereits existiert, ihn nach vorne bringen
    const filteredHistory = existingHistory.filter(item => item.content !== content);
    
    // Neuen Eintrag am Anfang hinzufügen
    const newHistory = [{
      id: Date.now(),
      timestamp: Date.now(),
      content,
      type
    }, ...filteredHistory];
    
    // Auf maximale Anzahl begrenzen
    const limitedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
    
    // In localStorage speichern
    localStorage.setItem(key, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error(`Error adding to ${type} history:`, error);
  }
};

/**
 * Löscht den gesamten Verlauf für einen Typ
 * 
 * @param type Typ des Verlaufs
 */
export const clearHistory = (type: HistoryType): void => {
  try {
    const key = `${type}_history`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing ${type} history:`, error);
  }
}; 