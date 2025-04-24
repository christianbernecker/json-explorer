import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi } from 'ag-grid-community';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SEO } from './seo';

// Import AG-Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
// We'll handle dark mode without importing the dark theme CSS
// and use the provided classes instead

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

// This function is used to identify dimensions and metrics columns in the data
const identifyColumnTypes = (data: DataRow[]): { dimensions: string[], metrics: string[] } => {
  if (data.length === 0) return { dimensions: [], metrics: [] };
  
  const firstRow = data[0];
  const dimensions: string[] = [];
  const metrics: string[] = [];
  
  Object.entries(firstRow).forEach(([key, value]) => {
    // Check if the column name is in the known dimensions list (case-insensitive)
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
    
    // Check if values are dates
    const sampleValues = data.slice(0, Math.min(5, data.length)).map(row => row[key]);
    const hasPotentialDateValues = sampleValues.some(val => 
      typeof val === 'string' && 
      (
        /^\d{4}-\d{2}-\d{2}/.test(val) || // ISO date format
        /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(val) // Common date formats
      )
    );
    
    if (hasPotentialDateValues) {
      dimensions.push(key);
      return;
    }
    
    // Use the original numeric check as fallback
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
 * Checks if a string represents a valid date
 */
const isDateString = (value: string): boolean => {
  // Skip empty values
  if (!value) return false;
  
  // Check for common date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}|^\d{2}[./-]\d{2}[./-]\d{4}|^\d{2}[./-]\d{2}[./-]\d{2}/;
  if (!dateRegex.test(value)) return false;
  
  // Try to parse as date
  const date = new Date(value);
  return !isNaN(date.getTime());
};

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
const generateColumnDefs = (data: DataRow[], nonEmptyColumns: string[]): ColDef[] => {
  if (data.length === 0 || nonEmptyColumns.length === 0) return [];
  
  const columnDefs: ColDef[] = nonEmptyColumns.map(field => {
    // Determine column type for appropriate filtering
    const sampleValues = data
      .slice(0, 10)
      .map(row => row[field])
      .filter(val => val !== undefined && val !== null && val !== '');
    
    const hasDateValue = sampleValues.some(val => val instanceof Date);
    const hasNumericValue = sampleValues.some(val => typeof val === 'number');
    
    let filterType: string;
    
    if (hasDateValue) {
      filterType = 'agDateColumnFilter';
    } else if (hasNumericValue) {
      filterType = 'agNumberColumnFilter';
    } else {
      filterType = 'agTextColumnFilter';
    }
    
    return {
      field,
      headerName: field,
      sortable: true,
      filter: filterType,
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

// Main Component
function DataVisualizer({ isDarkMode }: DataVisualizerProps) {
  // State for file upload
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Data states
  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<string[]>([]);
  /* eslint-enable @typescript-eslint/no-unused-vars */
  
  // UI states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'data' | 'visualize' | 'analytics'>('dashboard');
  
  // Visualization states
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [aggregationType, setAggregationType] = useState<'sum' | 'average'>('sum');

  // AG-Grid states
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  
  // Calculate chart data 
  const chartData = useMemo(() => {
    // Debug log to see the current dimensions and selected values
    console.log('Current dimensions:', dimensions);
    console.log('Selected dimension:', selectedDimension);
    console.log('Selected metric:', selectedMetric);
    
    if (!selectedDimension || !selectedMetric) {
      console.warn('Missing dimension or metric selection');
      return [];
    }
    
    return aggregateData(rawData, selectedDimension, selectedMetric, aggregationType);
  }, [rawData, selectedDimension, selectedMetric, aggregationType, dimensions]);
  
  // Effect to ensure selected dimension and metric are valid
  useEffect(() => {
    if (rawData.length > 0) {
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
  }, [dimensions, metrics, rawData, selectedDimension, selectedMetric]);
  
  // Process the uploaded file
  const processFile = async (file: File) => {
    setIsLoading(true);
    setFileError(null);
    setFileName(file.name);
    
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'csv') {
        const text = await file.text();
        Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data.length === 0) {
              setFileError('No data found in the file');
              setIsLoading(false);
              return;
            }
            
            console.log('CSV parse results:', results);
            
            // Convert date strings to Date objects for CSV
            const processedData = results.data.map(row => {
              const processedRow: DataRow = {};
              
              // Ensure row is a proper object before using Object.entries
              if (row && typeof row === 'object') {
                Object.entries(row as Record<string, unknown>).forEach(([key, value]) => {
                  // Skip empty values
                  if (value === undefined || value === null || value === '') {
                    processedRow[key] = '';
                    return;
                  }
                  
                  // Check if this might be a date field
                  const lowerKey = key.toLowerCase();
                  const mightBeDate = 
                    lowerKey.includes('date') || 
                    lowerKey.includes('day') || 
                    lowerKey.includes('month') ||
                    lowerKey.includes('zeit') ||  // German
                    lowerKey.includes('time');
                  
                  if (mightBeDate && typeof value === 'string') {
                    try {
                      const dateValue = new Date(value);
                      if (!isNaN(dateValue.getTime())) {
                        console.log(`Converting field ${key} with value ${value} to Date object:`, dateValue);
                        processedRow[key] = dateValue;
                        return;
                      }
                    } catch (e) {
                      console.log(`Failed to parse date from ${key}:`, value);
                    }
                  }
                  
                  // Try to convert numeric strings to numbers
                  if (typeof value === 'string' && !isNaN(Number(value))) {
                    processedRow[key] = Number(value);
                  } else {
                    processedRow[key] = value;
                  }
                });
              }
              
              return processedRow;
            });
            
            const nonEmptyColumns = identifyNonEmptyColumns(processedData);
            console.log('Detected non-empty columns:', nonEmptyColumns);
            
            // Identify dimensions and metrics from the data
            const { dimensions: detectedDimensions, metrics: detectedMetrics } = identifyColumnTypes(processedData);
            console.log('Detected dimensions:', detectedDimensions);
            console.log('Detected metrics:', detectedMetrics);
            
            setRawData(processedData);
            setColumnDefs(generateColumnDefs(processedData, nonEmptyColumns));
            setDimensions(detectedDimensions);
            setMetrics(detectedMetrics);
            setIsLoading(false);
          },
          error: (error: Error) => {
            console.error('CSV parsing error:', error);
            setFileError(`Error parsing CSV: ${error.message}`);
            setIsLoading(false);
          }
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        
        // Use cellDates: true to automatically convert dates
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
        
        if (workbook.SheetNames.length === 0) {
          setFileError('No sheets found in the workbook');
          setIsLoading(false);
          return;
        }
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header option for column names
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: "A" });
        
        if (rawJson.length <= 1) {  // Only has header row or empty
          setFileError('No data found in the Excel file');
          setIsLoading(false);
          return;
        }
        
        console.log('Excel raw data:', rawJson);
        
        // Extract headers from the first row
        const firstRow = rawJson[0] as Record<string, string>;
        const headers = Object.values(firstRow);
        
        // Process the data starting from the second row
        const processedData = rawJson.slice(1).map((row) => {
          const processedRow: DataRow = {};
          
          // Type safety check
          if (typeof row === 'object' && row !== null) {
            const typedRow = row as Record<string, any>;
            // Use for...in loop with hasOwnProperty for safe iteration
            for (const colIndex in typedRow) {
              if (Object.prototype.hasOwnProperty.call(typedRow, colIndex)) {
                const value = typedRow[colIndex];
                const headerIndex = Object.keys(firstRow || {}).indexOf(colIndex);
                const header = headers[headerIndex] || `Column ${colIndex}`;
                
                // Detect and convert date values
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
        
        console.log('Processed Excel data:', processedData);
        
        const nonEmptyColumns = identifyNonEmptyColumns(processedData);
        console.log('Detected non-empty columns:', nonEmptyColumns);
        
        // Identify dimensions and metrics from the data
        const { dimensions: detectedDimensions, metrics: detectedMetrics } = identifyColumnTypes(processedData);
        console.log('Detected dimensions:', detectedDimensions);
        console.log('Detected metrics:', detectedMetrics);
        
        setRawData(processedData);
        setColumnDefs(generateColumnDefs(processedData, nonEmptyColumns));
        setDimensions(detectedDimensions);
        setMetrics(detectedMetrics);
        setIsLoading(false);
        
      } else if (extension === 'json') {
        const text = await file.text();
        
        try {
          const jsonData = JSON.parse(text);
          
          // Handle array of objects
          if (Array.isArray(jsonData)) {
            // Convert date strings to Date objects
            const processedData = jsonData.map((item) => {
              // Type safety check
              if (typeof item !== 'object' || item === null) {
                return {} as DataRow;
              }
              
              const row: DataRow = {};
              
              // Type-safe iteration with proper checks
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
            
            const nonEmptyColumns = identifyNonEmptyColumns(processedData);
            
            // Identify dimensions and metrics from the data
            const { dimensions: detectedDimensions, metrics: detectedMetrics } = identifyColumnTypes(processedData);
            console.log('Detected dimensions:', detectedDimensions);
            console.log('Detected metrics:', detectedMetrics);
            
            setRawData(processedData);
            setColumnDefs(generateColumnDefs(processedData, nonEmptyColumns));
            setDimensions(detectedDimensions);
            setMetrics(detectedMetrics);
            setIsLoading(false);
          } else if (typeof jsonData === 'object' && jsonData !== null) {
            // Handle single object - convert to array with one item
            const processedData = [jsonData].map((item) => {
              const row: DataRow = {};
              
              // Make sure item is an object before iterating
              if (typeof item === 'object' && item !== null) {
                const typedItem = item as Record<string, unknown>;
                // Use for...in loop with hasOwnProperty for type safety
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
            
            const nonEmptyColumns = identifyNonEmptyColumns(processedData);
            
            // Identify dimensions and metrics from the data
            const { dimensions: detectedDimensions, metrics: detectedMetrics } = identifyColumnTypes(processedData);
            console.log('Detected dimensions:', detectedDimensions);
            console.log('Detected metrics:', detectedMetrics);
            
            setRawData(processedData);
            setColumnDefs(generateColumnDefs(processedData, nonEmptyColumns));
            setDimensions(detectedDimensions);
            setMetrics(detectedMetrics);
            setIsLoading(false);
          } else {
            setFileError('Invalid JSON format: expected an array of objects or a single object');
            setIsLoading(false);
          }
        } catch (error) {
          console.error('JSON parsing error:', error);
          setFileError(`Error parsing JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      } else {
        setFileError(`Unsupported file format: ${extension}. Please upload a CSV, Excel, or JSON file.`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('File processing error:', error);
      setFileError(`Error processing the file: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoading(false);
    }
  };
  
  // Helper function to format date values consistently
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const formatDateValue = (value: any): string => {
    if (value instanceof Date) {
      // Convert date object to string (YYYY-MM-DD)
      return value.toISOString().split('T')[0];
    } else if (typeof value === 'string') {
      // Check if string represents a date
      const datePattern = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/;
      if (datePattern.test(value) || value.includes('-')) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          // Failed to parse as date, return original
        }
      }
    }
    // Return as string for any other case
    return String(value);
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
  
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
  const gridThemeClass = isDarkMode 
    ? 'ag-theme-alpine ag-theme-custom-dark' 
    : 'ag-theme-alpine';

  // Define the export to CSV function
  const exportToCsv = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `${fileName.split('.')[0] || 'data'}_export.csv`
      });
    }
  }, [gridApi, fileName]);

  // Define JSON export function
  const exportToJson = useCallback(() => {
    if (rawData.length > 0) {
      try {
        // Create a JSON string from the data
        const jsonStr = JSON.stringify(rawData, null, 2);
        
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
  }, [rawData, fileName]);

  // Define Excel export function
  const exportToExcel = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsExcel({
        fileName: `${fileName.split('.')[0] || 'data'}_export.xlsx`
      });
    }
  }, [gridApi, fileName]);

  // AG-Grid onGridReady handler
  const onGridReady = useCallback((params: { api: GridApi }) => {
    setGridApi(params.api);
  }, []);

  // Define tabs for navigation
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', disabled: rawData.length === 0 },
    { id: 'data', label: 'Data Table', disabled: rawData.length === 0 },
    { id: 'visualize', label: 'Visualize', disabled: rawData.length === 0 },
    { id: 'analytics', label: 'Advanced Analytics', disabled: rawData.length === 0 }
  ];

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
              name={`${selectedMetric} (${aggregationType})`} 
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
              name={`${selectedMetric} (${aggregationType})`}
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
              name={`${selectedMetric} (${aggregationType})`}
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
              formatter={(value) => [`${value} (${selectedMetric})`, aggregationType]}
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

  return (
    <div className={`w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SEO 
        canonical="https://www.adtech-toolbox.com/apps/data-visualizer"
        title="Data Visualizer | AdTech Toolbox"
        description="Upload, analyze and visualize your AdTech reporting data with interactive dashboards, charts and tables."
      />
      
      {/* Full width container */}
      <div className={`px-4 py-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* No data state - show uploader */}
        {rawData.length === 0 ? (
          <div className={`max-w-4xl mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
            <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Data Visualizer
            </h1>
            {renderUploadForm()}
            
            {/* Example Data Preview */}
            <div className="mt-12">
              <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Example Data Format
              </h3>
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Date</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Campaign</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Ad Format</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Impressions</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Clicks</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Conversions</th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Spend</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                    <tr>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>2023-04-01</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Summer Sale</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Display</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>12500</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>250</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>15</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>750.00</td>
                    </tr>
                    <tr>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>2023-04-01</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Product Launch</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Video</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>8000</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>320</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>12</td>
                      <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>620.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                The tool will automatically identify dimensions (non-numeric columns like Campaign, Ad Format) 
                and metrics (numeric columns like Impressions, Clicks) for visualization.
              </p>
            </div>
          </div>
        ) : (
          // Data loaded state - show full dashboard 
          <div className="flex flex-col">
            {/* Header with file info and tabs */}
            <div className={`w-full mb-4 px-4 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div>
                  <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Data Visualizer
                  </h1>
                  <div className={`flex flex-wrap gap-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span><strong>File:</strong> {fileName}</span>
                    <span><strong>Rows:</strong> {rawData.length}</span>
                    <span><strong>Columns:</strong> {columnDefs.length}</span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex gap-2">
                  <button 
                    onClick={exportToCsv} 
                    className={`px-3 py-1.5 rounded text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Export CSV
                  </button>
                  <button 
                    onClick={exportToJson} 
                    className={`px-3 py-1.5 rounded text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Export JSON
                  </button>
                  <button 
                    onClick={exportToExcel} 
                    className={`px-3 py-1.5 rounded text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Export Excel
                  </button>
                  <button 
                    onClick={() => setRawData([])} 
                    className={`px-3 py-1.5 rounded text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Upload New Data
                  </button>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                      activeTab === tab.id
                        ? isDarkMode
                          ? 'border-b-2 border-blue-400 text-blue-400'
                          : 'border-b-2 border-blue-600 text-blue-600'
                        : tab.disabled
                          ? isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                          : isDarkMode
                            ? 'text-gray-300 hover:text-gray-100'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                    disabled={tab.disabled}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Dashboard Content */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* KPI Cards */}
                <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {metrics.slice(0, 4).map((metric, index) => {
                    const sum = rawData.reduce((acc, row) => acc + (Number(row[metric]) || 0), 0);
                    const avg = sum / rawData.length;
                    const formatValue = (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(1);
                    
                    return (
                      <div 
                        key={metric}
                        className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {metric}
                        </div>
                        <div className="flex items-end justify-between">
                          <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {formatValue(sum)}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Avg: {formatValue(avg)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Main Charts Section */}
                <div className="md:col-span-8">
                  <div className={`p-4 rounded-lg shadow mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {selectedMetric} by {selectedDimension}
                      </h3>
                      <div className="flex gap-2">
                        <select
                          value={chartType}
                          onChange={(e) => setChartType(e.target.value as ChartType)}
                          className={`px-2 py-1 text-sm rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          <option value="bar">Bar Chart</option>
                          <option value="line">Line Chart</option>
                          <option value="pie">Pie Chart</option>
                          <option value="radar">Radar Chart</option>
                        </select>
                      </div>
                    </div>
                    {renderChart()}
                  </div>
                </div>
                
                {/* Sidebar Controls and Stats */}
                <div className="md:col-span-4">
                  {/* Chart Controls */}
                  <div className={`p-4 rounded-lg shadow mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Chart Settings
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Dimension
                        </label>
                        <select
                          value={selectedDimension}
                          onChange={(e) => setSelectedDimension(e.target.value)}
                          className={`w-full px-3 py-2 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {dimensions.length === 0 ? (
                            <option value="">No dimensions available</option>
                          ) : (
                            dimensions.map(dim => (
                              <option key={dim} value={dim}>{dim}</option>
                            ))
                          )}
                        </select>
                        {!selectedDimension && dimensions.length > 0 && (
                          <p className="text-red-500 text-xs mt-1">
                            Please select a dimension
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Metric
                        </label>
                        <select
                          value={selectedMetric}
                          onChange={(e) => setSelectedMetric(e.target.value)}
                          className={`w-full px-3 py-2 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {metrics.map(met => (
                            <option key={met} value={met}>{met}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Aggregation
                        </label>
                        <select
                          value={aggregationType}
                          onChange={(e) => setAggregationType(e.target.value as 'sum' | 'average')}
                          className={`w-full px-3 py-2 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          <option value="sum">Sum</option>
                          <option value="average">Average</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Summary */}
                  <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Data Summary
                    </h3>
                    <div className="space-y-2">
                      {metrics.slice(0, 3).map(metric => {
                        const values = rawData.map(row => Number(row[metric]) || 0);
                        const sum = values.reduce((a, b) => a + b, 0);
                        const avg = sum / values.length;
                        const max = Math.max(...values);
                        const min = Math.min(...values);
                        
                        return (
                          <div key={metric} className="mb-3">
                            <div className={`font-medium mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              {metric}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sum:</span>{' '}
                                <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                                  {sum.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg:</span>{' '}
                                <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                                  {avg.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                </span>
                              </div>
                              <div>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Max:</span>{' '}
                                <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                                  {max.toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Min:</span>{' '}
                                <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                                  {min.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Data Table */}
                <div className="md:col-span-12">
                  <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Data Preview
                    </h3>
                    <div 
                      className={`w-full h-[300px] ${gridThemeClass}`}
                    >
                      <AgGridReact
                        rowData={rawData}
                        columnDefs={columnDefs}
                        onGridReady={onGridReady}
                        pagination={true}
                        paginationPageSize={10}
                        defaultColDef={{
                          flex: 1,
                          minWidth: 100,
                          sortable: true, 
                          filter: true
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Data Table Tab */}
            {activeTab === 'data' && (
              <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Data Table
                  </h3>
                  <button 
                    onClick={exportToCsv} 
                    className={`px-3 py-1.5 rounded text-sm font-medium ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Export CSV
                  </button>
                </div>
                <div 
                  className={`w-full h-[700px] ${gridThemeClass}`}
                >
                  <AgGridReact
                    rowData={rawData}
                    columnDefs={columnDefs}
                    onGridReady={onGridReady}
                    pagination={true}
                    paginationPageSize={25}
                    defaultColDef={{
                      flex: 1,
                      minWidth: 100,
                      sortable: true, 
                      filter: true,
                      resizable: true,
                      floatingFilter: true
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Visualization Tab */}
            {activeTab === 'visualize' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Chart Settings */}
                <div className="md:col-span-3">
                  <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Visualization Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Chart Type
                        </label>
                        <select
                          value={chartType}
                          onChange={(e) => setChartType(e.target.value as ChartType)}
                          className={`w-full px-3 py-2 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          <option value="bar">Bar Chart</option>
                          <option value="line">Line Chart</option>
                          <option value="pie">Pie Chart</option>
                          <option value="radar">Radar Chart</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Dimension (X-Axis)
                        </label>
                        <select
                          value={selectedDimension}
                          onChange={(e) => setSelectedDimension(e.target.value)}
                          className={`w-full px-3 py-2 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {dimensions.map(dim => (
                            <option key={dim} value={dim}>{dim}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Metric (Y-Axis)
                        </label>
                        <select
                          value={selectedMetric}
                          onChange={(e) => setSelectedMetric(e.target.value)}
                          className={`w-full px-3 py-2 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {metrics.map(met => (
                            <option key={met} value={met}>{met}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Aggregation Method
                        </label>
                        <select
                          value={aggregationType}
                          onChange={(e) => setAggregationType(e.target.value as 'sum' | 'average')}
                          className={`w-full px-3 py-2 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          <option value="sum">Sum</option>
                          <option value="average">Average</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Chart Area */}
                <div className="md:col-span-9">
                  <div className={`p-4 rounded-lg shadow h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      {selectedMetric} by {selectedDimension} ({aggregationType})
                    </h3>
                    <div className="h-[600px]">
                      {renderChart()}
                    </div>
                  </div>
                </div>
                
                {/* Data Preview in Visualize Tab */}
                <div className="md:col-span-12">
                  <div className={`p-4 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      Aggregated Data
                    </h3>
                    <div className="overflow-x-auto">
                      <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        <thead className={isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                          <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              {selectedDimension}
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              {selectedMetric} ({aggregationType})
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {chartData.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? isDarkMode ? 'bg-gray-800' : 'bg-white' : isDarkMode ? 'bg-gray-850' : 'bg-gray-50'}>
                              <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.name}
                              </td>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {item.value.toLocaleString(undefined, {
                                  maximumFractionDigits: 2
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className={`p-6 rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="text-center py-8">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-16 w-16 mx-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                    />
                  </svg>
                  <h2 className={`text-xl font-semibold mt-4 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Advanced Analytics Coming Soon
                  </h2>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xl mx-auto`}>
                    In future updates, this section will include advanced statistical analysis, 
                    descriptive statistics, correlation matrices, and more insights from your data.
                  </p>
                  
                  {/* Preview of upcoming analytics */}
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Correlation Analysis
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Discover relationships between different metrics to identify which factors influence others.
                      </p>
                    </div>
                    
                    <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Trend Detection
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Automatically identify trends and patterns in your time-series data.
                      </p>
                    </div>
                    
                    <div className={`p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Performance Forecasting
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Use machine learning to predict future performance based on historical data patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DataVisualizer; 