import React, { useEffect } from 'react';

export interface JsonExplorerHeaderProps {
  isDarkMode: boolean;
  hasJsonContent: boolean;
  hasVastContent: boolean;
  characterCount: number;
  resetFields: () => void;
  handleFormat: () => void;
  copyJsonToClipboard: () => void;
  copyVastToClipboard?: () => void;
  copyVastUrlToClipboard?: () => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
}

const JsonExplorerHeader: React.FC<JsonExplorerHeaderProps> = ({
  isDarkMode,
  hasJsonContent,
  hasVastContent,
  characterCount,
  resetFields,
  handleFormat,
  copyJsonToClipboard,
  copyVastToClipboard,
  copyVastUrlToClipboard,
  zoomLevel,
  setZoomLevel
}) => {
  // Debug-Log hinzufügen
  useEffect(() => {
    console.log('JsonExplorerHeader geladen', { hasJsonContent, hasVastContent, isDarkMode });
  }, [hasJsonContent, hasVastContent, isDarkMode]);

  // Render wenn keine Daten vorhanden sind
  if (!hasJsonContent && !hasVastContent) {
    return (
      <div className={`w-full mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          JSON Explorer
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Fügen Sie JSON ein oder laden Sie eine JSON-Datei hoch, um zu beginnen.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full mb-4 px-4 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            JSON Explorer
          </h1>
          <div className={`flex flex-wrap gap-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span><strong>Zeichen:</strong> {characterCount}</span>
            {hasVastContent && <span><strong>VAST gefunden:</strong> Ja</span>}
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {/* Immer den Format-Button anzeigen, unabhängig vom Zustand */}
          <button 
            onClick={handleFormat} 
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="Format (Ctrl+Shift+F)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            Format
          </button>
          
          <button 
            onClick={resetFields} 
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            title="Clear (Ctrl+Shift+L)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
          
          {hasJsonContent && (
            <button 
              onClick={copyJsonToClipboard} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                isDarkMode 
                  ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-200' 
                  : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Copy JSON
            </button>
          )}
          
          {copyVastToClipboard && hasVastContent && (
            <button 
              onClick={copyVastToClipboard} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                isDarkMode 
                  ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Copy VAST
            </button>
          )}
          
          {copyVastUrlToClipboard && hasVastContent && (
            <button 
              onClick={copyVastUrlToClipboard} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium ${
                isDarkMode 
                  ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy URL
            </button>
          )}
        </div>
      </div>
      
      {/* Zoom Controls - immer anzeigen */}
      <div className="flex items-center space-x-2">
        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Zoom:</span>
        <button 
          onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
          className={`p-1 rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Kleiner (Ctrl+Shift+-)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{Math.round(zoomLevel * 100)}%</span>
        <button 
          onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
          className={`p-1 rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Größer (Ctrl+Shift++)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button 
          onClick={() => setZoomLevel(1)}
          className={`p-1 rounded-md ${
            isDarkMode 
              ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Zurücksetzen (Ctrl+Shift+0)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default JsonExplorerHeader; 