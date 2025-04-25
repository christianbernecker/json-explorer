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
    console.log('JsonExplorerHeader WIRD JETZT GELADEN', { hasJsonContent, hasVastContent, isDarkMode });
  }, [hasJsonContent, hasVastContent, isDarkMode]);

  // IMMER den gleichen Inhalt anzeigen
  return (
    <div className={`w-full mb-4 px-4 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            JSON Explorer
          </h1>
          <div className={`flex flex-wrap gap-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span><strong>Zeichen:</strong> {characterCount}</span>
            {hasVastContent && <span><strong>VAST gefunden:</strong> Ja</span>}
          </div>
        </div>
        
        {/* Alle Buttons und Zoom-Controls wurden entfernt und in die entsprechenden Panel-Bereiche verschoben */}
      </div>
    </div>
  );
};

export default JsonExplorerHeader; 