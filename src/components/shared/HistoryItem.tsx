import React from 'react';
import { HistoryItemProps } from '../../types';

const HistoryItem = React.memo(({ item, index, onRestore, isDarkMode }: HistoryItemProps) => {
  const formattedDate = new Date(item.timestamp).toLocaleString();
  
  // Dynamisches Label basierend auf Item-Type
  const getItemLabel = () => {
    switch (item.type) {
      case 'json':
        return 'JSON';
      case 'json_vast':
        return 'JSON+VAST';
      case 'json_diff':
        return `JSON Diff ${item.comparisonMode ? `(${item.comparisonMode} mode)` : ''}`;
      default:
        return 'Item';
    }
  };
  
  return (
    <div 
      className={`p-3 mb-2 rounded-lg cursor-pointer hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-between ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
      onClick={() => onRestore(item)}
    >
      <div>
        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {getItemLabel()}
          {item.type === 'json_vast' && item.vastPath && (
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
            }`}>
              {item.vastPath}
            </span>
          )}
        </div>
        <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {formattedDate}
        </div>
      </div>
      <div className={`text-xs px-2 py-1 rounded-lg ${
        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
      }`}>
        #{index + 1}
      </div>
    </div>
  );
});

export default HistoryItem; 