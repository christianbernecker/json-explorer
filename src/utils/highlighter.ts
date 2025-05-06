import { useCallback } from 'react';

/**
 * Hook providing syntax highlighting and formatting functions
 */
const useHighlighter = () => {
  // Ursprüngliche Regex-basierte JSON-Highlighting-Funktion
  const highlightJson = useCallback((json: any, isDarkMode: boolean): string => {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, null, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match: string) => {
      let cls = isDarkMode ? 'text-green-400' : 'text-green-600'; // string
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = isDarkMode ? 'text-blue-300' : 'text-indigo-600 font-semibold'; // key (angepasst für besseren Kontrast im Light Mode)
        }
      } else if (/true|false/.test(match)) {
        cls = isDarkMode ? 'text-purple-400' : 'text-purple-600'; // boolean
      } else if (/null/.test(match)) {
        cls = isDarkMode ? 'text-gray-400' : 'text-gray-500'; // null
      } else {
        cls = isDarkMode ? 'text-yellow-300' : 'text-yellow-600'; // number (angepasst)
      }
      return `<span class="${cls}">${match}</span>`;
    });
  }, []);

  // Ursprüngliche Regex-basierte XML-Highlighting-Funktion
  const highlightXml = useCallback((xml: string | undefined, isDarkMode: boolean): string => {
    if (!xml) return '';
    xml = xml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Tags und Attribute
    // eslint-disable-next-line no-useless-escape
    let highlighted = xml.replace(/&lt;(\/?)?([-\w:]+)([^&]*?)(\/?)&gt;/g, 
      (match, slash, tag, attrs, endSlash) => {
        let attrsHighlighted = attrs;
        // Attribute
        attrsHighlighted = attrsHighlighted.replace(/([-\w:]+)(\s*=\s*)(".*?"|'.*?')/g, 
          (match: string, name: string, equals: string, value: string) => {
            return `<span class="${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}">${name}</span>${equals}<span class="${isDarkMode ? 'text-green-400' : 'text-green-600'}">${value}</span>`;
          }
        );
        return `&lt;${slash ? slash : ''}<span class="${isDarkMode ? 'text-blue-300' : 'text-indigo-600'}">${tag}</span>${attrsHighlighted}${endSlash ? endSlash : ''}&gt;`;
      }
    );
    // CDATA (ohne s-Flag)
    highlighted = highlighted.replace(/(&lt;!\[CDATA\[)([\s\S]*?)(\]\]&gt;)/g, 
      (match, start, content, end) => {
        return `<span class="${isDarkMode ? 'text-gray-400' : 'text-gray-500'}">${start}</span><span class="${isDarkMode ? 'text-teal-300' : 'text-teal-600'}">${content}</span><span class="${isDarkMode ? 'text-gray-400' : 'text-gray-500'}">${end}</span>`;
      }
    );
     // Kommentare (ohne s-Flag)
     highlighted = highlighted.replace(/(&lt;!--)([\s\S]*?)(--&gt;)/g, 
       (match, start, content, end) => {
         return `<span class="${isDarkMode ? 'text-gray-500' : 'text-gray-400'}">${start}${content}${end}</span>`;
       }
     );
    return highlighted; // Return raw highlighted HTML
  }, []);

  // Formatierungsfunktion mit DOMParser
  const formatXml = useCallback((xml: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "application/xml");

      // Prüfe auf Parser-Fehler
      const parserError = doc.getElementsByTagName("parsererror")[0];
      if (parserError) {
        console.error("XML Parsing Error:", parserError.textContent);
        // Gib Original-XML zurück oder spezifische Fehlermeldung
        // Für den User ist das Original oft hilfreicher
        return xml; 
      }

      const serializeNode = (node: Node, level: number): string => {
        let result = '';
        const indent = '  '.repeat(level);

        switch (node.nodeType) {
          case Node.ELEMENT_NODE: {
            const element = node as Element;
            const tagName = element.tagName;
            const attributes = Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ');
            result += `${indent}<${tagName}${attributes ? ' ' + attributes : ''}>`;
            
            // Prüfen, ob das Element Kinder hat oder nur Textinhalt
            if (element.childNodes.length > 0) {
               let hasElementChild = false;
               let nodeContent = '';
               for (let i = 0; i < element.childNodes.length; i++) {
                  const child = element.childNodes[i];
                  if (child.nodeType === Node.ELEMENT_NODE) {
                      hasElementChild = true;
                      nodeContent += '\n' + serializeNode(child, level + 1);
                  } else if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
                      // Trim text/CDATA content to avoid extra newlines if only whitespace exists
                      const trimmedContent = child.textContent?.trim();
                      if (trimmedContent) {
                          // Keine zusätzliche Einrückung für Text/CDATA, direkt anhängen
                          nodeContent += child.nodeType === Node.CDATA_SECTION_NODE 
                            ? `<![CDATA[${trimmedContent}]]>` 
                            : trimmedContent;
                      }
                  } else if (child.nodeType === Node.COMMENT_NODE) {
                      nodeContent += '\n' + serializeNode(child, level + 1);
                  }
               }

               if (hasElementChild) {
                  result += `${nodeContent}\n${indent}</${tagName}>`;
               } else {
                  // Keine Element-Kinder, füge Inhalt direkt an und schließe Tag in derselben Zeile (ggf. anpassen)
                  result += nodeContent + `</${tagName}>`;
               }

            } else {
              // Leeres Element (oder self-closing wurde vom Parser expandiert)
              result += `</${tagName}>`;
            }
            break;
          }
          case Node.TEXT_NODE: {
            // Textknoten werden innerhalb des Elternelements behandelt (s.o.)
            // Nur relevant, wenn direkt serialisiert (sollte nicht vorkommen bei korrektem XML)
             const trimmedText = node.textContent?.trim();
             if (trimmedText) {
               result += `${indent}${trimmedText}`;
             }
            break;
          }
          case Node.CDATA_SECTION_NODE: {
             // CDATA-Knoten werden innerhalb des Elternelements behandelt (s.o.)
             const cdataContent = node.textContent || '';
             result += `${indent}<![CDATA[${cdataContent}]]>`; 
            break;
          }
          case Node.COMMENT_NODE: {
            const commentContent = node.textContent || '';
            result += `${indent}<!--${commentContent}-->`;
            break;
          }
          // Andere Knotentypen (ProcessingInstruction, DocumentType etc.) werden ignoriert
        }
        return result;
      };

      // Starte die Serialisierung mit dem Dokument-Element
      let formattedXml = '';
      if (doc.documentElement) {
          formattedXml = serializeNode(doc.documentElement, 0);
      }
      
      return formattedXml;

    } catch (e) {
      console.error("Error formatting XML:", e);
      return xml; // Fallback auf Original-XML bei unerwarteten Fehlern
    }
  }, []);

  return { highlightJson, highlightXml, formatXml };
};

export default useHighlighter; 