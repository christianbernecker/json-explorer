import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi } from 'ag-grid-community';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer
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

type ChartType = 'bar' | 'line' | 'pie';

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
  const [activeTab, setActiveTab] = useState<'import' | 'table' | 'visualize' | 'analytics'>('import');
  
  // Visualization states
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [aggregationType, setAggregationType] = useState<'sum' | 'average'>('sum');

  // AG-Grid states
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  
  // Calculate chart data outside of the renderChart function
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
        
        // Switch to data view with visualizations
        setActiveTab('table');
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
  
  // Add the function for rendering charts with dark mode support
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          No data available for visualization
        </div>
      );
    }

    // Colors for pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];
    
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

  // AG-Grid onGridReady handler
  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
  }, []);

  // Define tabs for navigation
  const tabs = [
    { id: 'import', label: 'Import Data', disabled: false },
    { id: 'table', label: 'Data Table', disabled: rawData.length === 0 },
    { id: 'visualize', label: 'Visualize', disabled: rawData.length === 0 },
    { id: 'analytics', label: 'Advanced Analytics', disabled: rawData.length === 0 }
  ];

  // Render functions
  const renderDataView = () => {
    if (rawData.length === 0) {
      return null;
    }

    // Create the layout with side-by-side data table and visualization
    return (
      <div className="flex flex-col lg:flex-row w-full gap-4">
        {/* Data Table Section - Take half width on larger screens */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Data Table</h3>
            <div className="flex gap-2">
              {/* Table controls */}
              <button 
                onClick={exportToCsv} 
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                Export CSV
              </button>
            </div>
          </div>
          
          {/* AG-Grid with dark mode support */}
          <div 
            className={`w-full h-[500px] ${gridThemeClass}`}
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
        
        {/* Visualization Section - Take half width on larger screens */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Visualization</h3>
            <div className="flex gap-2">
              {/* Chart type selector */}
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="px-3 py-1 text-sm border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>
          </div>
          
          {/* Chart configuration */}
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Dimension
                </label>
                <select
                  value={selectedDimension}
                  onChange={(e) => setSelectedDimension(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                >
                  {dimensions.map(dim => (
                    <option key={dim} value={dim}>{dim}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Metric
                </label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                >
                  {metrics.map(met => (
                    <option key={met} value={met}>{met}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Aggregation
                </label>
                <select
                  value={aggregationType}
                  onChange={(e) => setAggregationType(e.target.value as 'sum' | 'average')}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                >
                  <option value="sum">Sum</option>
                  <option value="average">Average</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Chart display */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            {renderChart()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <SEO 
        canonical="https://www.adtech-toolbox.com/apps/data-visualizer"
        title="Data Visualizer | AdTech Toolbox"
        description="Upload, analyze and visualize your CSV or Excel data with interactive charts and tables. Perfect for AdTech reporting data."
      />
      
      <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Header and Controls */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Data Visualizer</h1>
          </div>
          
          {/* Basic Information */}
          {rawData.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <span className="font-medium">File:</span> {fileName}
              </div>
              <div>
                <span className="font-medium">Rows:</span> {rawData.length}
              </div>
              <div>
                <span className="font-medium">Columns:</span> {columnDefs.length}
              </div>
            </div>
          )}
        </div>
        
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`py-3 px-6 focus:outline-none font-medium ${
                  activeTab === tab.id
                    ? isDarkMode
                      ? 'border-b-2 border-blue-500 text-blue-500'
                      : 'border-b-2 border-blue-600 text-blue-600'
                    : tab.disabled
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                } transition-colors duration-200`}
                onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                disabled={tab.disabled}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Import Tab */}
          {activeTab === 'import' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Upload Your Data</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
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
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Processing your file...</p>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                      Drag and drop your file here, or click to select a file
                    </p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Supported formats: CSV, XLSX, XLS
                    </p>
                  </div>
                )}
              </div>
              
              {fileError && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 text-red-700 dark:text-red-300 rounded-lg">
                  <p className="font-medium">Error:</p>
                  <p>{fileError}</p>
                </div>
              )}
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Example Data Format</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Campaign</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ad Format</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Impressions</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clicks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Conversions</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Spend</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">2023-04-01</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">Summer Sale</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">Display</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">12500</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">250</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">15</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">750.00</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">2023-04-01</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">Product Launch</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">Video</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">8000</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">320</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">12</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">620.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  The tool will automatically identify dimensions (non-numeric columns like Campaign, Ad Format) 
                  and metrics (numeric columns like Impressions, Clicks) for visualization.
                </p>
              </div>
            </div>
          )}
          
          {/* Table Tab */}
          {activeTab === 'table' && renderDataView()}
          
          {/* Visualization Tab */}
          {activeTab === 'visualize' && renderDataView()}
          
          {/* Advanced Analytics Tab (Placeholder) */}
          {activeTab === 'analytics' && (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-800 dark:text-white">Advanced Analytics Coming Soon</h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                In future updates, this section will include advanced statistical analysis, 
                descriptive statistics, correlation matrices, and more insights from your data.
              </p>
              
              {/* Simple Placeholder Statistics */}
              {rawData.length > 0 && selectedMetric && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Average</div>
                    <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                      {(rawData.reduce((sum, row) => sum + (Number(row[selectedMetric]) || 0), 0) / rawData.length).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                    <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                      {rawData.reduce((sum, row) => sum + (Number(row[selectedMetric]) || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Count</div>
                    <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                      {rawData.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataVisualizer; 