import { DataRow } from '../types';

// Bekannte Dimensionsnamen aus der AdTech-Branche
const KNOWN_DIMENSIONS = [
  'Ad Sequence Position', 'Agency Name', 'App Bundle', 'App Store URL', 
  'Browser Name', 'Campaign ID', 'Campaign Name', 'Date', 'Device Type', 
  'Format', 'Publisher Name', 'Website Domain', 'day', 'week', 'month', 
  'year', 'quarter', 'category', 'type', 'status', 'name', 'id', 'region', 
  'country', 'city', 'state', 'source', 'platform'
];

/**
 * Prüft, ob ein Wert numerisch ist
 */
const isNumeric = (value: any): boolean => {
  return !isNaN(Number(value)) && value !== null && value !== '';
};

/**
 * Prüft, ob ein String ein gültiges Datum ist
 */
const isDateString = (value: string): boolean => {
  if (!value) return false;
  
  // Gängige Datumsformate überprüfen
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  const germanDateRegex = /^\d{1,2}\.\d{1,2}\.\d{2,4}$/;
  const commonDateRegex = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;
  
  if (isoDateRegex.test(value) || germanDateRegex.test(value) || commonDateRegex.test(value)) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  try {
    const date = new Date(value);
    const year = date.getFullYear();
    if (!isNaN(date.getTime()) && year >= 1900 && year <= 2100) {
      return true;
    }
  } catch (e) {
    // Fehler beim Parsen
  }
  
  return false;
};

/**
 * Prüft, ob eine Spalte Datumswerte enthält
 */
const checkForDateColumn = (data: DataRow[], columnKey: string): boolean => {
  const sampleSize = Math.min(10, data.length);
  const samples = data.slice(0, sampleSize);
  
  let dateCount = 0;
  
  samples.forEach(row => {
    const value = row[columnKey];
    if (value instanceof Date) {
      dateCount++;
    } else if (typeof value === 'string' && isDateString(value)) {
      dateCount++;
    }
  });
  
  return dateCount / sampleSize >= 0.5;
};

/**
 * Identifiziert Dimensionen und Metriken in den Daten
 */
export const identifyColumnTypes = (data: DataRow[]): { dimensions: string[], metrics: string[] } => {
  if (data.length === 0) return { dimensions: [], metrics: [] };
  
  const firstRow = data[0];
  const dimensions: string[] = [];
  const metrics: string[] = [];
  
  Object.entries(firstRow).forEach(([key, value]) => {
    // Prüfen, ob es ein Datums-Typ ist
    const hasDateValues = checkForDateColumn(data, key);
    if (hasDateValues) {
      dimensions.push(key);
      return;
    }
    
    // Prüfen, ob es eine bekannte Dimension ist
    const isKnownDimension = KNOWN_DIMENSIONS.some(dim => 
      key.toLowerCase() === dim.toLowerCase() || 
      key.toLowerCase().includes('id') ||
      key.toLowerCase().includes('name') ||
      key.toLowerCase().includes('type') ||
      key.toLowerCase().includes('category')
    );
    
    if (isKnownDimension) {
      dimensions.push(key);
      return;
    }
    
    // Numerischen Check als Fallback verwenden
    const numericCount = data.reduce((count, row) => {
      return isNumeric(row[key]) ? count + 1 : count;
    }, 0);
    
    const isMetric = numericCount / data.length > 0.8;
    if (isMetric) {
      metrics.push(key);
    } else {
      dimensions.push(key);
    }
  });
  
  return { dimensions, metrics };
}; 