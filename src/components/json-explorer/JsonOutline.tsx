import React, { useState } from 'react';

interface JsonOutlineProps {
  json: any;
  isDarkMode: boolean;
  onItemClick?: (path: string, key: string, isObject: boolean) => void;
  initialExpandedPaths?: Set<string>;
}

/**
 * Komponente zur Darstellung der JSON-Struktur als ausklappbare Hierarchie
 * 
 * Zeigt JSON-Objekte als Baum an und ermöglicht das Navigieren durch die Struktur.
 * Klickbare Elemente führen zum Scrollen/Hervorheben im Haupt-JSON-Viewer.
 */
const JsonOutline: React.FC<JsonOutlineProps> = ({ 
  json, 
  isDarkMode, 
  onItemClick,
  initialExpandedPaths = new Set()
}) => {
  // State für die aufgeklappten JSON-Elemente
  const [expandedJsonPaths, setExpandedJsonPaths] = useState<Set<string>>(initialExpandedPaths);

  // Funktion zum Anzeigen der JSON-Outline
  const generateJsonOutline = (json: any, path: string = ''): React.ReactNode => {
    if (!json || typeof json !== 'object') return null;
    
    const isArray = Array.isArray(json);
    
    return (
      <ul className={`${path ? 'ml-4' : ''} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {Object.keys(json).map((key, index) => {
          const currentPath = path ? `${path}.${key}` : key;
          const currentValue = json[key];
          const isObject = currentValue && typeof currentValue === 'object';
          const isExpanded = expandedJsonPaths.has(currentPath);
          
          // Abkürzung für Arrays mit vielen Elementen
          if (isArray && Object.keys(json).length > 20 && index >= 10 && index < Object.keys(json).length - 5) {
            if (index === 10) {
              return (
                <li key={`${currentPath}-ellipsis`} className="py-1 pl-2 text-gray-500">
                  ... {Object.keys(json).length - 15} more items ...
                </li>
              );
            }
            return null;
          }
          
          return (
            <li key={currentPath} className="py-1">
              <div className="flex items-start">
                <span 
                  className={`cursor-pointer flex items-center ${isDarkMode ? 'hover:text-blue-300' : 'hover:text-blue-600'}`}
                  onClick={() => {
                    if (isObject) {
                      // Toggle expanded state für diesen Pfad
                      const newExpandedPaths = new Set(expandedJsonPaths);
                      if (isExpanded) {
                        newExpandedPaths.delete(currentPath);
                      } else {
                        newExpandedPaths.add(currentPath);
                      }
                      setExpandedJsonPaths(newExpandedPaths);
                    }
                    
                    // Callback für Klick-Event
                    if (onItemClick) {
                      onItemClick(currentPath, key, isObject);
                    }
                  }}
                >
                  {isObject && (
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 mr-1 transition-transform duration-200 ${isExpanded ? 'transform rotate-90' : ''}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <span className={isArray ? 'text-purple-500 dark:text-purple-400' : 'text-blue-500 dark:text-blue-400'}>
                    {key}
                  </span>
                  {!isObject && (
                    <span className="ml-2 text-gray-500 truncate max-w-[150px] text-xs">
                      {typeof currentValue === 'string' 
                        ? `"${currentValue.length > 20 ? currentValue.substring(0, 20) + '...' : currentValue}"`
                        : String(currentValue)
                      }
                    </span>
                  )}
                </span>
              </div>
              {isObject && isExpanded && generateJsonOutline(currentValue, currentPath)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="json-outline overflow-auto h-full">
      {generateJsonOutline(json)}
    </div>
  );
};

export default JsonOutline; 