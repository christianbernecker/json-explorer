import React from 'react';
import { HistoryItem as HistoryItemType } from '../../types';
import HistoryItem from './HistoryItem';

interface JsonHistoryPanelProps {
  isDarkMode: boolean;
  history: HistoryItemType[];
  onClick?: (item: HistoryItemType) => void;
  onRestore?: (item: HistoryItemType) => void;
  onClose: () => void;
}

const JsonHistoryPanel: React.FC<JsonHistoryPanelProps> = ({ 
  isDarkMode, 
  history, 
  onClick, 
  onRestore,
  onClose 
}) => {
  // Verwende onRestore, wenn vorhanden, ansonsten onClick
  const handleItemClick = (item: HistoryItemType) => {
    if (onRestore) {
      onRestore(item);
    } else if (onClick) {
      onClick(item);
    }
  };

  return (
    <div className={`mb-6 p-4 border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Recent JSON Explorations
        </h3>
        <button 
          onClick={onClose}
          className={`p-1 rounded-md hover:bg-gray-200 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {history.length > 0 ? (
          history.map((item: HistoryItemType, index: number) => (
            <HistoryItem 
              key={item.timestamp} 
              item={item} 
              index={index} 
              onClick={handleItemClick}
              isDarkMode={isDarkMode}
            />
          ))
        ) : (
          <div className={`p-3 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No history yet. Format some JSON to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default JsonHistoryPanel; 