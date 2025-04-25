import React from 'react';

interface DataVisualizerHeaderProps {
  isDarkMode: boolean;
  fileName?: string;
  rowCount?: number;
  columnCount?: number;
  exportToCsv?: () => void;
  exportToJson?: () => void;
  exportToExcel?: () => void;
  exportToPdf?: () => void;
  exportChartAsPng?: () => void;
  onUploadNewData?: () => void;
  activeTab?: string;
}

const DataVisualizerHeader: React.FC<DataVisualizerHeaderProps> = ({
  isDarkMode,
  fileName,
  rowCount,
  columnCount,
  exportToCsv,
  exportToJson,
  exportToExcel,
  exportToPdf,
  exportChartAsPng,
  onUploadNewData,
  activeTab
}) => {
  const hasData = !!rowCount && rowCount > 0;
  
  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex flex-col lg:flex-row items-start justify-between">
        <div className="flex items-center mb-4 lg:mb-0">
          <div className="mr-5 bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-xl text-white flex items-center justify-center" style={{ width: '50px', height: '50px', minWidth: '50px' }} aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Data Visualizer">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>
              Data Visualizer
            </h1>
            {hasData && (
              <div className={`flex flex-wrap gap-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <span><strong>File:</strong> {fileName}</span>
                <span><strong>Rows:</strong> {rowCount}</span>
                <span><strong>Columns:</strong> {columnCount}</span>
              </div>
            )}
            {!hasData && (
              <div className="flex items-center">
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Upload and visualize your AdTech data with interactive charts
                </p>
              </div>
            )}
          </div>
        </div>
        
        {hasData && (
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={exportToCsv} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              CSV Export
            </button>
            <button 
              onClick={exportToJson} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              JSON Export
            </button>
            <button 
              onClick={exportToExcel} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Excel Export
            </button>
            {activeTab === 'visualize' && exportChartAsPng && (
              <button 
                onClick={exportChartAsPng} 
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                PNG Export
              </button>
            )}
            <button 
              onClick={exportToPdf} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              PDF Export
            </button>
            <button 
              onClick={onUploadNewData} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Upload New Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualizerHeader; 