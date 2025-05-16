import React from 'react';
import { HistoryItem as HistoryItemType } from '../../services/historyService';
import { Card, Button } from './';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface HistoryPanelProps {
  items: HistoryItemType[];
  onSelect: (item: HistoryItemType) => void;
  onClear: () => void;
  onRemove: (id: number) => void;
  isDarkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  items,
  onSelect,
  onClear,
  onRemove,
  isDarkMode,
  isOpen,
  onClose,
  title = "History",
  emptyMessage = "No history items yet",
  className = "",
}) => {
  // Falls nicht geöffnet, nichts rendern
  if (!isOpen) return null;
  
  // Farbstile basierend auf Dark Mode
  const secondaryText = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  
  // Hilfsfunktion zur Formatierung der Zeit
  const formatTime = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true,
      locale: de 
    });
  };

  // Hilfsfunktion zur Kürzung von langen Texten
  const truncateText = (text: string, maxLength: number = 60): string => {
    return text.length > maxLength 
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <Card 
      isDarkMode={isDarkMode} 
      title={title}
      className={`${className} z-10 relative`}
      headerContent={
        <Button 
          onClick={onClose} 
          isDarkMode={isDarkMode} 
          variant="secondary" 
          size="sm"
          aria-label="Close history panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Button>
      }
      footerContent={
        items.length > 0 ? (
          <div className="flex justify-end">
            <Button 
              onClick={onClear} 
              isDarkMode={isDarkMode} 
              variant="danger" 
              size="sm"
            >
              Clear All
            </Button>
          </div>
        ) : null
      }
    >
      <div className="max-h-96 overflow-y-auto overflow-x-hidden">
        {items.length === 0 ? (
          <div className={`py-4 text-center ${secondaryText}`}>
            {emptyMessage}
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li 
                key={item.id} 
                className={`p-3 rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${hoverBg} cursor-pointer relative group`}
                onClick={() => onSelect(item)}
              >
                <div className="pr-8"> {/* Platz für den Delete-Button */}
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {item.title || `${item.type.toUpperCase()} Entry`}
                    </div>
                    <div className={`text-xs ${secondaryText}`}>
                      {formatTime(item.timestamp)}
                    </div>
                  </div>
                  
                  <div className={`mt-1 text-sm ${secondaryText} font-mono break-all`}>
                    {truncateText(item.content)}
                  </div>
                </div>
                
                {/* Löschen-Button (nur sichtbar beim Hover) */}
                <button
                  className={`absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  aria-label="Remove item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

export default HistoryPanel; 