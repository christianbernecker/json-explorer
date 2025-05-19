import React, { useState, useEffect } from 'react';
import { getHistoryItems, clearHistory, HistoryItem } from '../../services/historyService';
import Button from '../shared/Button';

interface HistoryPanelProps {
  isDarkMode: boolean;
  onSelectTcfString: (tcfString: string) => void;
}

/**
 * Komponente zur Anzeige der History im TCF-Decoder
 * 
 * Zeigt die zuletzt verwendeten TCF-Strings an und ermöglicht
 * das schnelle Wiederverwenden dieser Strings.
 */
const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  isDarkMode, 
  onSelectTcfString 
}) => {
  // State
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  
  // Styling
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const itemBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const hoverBgColor = isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  
  // Laden der History-Einträge
  useEffect(() => {
    const items = getHistoryItems('tcf');
    setHistoryItems(items);
  }, []);
  
  // History löschen
  const handleClearHistory = () => {
    clearHistory('tcf');
    setHistoryItems([]);
  };
  
  // Eintrag aus History auswählen
  const handleSelectItem = (item: HistoryItem) => {
    onSelectTcfString(item.content);
  };
  
  return (
    <div className={`${textColor}`}>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">TCF String History</h2>
        
        <Button
          onClick={handleClearHistory}
          isDarkMode={isDarkMode}
          variant="danger"
          disabled={historyItems.length === 0}
        >
          History löschen
        </Button>
      </div>
      
      {historyItems.length === 0 ? (
        <p className={`${secondaryTextColor} p-4 text-center`}>
          Keine History-Einträge vorhanden. Decodiere TCF-Strings, um sie hier zu sehen.
        </p>
      ) : (
        <div className={`border ${borderColor} rounded-md overflow-hidden`}>
          <ul className="divide-y divide-gray-600">
            {historyItems.map((item) => (
              <li 
                key={item.id}
                className={`p-3 ${itemBgColor} ${hoverBgColor} cursor-pointer`}
                onClick={() => handleSelectItem(item)}
              >
                <div className="flex justify-between items-center">
                  <div className="truncate w-full">
                    <span className="text-sm mr-2 text-blue-500">#{item.id}</span>
                    <span className="text-sm font-mono">{item.content.slice(0, 20)}...</span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectItem(item);
                    }}
                    isDarkMode={isDarkMode}
                    size="sm"
                  >
                    Verwenden
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel; 