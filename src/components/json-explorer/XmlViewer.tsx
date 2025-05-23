import React, { useRef } from 'react';
import useHighlighter from '../../utils/highlighter';
import { useAddLineNumbers } from '../../hooks/useAddLineNumbers';

interface XmlViewerProps {
  xmlContent: string | null;
  isDarkMode: boolean;
  enableWordWrap?: boolean;
  className?: string;
}

/**
 * Komponente zur formatierten Anzeige von XML-Daten
 * 
 * Zeigt formatiertes und hervorgehobenes XML mit Zeilennummern an.
 * Unterstützt optionalen Zeilenumbruch.
 */
const XmlViewer: React.FC<XmlViewerProps> = ({ 
  xmlContent, 
  isDarkMode, 
  enableWordWrap = false,
  className = ''
}) => {
  const { highlightXml, formatXml } = useHighlighter();
  const addLineNumbers = useAddLineNumbers(isDarkMode);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Formatiere und hebe XML hervor
  const getFormattedXml = () => {
    if (!xmlContent) {
      return '<div class="text-gray-500 italic">No XML content available</div>';
    }
    
    try {
      // Formatiere das XML für bessere Lesbarkeit
      const formatted = formatXml(xmlContent);
      
      // Wende Syntax-Hervorhebung an
      const highlighted = highlightXml(formatted, isDarkMode);
      
      // Füge Zeilennummern hinzu
      return addLineNumbers(highlighted, 'xml');
    } catch (error) {
      console.error('Error formatting XML:', error);
      return `<pre class="text-red-500">Error formatting XML: ${error}</pre>`;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`xml-viewer overflow-auto ${enableWordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'} ${className}`}
      dangerouslySetInnerHTML={{ __html: getFormattedXml() }}
    />
  );
};

export default XmlViewer; 