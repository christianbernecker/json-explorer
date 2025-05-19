import { DataRow, AggregatedData } from '../types';

export class DataAggregator {
  private data: DataRow[];
  private dimension: string;
  private metric: string;

  constructor(data: DataRow[], dimension: string, metric: string) {
    this.data = data;
    this.dimension = dimension;
    this.metric = metric;
  }

  /**
   * Aggregiert die Daten nach Dimension und Metrik
   */
  public aggregate(): AggregatedData {
    const aggregated: AggregatedData = {};

    this.data.forEach(row => {
      const dimensionValue = String(row[this.dimension] || 'Unknown');
      const metricValue = Number(row[this.metric]) || 0;

      if (!aggregated[dimensionValue]) {
        aggregated[dimensionValue] = {};
      }

      if (!aggregated[dimensionValue][this.metric]) {
        aggregated[dimensionValue][this.metric] = 0;
      }

      aggregated[dimensionValue][this.metric] += metricValue;
    });

    return aggregated;
  }

  /**
   * Sortiert die aggregierten Daten nach Metrik
   */
  public sortByMetric(aggregated: AggregatedData, ascending: boolean = false): AggregatedData {
    const sortedEntries = Object.entries(aggregated).sort((a, b) => {
      const valueA = a[1][this.metric];
      const valueB = b[1][this.metric];
      return ascending ? valueA - valueB : valueB - valueA;
    });

    return Object.fromEntries(sortedEntries);
  }

  /**
   * Konvertiert aggregierte Daten in ein Format für Charts
   */
  public toChartData(aggregated: AggregatedData): { labels: string[], data: number[] } {
    const labels: string[] = [];
    const data: number[] = [];

    Object.entries(aggregated).forEach(([dimension, metrics]) => {
      labels.push(dimension);
      data.push(metrics[this.metric]);
    });

    return { labels, data };
  }
} 