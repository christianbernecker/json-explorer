import React, { useState, useCallback } from 'react';

interface VastOutlineProps {
  xmlContent: string | null;
  isDarkMode: boolean;
  initialExpandedNodes?: Set<string>;
}

/**
 * Komponente zur Darstellung der XML/VAST-Struktur als ausklappbare Hierarchie
 * 
 * Parst XML und zeigt es als Baumstruktur an.
 * Ermöglicht das Navigieren und Erforschen der XML-Struktur.
 */
const VastOutline: React.FC<VastOutlineProps> = ({ 
  xmlContent, 
  isDarkMode,
  initialExpandedNodes = new Set()
}) => {
  // State für die aufgeklappten XML-Knoten
  const [expandedVastNodes, setExpandedVastNodes] = useState<Set<string>>(initialExpandedNodes);

  // Funktion zum Generieren der XML-Outline
  const generateVastOutline = useCallback(() => {
    if (!xmlContent) return null;
    
    try {
      // XML parsen und als Baumstruktur darstellen
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      
      // Rekursive Funktion zum Aufbau der Outline
      const traverseNode = (node: Node, depth: number = 0, parentPath: string = ''): React.ReactNode => {
        // Textknoten ignorieren
        if (node.nodeType === Node.TEXT_NODE) {
          const textContent = node.textContent?.trim();
          if (!textContent) return null;
          
          // Nur Textknoten mit Inhalt anzeigen (maximal 20 Zeichen)
          return (
            <li className="py-1 pl-2 ml-4 text-gray-500 text-xs">
              {textContent.length > 20 ? `${textContent.substring(0, 20)}...` : textContent}
            </li>
          );
        }
        
        // Element-Knoten verarbeiten
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const nodeName = element.nodeName;
          const hasChildren = element.childNodes.length > 0;
          const attributes = element.attributes;
          const nodePath = `${parentPath}/${nodeName}`;
          const isExpanded = expandedVastNodes.has(nodePath);
          
          return (
            <li key={`${nodeName}-${depth}`} className="py-1">
              <div className="flex items-start">
                <span 
                  className={`cursor-pointer flex items-center ${isDarkMode ? 'hover:text-blue-300' : 'hover:text-blue-600'}`}
                  onClick={() => {
                    if (hasChildren) {
                      // Toggle expanded state für diesen Pfad
                      const newExpandedNodes = new Set(expandedVastNodes);
                      if (isExpanded) {
                        newExpandedNodes.delete(nodePath);
                      } else {
                        newExpandedNodes.add(nodePath);
                      }
                      setExpandedVastNodes(newExpandedNodes);
                    }
                  }}
                >
                  {hasChildren && (
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 mr-1 transition-transform duration-200 ${isExpanded ? 'transform rotate-90' : ''}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <span className="text-orange-500 dark:text-orange-400">
                    {nodeName}
                  </span>
                  
                  {/* Zeige Attribute an, wenn vorhanden */}
                  {attributes.length > 0 && (
                    <span className="ml-2 text-blue-500 text-xs">
                      {Array.from(attributes).map((attr) => 
                        <span key={attr.name}>{attr.name}="{attr.value}" </span>
                      )}
                    </span>
                  )}
                </span>
              </div>
              
              {/* Rekursion für Kinder-Elemente, nur wenn ausgeklappt */}
              {hasChildren && isExpanded && (
                <ul className="ml-4">
                  {Array.from(element.childNodes).map((childNode, index) => (
                    <React.Fragment key={index}>
                      {traverseNode(childNode, depth + 1, nodePath)}
                    </React.Fragment>
                  ))}
                </ul>
              )}
            </li>
          );
        }
        
        return null;
      };
      
      // Beginne mit dem Root-Element
      return (
        <ul className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {traverseNode(xmlDoc.documentElement, 0, '')}
        </ul>
      );
      
    } catch (error) {
      console.error('Error parsing XML:', error);
      return <div className="text-red-500">Error parsing XML content</div>;
    }
  }, [xmlContent, isDarkMode, expandedVastNodes]);

  return (
    <div className="vast-outline overflow-auto h-full">
      {generateVastOutline()}
    </div>
  );
};

export default VastOutline; 