import { DataRow } from '../types';
import { identifyColumnTypes } from './ColumnTypeIdentifier';
import { DataAggregator } from './DataAggregator';

export class DataProcessing {
  private data: DataRow[];
  private dimensions: string[];
  private metrics: string[];

  constructor(data: DataRow[]) {
    this.data = data;
    const { dimensions, metrics } = identifyColumnTypes(data);
    this.dimensions = dimensions;
    this.metrics = metrics;
  }

  /**
   * Gibt die verfügbaren Dimensionen zurück
   */
  public getDimensions(): string[] {
    return this.dimensions;
  }

  /**
   * Gibt die verfügbaren Metriken zurück
   */
  public getMetrics(): string[] {
    return this.metrics;
  }

  /**
   * Erstellt einen DataAggregator für die angegebenen Dimension und Metrik
   */
  public createAggregator(dimension: string, metric: string): DataAggregator {
    return new DataAggregator(this.data, dimension, metric);
  }

  /**
   * Prüft, ob die Daten gültig sind
   */
  public validateData(): boolean {
    if (!Array.isArray(this.data) || this.data.length === 0) {
      return false;
    }

    const firstRow = this.data[0];
    if (!firstRow || typeof firstRow !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * Bereinigt die Daten
   */
  public cleanData(): DataRow[] {
    return this.data.map(row => {
      const cleanedRow: DataRow = {};
      
      Object.entries(row).forEach(([key, value]) => {
        // Entferne leere Strings und null/undefined Werte
        if (value === '' || value === null || value === undefined) {
          cleanedRow[key] = null;
          return;
        }

        // Konvertiere Zahlen-Strings zu Zahlen
        if (typeof value === 'string' && !isNaN(Number(value))) {
          cleanedRow[key] = Number(value);
          return;
        }

        // Behalte alle anderen Werte bei
        cleanedRow[key] = value;
      });

      return cleanedRow;
    });
  }
} 