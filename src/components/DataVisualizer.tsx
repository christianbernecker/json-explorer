import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SEO } from './seo';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DataVisualizerPlugin from './DataVisualizerPlugin';
import ApplicationHeader from './ApplicationHeader';

// Import AG-Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Types
interface DataRow {
  [key: string]: any;
}

type ChartType = 'bar' | 'line' | 'pie' | 'radar' | 'area';

interface AggregatedData {
  name: string;
  value: number;
}

interface DataVisualizerProps {
  isDarkMode: boolean;
}

// Helper functions
const isNumeric = (value: any): boolean => {
  return !isNaN(Number(value)) && value !== null && value !== '';
};

// Predefined list of known dimension names from AdTech industry
const KNOWN_DIMENSIONS = [
  'Ad Sequence Position', 'Agency Name', 'App Bundle', 'App Store URL', 'Assigned Agency ID', 
  'Assigned Agency Name', 'Assigned Publisher ID', 'Auction Type', 'Bid Source', 'Brand ID', 
  'Brand Name', 'Browser Major Version', 'Browser Name', 'CTV Channel', 'Campaign Advertiser', 
  'Campaign Agency', 'Campaign CPD Cost Setting', 'Campaign Category', 'Campaign Contract ID', 
  'Campaign ID', 'Campaign Type', 'Core DSP Ad Id', 'Core DSP Campaign ID', 'Core DSP Campaign Name',
  'Creative Height', 'Creative Width', 'Custom Slot ID', 'DSP Creative ID', 'DSP Partner ID', 
  'DSP Partner Name', 'Date', 'Device Brand', 'Device Geo Country', 'Device Name', 'Device OS', 
  'Device Type', 'Format', 'Format Type', 'Landing Page Domain', 'Month', 'OS Version', 
  'Price Rule ID', 'Price Rule Name', 'Price Type', 'Publisher Account Manager', 'Publisher ID', 
  'Publisher Name', 'Slot Default Format', 'Slot ID', 'Slot Name', 'Slot Size', 'TCF Status', 
  'Targeted Dimensions', 'Test Impression', 'Traffic Source', 'Traffic Type', 'Video Error Code', 
  'WT-ID', 'Website Domain', 'Website ID', 'Website Name', 'Week of Year', 'Year', 'Zip Code',
  // Date-related columns should always be dimensions
  'day', 'week', 'month', 'year', 'date', 'datetime', 'quarter',
  // Common categorical fields
  'category', 'type', 'status', 'name', 'id', 'region', 'country', 'city', 'state'
];

// Verbesserte Date-Erkennung
const isDateString = (value: string): boolean => {
  // Skip empty values
  if (!value) return false;
  
  // Überprüfe gängige Datumsformate
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  const germanDateRegex = /^\d{1,2}\.\d{1,2}\.\d{2,4}$/;
  const commonDateRegex = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;
  
  if (isoDateRegex.test(value) || germanDateRegex.test(value) || commonDateRegex.test(value)) {
    // Versuche zu parsen
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  // Für andere Formate versuchen
  try {
    const date = new Date(value);
    // Überprüfe, ob es ein plausibles Datum ist (zwischen 1900 und 2100)
    const year = date.getFullYear();
    if (!isNaN(date.getTime()) && year >= 1900 && year <= 2100) {
      return true;
    }
  } catch (e) {
    // Fehler beim Parsen
  }
  
  return false;
};

// Hilfsfunktion: Prüft, ob eine Spalte Datumswerte enthält
const checkForDateColumn = (data: DataRow[], columnKey: string): boolean => {
  // Nehme Stichprobe von max. 10 Zeilen
  const sampleSize = Math.min(10, data.length);
  const samples = data.slice(0, sampleSize);
  
  // Zähle, wie viele Werte als Datum erkannt werden
  let dateCount = 0;
  
  samples.forEach(row => {
    const value = row[columnKey];
    if (value instanceof Date) {
      dateCount++;
    } else if (typeof value === 'string' && isDateString(value)) {
      dateCount++;
    }
  });
  
  // Wenn mindestens 50% der Stichproben Datumswerte sind, ist es eine Datumsspalte
  return dateCount / sampleSize >= 0.5;
};

// Funktion zur Identifizierung von Dimensions und Metrics
const identifyColumnTypes = (data: DataRow[]): { dimensions: string[], metrics: string[] } => {
  if (data.length === 0) return { dimensions: [], metrics: [] };
  
  const firstRow = data[0];
  const dimensions: string[] = [];
  const metrics: string[] = [];
  
  Object.entries(firstRow).forEach(([key, value]) => {
    // Überprüfe zuerst, ob es ein Datums-Typ ist
    const hasDateValues = checkForDateColumn(data, key);
    if (hasDateValues) {
      dimensions.push(key);
      return;
    }
    
    // Überprüfe bekannte Dimensions
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
    
    // Numerische Check als Fallback
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
  
  console.log("Identifizierte Dimensionen:", dimensions);
  console.log("Identifizierte Metriken:", metrics);
  
  return { dimensions, metrics };
};

const aggregateData = (
  data: DataRow[], 
  dimension: string, 
  metric: string, 
  aggregationType: 'sum' | 'average' = 'sum'
): AggregatedData[] => {
  if (!data.length || !dimension || !metric) {
    console.warn('Missing data, dimension or metric');
    return [];
  }
  
  // Handle case where dimension and metric are the same column
  if (dimension === metric) {
    console.warn('Dimension and metric are the same column. Using a fallback metric.');
    // Try to find any numeric column as fallback
    const fallbackMetric = Object.keys(data[0]).find(key => 
      key !== dimension && 
      data.some(row => isNumeric(row[key]))
    );
    
    if (fallbackMetric) {
      console.log(`Using ${fallbackMetric} as fallback metric instead of ${metric}`);
      metric = fallbackMetric;
    } else {
      console.error('No suitable fallback metric found');
      return [];
    }
  }
  
  const aggregated: { [key: string]: { sum: number, count: number } } = {};
  
  // Check if this is a date dimension for better formatting
  const isDateDimension = dimension.toLowerCase().includes('date') || 
                          dimension.toLowerCase().includes('day') ||
                          dimension.toLowerCase().includes('month');

  console.log('Processing dimension:', dimension, 'isDateDimension:', isDateDimension);

  // First pass: aggregate the data
  data.forEach(row => {
    let dimValue: string;
    
    // Format date values consistently if this appears to be a date dimension
    if (isDateDimension) {
      const rawValue = row[dimension];
      
      console.log('Date dimension raw value:', rawValue, 'type:', typeof rawValue);
      
      // Try to parse and format dates consistently
      if (rawValue instanceof Date) {
        dimValue = rawValue.toISOString().split('T')[0]; // YYYY-MM-DD
        console.log('Formatted date from Date object:', dimValue);
      } else if (typeof rawValue === 'string' && (
        rawValue.includes('-') || rawValue.includes('/') || rawValue.match(/^\d{1,2}\.\d{1,2}\.\d{2,4}$/)
      )) {
        try {
          const date = new Date(rawValue);
          if (!isNaN(date.getTime())) {
            dimValue = date.toISOString().split('T')[0]; // YYYY-MM-DD
            console.log('Formatted date from string:', dimValue);
          } else {
            dimValue = String(rawValue || 'Unknown');
            console.log('Could not parse date from string:', rawValue);
          }
        } catch(e) {
          dimValue = String(rawValue || 'Unknown');
          console.log('Error parsing date:', e);
        }
      } else {
        dimValue = String(rawValue || 'Unknown');
        console.log('Using raw value as dimension:', dimValue);
      }
    } else {
      // Non-date dimension
      dimValue = String(row[dimension] || 'Unknown');
    }
    
    // Safe numeric conversion for metric values
    const rawMetricValue = row[metric];
    let metricValue = 0;
    
    if (typeof rawMetricValue === 'number') {
      metricValue = rawMetricValue;
    } else if (typeof rawMetricValue === 'string' && !isNaN(Number(rawMetricValue))) {
      metricValue = Number(rawMetricValue);
    }
    
    if (!aggregated[dimValue]) {
      aggregated[dimValue] = { sum: 0, count: 0 };
    }
    
    if (!isNaN(metricValue)) {
      aggregated[dimValue].sum += metricValue;
      aggregated[dimValue].count += 1;
    }
  });
  
  // Convert to array and sort by dimension value
  let result = Object.entries(aggregated).map(([name, { sum, count }]) => ({
    name,
    value: aggregationType === 'sum' ? sum : (count > 0 ? sum / count : 0)
  }));
  
  // Sort by date if it's a date dimension
  if (isDateDimension) {
    console.log('Sorting by date...');
    result.sort((a, b) => {
      // Try parsing as dates
      const dateA = new Date(a.name);
      const dateB = new Date(b.name);
      
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        console.log(`Comparing dates: ${a.name} (${dateA}) vs ${b.name} (${dateB})`);
        return dateA.getTime() - dateB.getTime();
      }
      console.log(`Falling back to string comparison: ${a.name} vs ${b.name}`);
      return a.name.localeCompare(b.name);
    });

    console.log('Sorted date data:', result);
  } else {
    // For non-date dimensions with numeric values, try to sort numerically
    const isNumericDimension = !isNaN(Number(result[0]?.name));
    if (isNumericDimension) {
      result.sort((a, b) => Number(a.name) - Number(b.name));
    }
  }
  
  return result;
};

/* eslint-disable @typescript-eslint/no-unused-vars */
const identifyColumnType = (values: any[]): string => {
  if (values.length === 0) return 'string';
  
  // Check if all non-null values are numbers
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'string';
  
  // Check if all values are numbers
  const allNumbers = nonNullValues.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))));
  if (allNumbers) return 'number';
  
  // Check if all values are dates
  const allDates = nonNullValues.every(v => v instanceof Date || (typeof v === 'string' && isDateString(v)));
  if (allDates) return 'date';
  
  // Default to string
  return 'string';
};
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Identifies columns that have at least one non-empty value
 */
const identifyNonEmptyColumns = (data: DataRow[]): string[] => {
  const nonEmptyColumns: string[] = [];
  
  if (data.length === 0) return nonEmptyColumns;
  
  // Get all possible column names from the first row
  const allColumns = Object.keys(data[0]);
  
  // Check each column for non-empty values
  allColumns.forEach(column => {
    const hasNonEmptyValue = data.some(row => {
      const value = row[column];
      return value !== null && value !== undefined && value !== '';
    });
    
    if (hasNonEmptyValue) {
      nonEmptyColumns.push(column);
    }
  });
  
  return nonEmptyColumns;
};

// Generate AG-Grid column definitions from data
/* eslint-disable @typescript-eslint/no-unused-vars */
const generateColumnDefs = (data: DataRow[], nonEmptyColumns: string[]): ColDef[] => {
  if (data.length === 0 || nonEmptyColumns.length === 0) return [];
  
  const columnDefs: ColDef[] = nonEmptyColumns.map(field => {
    // Determine column type for appropriate filtering
    const sampleValues = data
      .slice(0, 10)
      .map(row => row[field])
      .filter(val => val !== undefined && val !== null && val !== '');
    
    const hasDateValue = sampleValues.some(val => val instanceof Date);
    
    // Verwende boolean für Filter statt String
    const filter = true;
    
    return {
      field,
      headerName: field,
      sortable: true,
      filter, // Jetzt ein boolescher Wert
      resizable: true,
      // Special rendering for dates
      cellRenderer: hasDateValue 
        ? (params: any) => {
            if (params.value instanceof Date) {
              return params.value.toISOString().split('T')[0];
            }
            return params.value;
          }
        : undefined
    };
  });
  
  return columnDefs;
};
/* eslint-enable @typescript-eslint/no-unused-vars */

// Main Component
function DataVisualizer({ isDarkMode }: DataVisualizerProps) {
  const [data, setData] = useState<DataRow[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [originalData, setOriginalData] = useState<DataRow[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [columns, setColumns] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<string[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedAggregation, setSelectedAggregation] = useState<'sum' | 'average'>('sum');
  const [chartData, setChartData] = useState<AggregatedData[]>([]);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [fileName, setFileName] = useState<string>('');
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  
  // State for file upload
  const [isLoading, setIsLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Visualization states
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [aggregationType, setAggregationType] = useState<'sum' | 'average'>('sum');

  // Column defs generieren (mit Debug-Info)
  const generateColumnDefsWithDebug = useCallback((dataToRender: DataRow[], nonEmptyCols: string[]): ColDef[] => {
    console.log('Generiere Spaltendefinitionen für Tabelle:', {
      rowCount: dataToRender.length,
      nonEmptyCols: nonEmptyCols,
      sampleRow: dataToRender.length > 0 ? dataToRender[0] : null
    });

    if (dataToRender.length === 0) {
      console.warn('generateColumnDefsWithDebug: Keine Daten zum Generieren von Spalten.');
      return [];
    }

    if (nonEmptyCols.length === 0) {
      console.warn('generateColumnDefsWithDebug: Keine nicht-leeren Spalten gefunden. Versuche alle Spalten aus der ersten Zeile zu verwenden.');
      nonEmptyCols = dataToRender.length > 0 ? Object.keys(dataToRender[0]) : [];
      if (nonEmptyCols.length === 0) {
        console.error('generateColumnDefsWithDebug: Konnte auch keine Spalten aus der ersten Zeile extrahieren.');
        return [];
      }
    }

    return nonEmptyCols.map(key => {
      let columnType = 'string';
      const values = dataToRender.map(row => row[key]).filter(val => val !== null && val !== undefined && val !== '');
      if (values.length > 0) {
        columnType = identifyColumnType(values); // identifyColumnType muss existieren und korrekt arbeiten
      }
      
      console.log(`Spalte: ${key}, Typ: ${columnType}`);
    
      return {
        field: key,
        headerName: key,
        sortable: true,
        filter: true,
        minWidth: 125,
        width: 150,
        valueFormatter: (params: any) => {
          if (params.value === null || params.value === undefined) {
            return '';
          }
          if (columnType === 'date' && params.value instanceof Date) {
            // Formatiere Datumswerte direkt im useCallback
            return params.value instanceof Date 
              ? params.value.toISOString().split('T')[0]
              : params.value;
          }
          if (typeof params.value === 'number') {
            return params.value.toLocaleString();
          }
          return String(params.value);
        }
      };
    });
  }, []);

  // Calculate chart data 
  const computedChartData = useMemo(() => {
    // Debug log to see the current dimensions and selected values
    console.log('Current dimensions for chart:', dimensions);
    console.log('Selected dimension for chart:', selectedDimension);
    console.log('Selected metric for chart:', selectedMetric);
    
    if (!selectedDimension || !selectedMetric) {
      console.warn('Missing dimension or metric selection');
      return [];
    }
    
    return aggregateData(data, selectedDimension, selectedMetric, aggregationType);
  }, [data, selectedDimension, selectedMetric, aggregationType, dimensions]);

  // Aktualisiere chartData state auf Basis von computedChartData
  useEffect(() => {
    setChartData(computedChartData);
  }, [computedChartData]);
  
  // Effect to ensure selected dimension and metric are valid
  useEffect(() => {
    if (data.length > 0) {
      // Ensure we have a valid dimension selected
      if (!selectedDimension || !dimensions.includes(selectedDimension)) {
        console.log('Setting default dimension from', dimensions);
        // Try to find a date dimension first
        const dateDimension = dimensions.find(d => 
          d.toLowerCase().includes('date') || 
          d.toLowerCase().includes('day') || 
          d.toLowerCase().includes('month')
        );
        
        if (dateDimension) {
          console.log('Found date dimension:', dateDimension);
          setSelectedDimension(dateDimension);
        } else if (dimensions.length > 0) {
          console.log('Using first available dimension:', dimensions[0]);
          setSelectedDimension(dimensions[0]);
        }
      }
      
      // Ensure we have a valid metric selected
      if (!selectedMetric || !metrics.includes(selectedMetric)) {
        console.log('Setting default metric from', metrics);
        // Try to find standard metrics
        const commonMetrics = ['impressions', 'clicks', 'cost', 'conversions'];
        const preferredMetric = metrics.find(m => 
          commonMetrics.some(common => m.toLowerCase().includes(common))
        );
        
        if (preferredMetric) {
          console.log('Found preferred metric:', preferredMetric);
          setSelectedMetric(preferredMetric);
        } else if (metrics.length > 0) {
          console.log('Using first available metric:', metrics[0]);
          setSelectedMetric(metrics[0]);
        }
      }
    }
  }, [dimensions, metrics, data, selectedDimension, selectedMetric]);
  
  // Daten verarbeiten
  const processFile = async (file: File) => {
    setIsLoading(true);
    setFileError(null);
    
    // Dateinamen speichern
    setFileName(file.name);
    
    try {
      console.log('Datei wird verarbeitet:', file.name, file.type);
      
      // Verarbeitung basierend auf dem Dateityp
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        parseExcel(arrayBuffer);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        parseJSON(text);
      } else {
        setFileError('Nicht unterstütztes Dateiformat. Bitte laden Sie eine CSV-, XLSX-, XLS- oder JSON-Datei hoch.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Datei:', error);
      setFileError(`Fehler beim Verarbeiten der Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setIsLoading(false);
    }
  };
  
  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0]);
      }
    }
  });

  // Define grid theme class based on dark mode
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const gridThemeClass = isDarkMode 
    ? 'ag-theme-alpine ag-theme-custom-dark' 
    : 'ag-theme-alpine';

  // Define the export to CSV function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportToCsv = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `${fileName.split('.')[0] || 'data'}_export.csv`
      });
    }
  }, [gridApi, fileName]);

  // Define JSON export function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportToJson = useCallback(() => {
    if (data.length > 0) {
      try {
        // Create a JSON string from the data
        const jsonStr = JSON.stringify(data, null, 2);
        
        // Create a blob with the JSON data
        const blob = new Blob([jsonStr], { type: 'application/json' });
        
        // Create a download link and trigger the download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName.split('.')[0] || 'data'}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting JSON:', error);
      }
    }
  }, [data, fileName]);

  // Define Excel export function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportToExcel = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsExcel({
        fileName: `${fileName.split('.')[0] || 'data'}_export.xlsx`
      });
    }
  }, [gridApi, fileName]);

  // Export chart as PNG
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportChartAsPng = useCallback(() => {
    const chartElement = document.getElementById('chart-container');
    if (chartElement) {
      html2canvas(chartElement).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `${fileName.split('.')[0] || 'chart'}_export.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  }, [fileName]);

  // Export as PDF
  const exportToPdf = useCallback(() => {
    // Einfachere Implementierung ohne jspdf-autotable
    const pdf = new jsPDF();
    pdf.text(`Data Export: ${fileName}`, 14, 16);
    
    if (data.length > 0) {
      // Füge eine einfache Tabelle hinzu
      const startY = 25;
      const rowHeight = 8;
      const headers = Object.keys(data[0]);
      
      // Basische Implementierung ohne autotable
      pdf.setFontSize(10);
      
      // Zeichne Header
      headers.forEach((header, i) => {
        pdf.text(header, 14 + i * 30, startY);
      });
      
      // Zeichne Daten (nur die ersten 10 Zeilen)
      const maxRows = Math.min(10, data.length);
      for (let i = 0; i < maxRows; i++) {
        const y = startY + (i + 1) * rowHeight;
        headers.forEach((header, j) => {
          const value = String(data[i][header] || '');
          // Kürze zu lange Werte
          const displayValue = value.length > 15 ? value.substring(0, 12) + '...' : value;
          pdf.text(displayValue, 14 + j * 30, y);
        });
      }
    }
    
    pdf.save(`${fileName.split('.')[0] || 'data'}_export.pdf`);
  }, [fileName, data]);

  // Callback für Visualisierungsvorschläge vom LLM
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleVisualizationSuggestion = (
    suggestedChartType: ChartType,
    suggestedDimension: string,
    suggestedMetric: string
  ) => {
    // Prüfe, ob die vorgeschlagenen Dimensionen und Metriken vorhanden sind
    const dimensionExists = dimensions.includes(suggestedDimension);
    const metricExists = metrics.includes(suggestedMetric);
    
    // Setze Chart-Typ
    setChartType(suggestedChartType);
    
    // Setze Dimension und Metrik, wenn sie existieren
    if (dimensionExists) {
      setSelectedDimension(suggestedDimension);
    }
    
    if (metricExists) {
      setSelectedMetric(suggestedMetric);
    }
    
    // Wenn neue Dimension/Metrik gesetzt wurden, triggert useEffect 
    // automatisch die Neugenerierung der Chartdaten
  };

  // Chart rendering function 
  const renderChart = () => {
    if (!selectedDimension || !selectedMetric) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p className="mb-4">No dimension or metric selected for visualization</p>
          <div className="grid grid-cols-1 gap-2">
            {dimensions.length > 0 && (
              <select 
                value={selectedDimension || ''} 
                onChange={(e) => setSelectedDimension(e.target.value)}
                className={`px-3 py-2 rounded border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="" disabled>Select dimension...</option>
                {dimensions.map(dim => (
                  <option key={dim} value={dim}>{dim}</option>
                ))}
              </select>
            )}
            {metrics.length > 0 && (
              <select 
                value={selectedMetric || ''} 
                onChange={(e) => setSelectedMetric(e.target.value)}
                className={`px-3 py-2 rounded border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="" disabled>Select metric...</option>
                {metrics.map(met => (
                  <option key={met} value={met}>{met}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      );
    }

    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p className="mb-4">No data available for visualization</p>
          <p className="text-sm mb-2">Current selection:</p>
          <ul className="text-sm mb-4">
            <li>Dimension: {selectedDimension}</li>
            <li>Metric: {selectedMetric}</li>
          </ul>
          <p className="text-sm">Try selecting different options</p>
        </div>
      );
    }

    // Colors for visualizations
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];
    
    // Chart rendering based on type
    return (
      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'bar' ? (
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#444' : '#eee'} />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70}
              tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#374151' : '#fff', 
                borderColor: isDarkMode ? '#4b5563' : '#e5e7eb', 
                color: isDarkMode ? '#e5e7eb' : '#374151' 
              }} 
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name={`${selectedMetric} (${selectedAggregation})`} 
              fill={isDarkMode ? '#60a5fa' : '#3b82f6'} 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : chartType === 'line' ? (
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#444' : '#eee'} />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70}
              tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#374151' : '#fff', 
                borderColor: isDarkMode ? '#4b5563' : '#e5e7eb', 
                color: isDarkMode ? '#e5e7eb' : '#374151' 
              }} 
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name={`${selectedMetric} (${selectedAggregation})`}
              stroke={isDarkMode ? '#60a5fa' : '#3b82f6'}
              strokeWidth={2}
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        ) : chartType === 'radar' ? (
          <RadarChart outerRadius={150} width={500} height={500} data={chartData}>
            <PolarGrid stroke={isDarkMode ? '#444' : '#eee'} />
            <PolarAngleAxis 
              dataKey="name"
              tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }}
            />
            <PolarRadiusAxis tick={{ fill: isDarkMode ? '#e5e7eb' : '#374151' }} />
            <Radar 
              name={`${selectedMetric} (${selectedAggregation})`}
              dataKey="value"
              stroke={isDarkMode ? '#60a5fa' : '#3b82f6'}
              fill={isDarkMode ? '#60a5fa' : '#3b82f6'}
              fillOpacity={0.6}
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        ) : (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} (${selectedMetric})`, selectedAggregation]}
              contentStyle={{ 
                backgroundColor: isDarkMode ? '#374151' : '#fff', 
                borderColor: isDarkMode ? '#4b5563' : '#e5e7eb', 
                color: isDarkMode ? '#e5e7eb' : '#374151' 
              }} 
            />
            <Legend wrapperStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    );
  };

  // Upload Form Section
  const renderUploadForm = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Upload Your Data</h2>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
          Upload CSV or Excel files containing your AdTech campaign data. 
          The tool will automatically detect columns and help you visualize key metrics.
        </p>
      </div>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer
          ${isDragActive 
            ? isDarkMode ? 'border-blue-500 bg-blue-500 bg-opacity-10' : 'border-blue-500 bg-blue-50' 
            : isDarkMode ? 'border-gray-600 hover:border-blue-400' : 'border-gray-300 hover:border-blue-400'
          }
        `}
      >
        <input {...getInputProps()} />
        
        {isLoading ? (
          <div className="py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Processing your file...</p>
          </div>
        ) : (
          <div>
            <svg className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Drag and drop your file here, or click to select a file
            </p>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Supported formats: CSV, XLSX, XLS
            </p>
          </div>
        )}
      </div>
      
      {fileError && (
        <div className={`mt-4 p-4 ${isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-300' : 'bg-red-50 text-red-700'} rounded-lg`}>
          <p className="font-medium">Error:</p>
          <p>{fileError}</p>
        </div>
      )}
    </div>
  );

  // Tabelle rendern (mit Debug-Ausgabe)
  const renderTableWithDebug = useCallback(() => {
    console.log('Tabelle wird gerendert mit (renderTableWithDebug):', {
      rowCount: data.length,
      columnDefsLength: columnDefs.length,
      firstRowData: data.length > 0 ? data[0] : 'Keine Daten',
      firstColDef: columnDefs.length > 0 ? columnDefs[0] : 'Keine Spaltendefinitionen',
      gridApiAvailable: !!gridApi
    });
    
    if (data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Keine Daten vorhanden. Bitte laden Sie eine Datei hoch.
          </p>
        </div>
      );
    }
    
    // Prüfe, ob die Daten korrekt strukturiert sind
    if (data.length > 0 && typeof data[0] === 'object') {
      console.log('Stichprobe der Daten:', data.slice(0, 3));
    }
    
    return (
      <div className={`h-[400px] w-full ${isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'}`}>
        <AgGridReact
          onGridReady={(params: GridReadyEvent) => {
            console.log('Grid ist bereit (onGridReady), API wird initialisiert');
            const api = params.api;
            setGridApi(api);
            // api.sizeColumnsToFit(); // Deaktiviert für besseres Debugging von Spaltenbreiten
            
            // Prüfen ob Daten sichtbar sind
            console.log('Grid initialisiert (onGridReady). Sichtbare Zeilen:', api.getDisplayedRowCount());
            if (api.getDisplayedRowCount() === 0 && data.length > 0) {
              console.warn('AG-Grid zeigt 0 Zeilen an, obwohl Daten vorhanden sind. Überprüfe columnDefs und Grid-Optionen.');
              console.log('Row Data an Grid übergeben:', data.slice(0,5));
              console.log('Column Defs an Grid übergeben:', columnDefs);
            }
          }}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true,
            flex: 1,
            minWidth: 100
          }}
          columnDefs={columnDefs}
          rowData={data}
          pagination={true}
          paginationPageSize={10}
          domLayout="autoHeight"
          getRowId={(params: { data: DataRow; index: number }) => {
            // Eindeutige Row-ID generieren
            return `row-${params.index}`;
          }}
        />
      </div>
    );
  }, [data, columnDefs, isDarkMode, gridApi]);

  // CSV-Datei parsen
  const parseCSV = (text: string) => {
    console.log('CSV-Datei wird geparst');
    Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setFileError('Keine Daten in der CSV-Datei gefunden');
          setIsLoading(false);
          return;
        }
        
        console.log('CSV-Parse-Ergebnisse:', results);
        
        // Datum-Strings in Date-Objekte umwandeln
        const processedData = results.data.map(row => {
          const processedRow: DataRow = {};
          
          // Sicherstellen, dass die Zeile ein korrektes Objekt ist
          if (row && typeof row === 'object') {
            Object.entries(row as Record<string, unknown>).forEach(([key, value]) => {
              // Leere Werte überspringen
              if (value === undefined || value === null || value === '') {
                processedRow[key] = '';
                return;
              }
              
              // Prüfen, ob es sich um ein Datumsfeld handeln könnte
              const lowerKey = key.toLowerCase();
              const mightBeDate = 
                lowerKey.includes('date') || 
                lowerKey.includes('day') || 
                lowerKey.includes('month') ||
                lowerKey.includes('zeit') ||  // Deutsch
                lowerKey.includes('time');
              
              if (mightBeDate && typeof value === 'string') {
                try {
                  const dateValue = new Date(value);
                  if (!isNaN(dateValue.getTime())) {
                    console.log(`Feld ${key} mit Wert ${value} wird in Date-Objekt konvertiert:`, dateValue);
                    processedRow[key] = dateValue;
                    return;
                  }
                } catch (e) {
                  console.log(`Fehler beim Parsen des Datums aus ${key}:`, value);
                }
              }
              
              // Versuche, numerische Strings in Zahlen umzuwandeln
              if (typeof value === 'string' && !isNaN(Number(value))) {
                processedRow[key] = Number(value);
              } else {
                processedRow[key] = value;
              }
            });
          }
          
          return processedRow;
        });
        
        console.log('Verarbeitete CSV-Daten:', processedData);
        
        const nonEmptyColumns = identifyNonEmptyColumns(processedData);
        console.log('Erkannte nicht-leere Spalten:', nonEmptyColumns);
        
        // Identifiziere Dimensionen und Metriken aus den Daten
        const { dimensions: detectedDimensions, metrics: detectedMetrics } = identifyColumnTypes(processedData);
        console.log('Erkannte Dimensionen:', detectedDimensions);
        console.log('Erkannte Metriken:', detectedMetrics);
        
        setData(processedData);
        setOriginalData(processedData);
        setColumnDefs(generateColumnDefsWithDebug(processedData, nonEmptyColumns));
        setDimensions(detectedDimensions);
        setMetrics(detectedMetrics);
        setIsLoading(false);
      },
      error: (error: Error) => {
        console.error('CSV-Parser-Fehler:', error);
        setFileError(`Fehler beim Parsen der CSV-Datei: ${error.message}`);
        setIsLoading(false);
      }
    });
  };
  
  // Excel-Datei parsen
  const parseExcel = (arrayBuffer: ArrayBuffer) => {
    console.log('Excel-Datei wird geparst');
    
    // Verwende cellDates: true, um Daten automatisch zu konvertieren
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    
    if (workbook.SheetNames.length === 0) {
      setFileError('Keine Arbeitsblätter in der Excel-Datei gefunden');
      setIsLoading(false);
      return;
    }
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Konvertiere in JSON mit header-Option für Spaltennamen
    const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: "A" });
    
    if (rawJson.length <= 1) { // Nur Überschriftenzeile oder leer
      setFileError('Keine Daten in der Excel-Datei gefunden');
      setIsLoading(false);
      return;
    }
    
    console.log('Excel-Rohdaten:', rawJson);
    
    // Extrahiere Überschriften aus der ersten Zeile
    const firstRow = rawJson[0] as Record<string, string>;
    const headers = Object.values(firstRow);
    
    // Verarbeite die Daten ab der zweiten Zeile
    const processedData = rawJson.slice(1).map((row: any) => {
      const processedRow: DataRow = {};
      
      // Typsicherheitsüberprüfung
      if (typeof row === 'object' && row !== null) {
        const typedRow = row as Record<string, any>;
        // Verwende for...in-Schleife mit hasOwnProperty für sichere Iteration
        for (const colIndex in typedRow) {
          if (Object.prototype.hasOwnProperty.call(typedRow, colIndex)) {
            const value = typedRow[colIndex];
            const headerIndex = Object.keys(firstRow || {}).indexOf(colIndex);
            const header = headers[headerIndex] || `Spalte ${colIndex}`;
            
            // Erkenne und konvertiere Datumswerte
            if (value instanceof Date) {
              processedRow[header] = value;
            } else if (typeof value === 'string' && isDateString(value)) {
              processedRow[header] = new Date(value);
            } else {
              processedRow[header] = value;
            }
          }
        }
      }
      
      return processedRow;
    });
    
    console.log('Verarbeitete Excel-Daten:', processedData);
    
    const nonEmptyColumns = identifyNonEmptyColumns(processedData);
    console.log('Erkannte nicht-leere Spalten:', nonEmptyColumns);
    
    // Identifiziere Dimensionen und Metriken aus den Daten
    const { dimensions: detectedDimensions, metrics: detectedMetrics } = identifyColumnTypes(processedData);
    console.log('Erkannte Dimensionen:', detectedDimensions);
    console.log('Erkannte Metriken:', detectedMetrics);
    
    setData(processedData);
    setOriginalData(processedData);
    setColumnDefs(generateColumnDefsWithDebug(processedData, nonEmptyColumns));
    setDimensions(detectedDimensions);
    setMetrics(detectedMetrics);
    setIsLoading(false);
  };
  
  // JSON-Datei parsen
  const parseJSON = (text: string) => {
    console.log('JSON-Datei wird geparst');
    
    try {
      const jsonData = JSON.parse(text);
      
      // Behandle Array von Objekten
      if (Array.isArray(jsonData)) {
        // Konvertiere Datumsstrings in Date-Objekte
        const processedData = jsonData.map((item) => {
          // Typsicherheitsüberprüfung
          if (typeof item !== 'object' || item === null) {
            return {} as DataRow;
          }
          
          const row: DataRow = {};
          
          // Typsichere Iteration mit korrekten Überprüfungen
          const typedItem = item as Record<string, unknown>;
          for (const key in typedItem) {
            if (Object.prototype.hasOwnProperty.call(typedItem, key)) {
              const value = typedItem[key];
              if (typeof value === 'string' && isDateString(value)) {
                row[key] = new Date(value);
              } else {
                row[key] = value;
              }
            }
          }
          
          return row;
        });
        
        console.log('Verarbeitete JSON-Daten:', processedData);
        
        const nonEmptyColumns = identifyNonEmptyColumns(processedData);
        
        // Identifiziere Dimensionen und Metriken aus den Daten
        const { dimensions: detectedDimensions, metrics: detectedMetrics } = identifyColumnTypes(processedData);
        console.log('Erkannte Dimensionen:', detectedDimensions);
        console.log('Erkannte Metriken:', detectedMetrics);
        
        setData(processedData);
        setOriginalData(processedData);
        setColumnDefs(generateColumnDefsWithDebug(processedData, nonEmptyColumns));
        setDimensions(detectedDimensions);
        setMetrics(detectedMetrics);
        setIsLoading(false);
      } else if (typeof jsonData === 'object' && jsonData !== null) {
        // Behandle einzelnes Objekt - konvertiere in Array mit einem Element
        const processedData = [jsonData].map((item) => {
          const row: DataRow = {};
          
          // Stelle sicher, dass das Element ein Objekt ist, bevor du iterierst
          if (typeof item === 'object' && item !== null) {
            const typedItem = item as Record<string, unknown>;
            // Verwende for...in-Schleife mit hasOwnProperty für Typsicherheit
            for (const key in typedItem) {
              if (Object.prototype.hasOwnProperty.call(typedItem, key)) {
                const value = typedItem[key];
                if (typeof value === 'string' && isDateString(value)) {
                  row[key] = new Date(value);
                } else {
                  row[key] = value;
                }
              }
            }
          }
          
          return row;
        });
        
        console.log('Verarbeitete JSON-Daten (einzelnes Objekt):', processedData);
        
        const nonEmptyColumns = identifyNonEmptyColumns(processedData);
        
        // Identifiziere Dimensionen und Metriken aus den Daten
        const { dimensions: detectedDimensions, metrics: detectedMetrics } = identifyColumnTypes(processedData);
        console.log('Erkannte Dimensionen:', detectedDimensions);
        console.log('Erkannte Metriken:', detectedMetrics);
        
        setData(processedData);
        setOriginalData(processedData);
        setColumnDefs(generateColumnDefsWithDebug(processedData, nonEmptyColumns));
        setDimensions(detectedDimensions);
        setMetrics(detectedMetrics);
        setIsLoading(false);
      } else {
        setFileError('Ungültiges JSON-Format: Es wird ein Array von Objekten oder ein einzelnes Objekt erwartet');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('JSON-Parser-Fehler:', error);
      setFileError(`Fehler beim Parsen von JSON: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <SEO
        title="Data Visualizer | CSV und Excel Analyse Tool"
        description="Laden Sie CSV oder Excel Dateien hoch und analysieren Sie Ihre Daten mit interaktiven Visualisierungen und KI-gestützten Erkenntnissen."
        canonical="https://www.adtech-toolbox.com/apps/data-visualizer"
      />
      
      <ApplicationHeader 
        isDarkMode={isDarkMode} 
        toggleDarkMode={() => {}} 
        title="Data Visualizer"
        subtitle="Visualisiere und analysiere CSV, XLSX und JSON Daten mit KI-Unterstützung"
      />
      
      <div className="ml-28 px-10 py-6 mt-24">
        <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {data.length === 0 ? (
            renderUploadForm()
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                <h2 className="text-xl font-bold mb-2 md:mb-0">
                  {fileName || 'Datenanalyse'}
                </h2>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 rounded text-sm ${
                      isDarkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-red-500 hover:bg-red-600'
                    } text-white`}
                    onClick={() => setData([])}
                  >
                    Zurücksetzen
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${
                      isDarkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                    onClick={exportToPdf}
                  >
                    Als PDF speichern
                  </button>
                </div>
              </div>
              
              {/* KI-Dashboard ohne Tabs */}
              <DataVisualizerPlugin
                data={data}
                dimensions={dimensions}
                metrics={metrics}
                selectedDimension={selectedDimension}
                selectedMetric={selectedMetric}
                chartData={chartData}
                chartType={chartType}
                onVisualizationSuggestion={handleVisualizationSuggestion}
                renderChart={renderChart}
                renderTable={renderTableWithDebug}
                isDarkMode={isDarkMode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataVisualizer; 