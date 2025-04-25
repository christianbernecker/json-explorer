import React from 'react';

export interface DataVisualizerHeaderProps {
  isDarkMode: boolean;
  fileName: string;
  rowCount: number;
  columnCount: number;
  exportToCsv: () => void;
  exportToJson: () => void;
  exportToExcel: () => void;
  exportToPdf: () => void;
  exportChartAsPng?: () => void;
  onUploadNewData: () => void;
  activeTab: 'dashboard' | 'data' | 'visualize' | 'analytics';
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
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', disabled: false },
    { id: 'data', label: 'Data Table', disabled: false },
    { id: 'visualize', label: 'Visualization', disabled: false },
    { id: 'analytics', label: 'Analytics', disabled: false }
  ];

  // Render abhängig davon, ob Daten geladen wurden
  if (rowCount === 0) {
    return (
      <div className={`max-w-4xl mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
        <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Data Visualizer
        </h1>
      </div>
    );
  }

  return (
    <>
      {/* Header mit Dateiinfo und Tabs */}
      <div className={`w-full mb-4 px-4 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Data Visualizer
            </h1>
            <div className={`flex flex-wrap gap-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span><strong>File:</strong> {fileName}</span>
              <span><strong>Rows:</strong> {rowCount}</span>
              <span><strong>Columns:</strong> {columnCount}</span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
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
            {exportChartAsPng && (
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
              disabled={tab.disabled}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default DataVisualizerHeader; 