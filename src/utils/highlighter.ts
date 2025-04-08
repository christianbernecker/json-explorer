import { useCallback } from 'react';

/**
 * Hook providing syntax highlighting and formatting functions
 */
const useHighlighter = () => {
  // Memoized version of the highlighting functions
  const highlightJson = useCallback((json: any, isDarkMode: boolean): string => {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, null, 2);
    }
    
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match: string) => {
      let cls = isDarkMode ? 'text-green-400' : 'text-green-600'; // string
      
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = isDarkMode ? 'text-gray-100 font-semibold' : 'text-black font-semibold'; // key
        }
      } else if (/true/.test(match)) {
        cls = isDarkMode ? 'text-purple-400' : 'text-purple-600'; // true
      } else if (/false/.test(match)) {
        cls = isDarkMode ? 'text-orange-300' : 'text-orange-500'; // false
      } else if (/null/.test(match)) {
        cls = isDarkMode ? 'text-gray-400' : 'text-gray-500'; // null
      } else {
        cls = isDarkMode ? 'text-blue-300' : 'text-blue-600'; // number
      }
      
      return `<span class="${cls}">${match}</span>`;
    });
  }, []);

  const highlightXml = useCallback((xml: string | undefined, isDarkMode: boolean): string => {
    if (!xml) return '';
    
    xml = xml.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Tags
    // eslint-disable-next-line no-useless-escape
    let highlighted = xml.replace(/&lt;(\/?)([-\w:]+)([^&]*?)(\/?)\&gt;/g, 
      (match, slash, tag, attrs, endSlash) => {
        let attrsHighlighted = attrs;
        
        // Attributes
        attrsHighlighted = attrsHighlighted.replace(/(\s+)([-\w:]+)(\s*=\s*)(".*?"|'.*?')/g, 
          (match: string, space: string, name: string, equals: string, value: string) => {
            return `${space}<span class="${isDarkMode ? 'text-gray-100 font-semibold' : 'text-black font-semibold'}">${name}</span>${equals}<span class="${isDarkMode ? 'text-green-400' : 'text-green-600'}">${value}</span>`;
          }
        );
        
        return `&lt;<span class="${isDarkMode ? 'text-blue-300' : 'text-blue-600'}">${slash}${tag}</span>${attrsHighlighted}${endSlash}&gt;`;
      }
    );
    
    // CDATA
    highlighted = highlighted.replace(/(&lt;!\[CDATA\[)(.*)(\]\]&gt;)/g, 
      (match, start, content, end) => {
        return `<span class="${isDarkMode ? 'text-purple-300' : 'text-purple-500'}">${start}</span><span class="${isDarkMode ? 'text-teal-300' : 'text-teal-600'}">${content}</span><span class="${isDarkMode ? 'text-purple-300' : 'text-purple-500'}">${end}</span>`;
      }
    );
    
    return highlighted;
  }, []);

  const formatXml = useCallback((xml: string): string => {
    let formatted = '';
    let indent = '';
    let indentLevel = 0;
    
    xml = xml.replace(/>\s+</g, '><');
    
    xml.split(/(<\/?[^>]+>)/).forEach(segment => {
      if (!segment.trim()) return;
      
      if (segment.match(/^<\//)) {
        indentLevel--;
        indent = '  '.repeat(indentLevel);
      }
      
      formatted += indent + segment + '\n';
      
      if (segment.match(/^<[^/]/) && !segment.match(/\/>$/) && !segment.match(/^<!\[CDATA\[/) && !segment.match(/^<\?/)) {
        indentLevel++;
        indent = '  '.repeat(indentLevel);
      }
    });
    
    return formatted.trim();
  }, []);

  return { highlightJson, highlightXml, formatXml };
};

export default useHighlighter; 