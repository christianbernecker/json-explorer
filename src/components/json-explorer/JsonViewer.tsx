import React, { useRef, useEffect } from 'react';
import useHighlighter from '../../utils/highlighter';
import { useAddLineNumbers } from '../../hooks/useAddLineNumbers';

interface JsonViewerProps {
  jsonData: any;
  isDarkMode: boolean;
  enableWordWrap?: boolean;
  className?: string;
  onItemHighlight?: (key: string, value: any) => void;
}

/**
 * Komponente zur formatierten Anzeige von JSON-Daten
 * 
 * Zeigt formatiertes und hervorgehobenes JSON mit Zeilennummern an.
 * Unterstützt optionalen Zeilenumbruch und Hervorhebung von Elementen.
 */
const JsonViewer: React.FC<JsonViewerProps> = ({ 
  jsonData, 
  isDarkMode, 
  enableWordWrap = false,
  className = '',
  onItemHighlight
}) => {
  const { highlightJson } = useHighlighter();
  const addLineNumbers = useAddLineNumbers(isDarkMode);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Konvertiere JSON-Daten zu einem formatierten String mit Hervorhebung
  const getFormattedJson = () => {
    try {
      // Wenn jsonData bereits ein String ist, verwende ihn direkt
      let jsonStr = typeof jsonData === 'string' 
        ? jsonData 
        : JSON.stringify(jsonData, null, 2);
      
      // Syntax-Hervorhebung anwenden
      const highlighted = highlightJson(jsonStr, isDarkMode);
      
      // Zeilennummern hinzufügen
      return addLineNumbers(highlighted, 'json');
    } catch (error) {
      console.error('Error formatting JSON:', error);
      return `<pre class="text-red-500">Error formatting JSON: ${error}</pre>`;
    }
  };
  
  // Effekt zur Behandlung von Element-Hervorhebungen
  useEffect(() => {
    if (!containerRef.current || !onItemHighlight) return;
    
    // Event-Delegation für Klicks auf JSON-Elemente
    const handleContainerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Versuchen, das nächste Element mit dem data-key-Attribut zu finden
      const keyElement = target.closest('[data-key]');
      
      if (keyElement) {
        const key = keyElement.getAttribute('data-key');
        const valueElement = keyElement.nextElementSibling;
        const value = valueElement?.textContent || '';
        
        if (key && onItemHighlight) {
          onItemHighlight(key, value);
        }
      }
    };
    
    const container = containerRef.current;
    container.addEventListener('click', handleContainerClick);
    
    return () => {
      container.removeEventListener('click', handleContainerClick);
    };
  }, [onItemHighlight]);

  return (
    <div 
      ref={containerRef}
      className={`json-viewer overflow-auto ${enableWordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'} ${className}`}
      dangerouslySetInnerHTML={{ __html: getFormattedJson() }}
    />
  );
};

export default JsonViewer; 