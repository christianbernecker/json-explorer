import React, { useState, useCallback, useMemo } from 'react';
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

const identifyColumnTypes = (data: DataRow[]): { dimensions: string[], metrics: string[] } => {
  if (data.length === 0) return { dimensions: [], metrics: [] };
  
  const firstRow = data[0];
  const dimensions: string[] = [];
  const metrics: string[] = [];
  
  Object.entries(firstRow).forEach(([key, value]) => {
    // Check if more than 80% of values in this column are numeric
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
  if (!data.length || !dimension || !metric) return [];
  
  const aggregated: { [key: string]: { sum: number, count: number } } = {};
  
  data.forEach(row => {
    const dimValue = String(row[dimension] || 'Unknown');
    const metricValue = Number(row[metric] || 0);
    
    if (!aggregated[dimValue]) {
      aggregated[dimValue] = { sum: 0, count: 0 };
    }
    
    if (!isNaN(metricValue)) {
      aggregated[dimValue].sum += metricValue;
      aggregated[dimValue].count += 1;
    }
  });
  
  return Object.entries(aggregated).map(([name, { sum, count }]) => ({
    name,
    value: aggregationType === 'sum' ? sum : (count > 0 ? sum / count : 0)
  }));
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
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<string[]>([]);
  
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
    return aggregateData(rawData, selectedDimension, selectedMetric, aggregationType);
  }, [rawData, selectedDimension, selectedMetric, aggregationType]);
  
  // Process the uploaded file
  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setFileError(null);
    setFileName(file.name);
    
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let data: DataRow[] = [];
      
      if (fileExtension === 'csv') {
        // Parse CSV file
        const parseResult = await new Promise<Papa.ParseResult<DataRow>>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: resolve,
            error: reject
          });
        });
        
        data = parseResult.data;
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
      
      // Process data
      if (data.length > 0) {
        setRawData(data);
        
        // Create column definitions for AG-Grid
        const columns = Object.keys(data[0]).map(field => ({
          field,
          headerName: field,
          sortable: true,
          filter: true,
          resizable: true
        }));
        
        setColumnDefs(columns);
        
        // Identify dimensions and metrics
        const { dimensions: dims, metrics: mets } = identifyColumnTypes(data);
        setDimensions(dims);
        setMetrics(mets);
        
        // Set default selections if available
        if (dims.length > 0) setSelectedDimension(dims[0]);
        if (mets.length > 0) setSelectedMetric(mets[0]);
        
        // Switch to dashboard view with visualizations
        setActiveTab('dashboard');
      } else {
        throw new Error('No data found in the file');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setFileError(error instanceof Error ? error.message : 'Unknown error processing file');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
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
  const onGridReady = useCallback((params: any) => {
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
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          No data available for visualization
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
                          {dimensions.map(dim => (
                            <option key={dim} value={dim}>{dim}</option>
                          ))}
                        </select>
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