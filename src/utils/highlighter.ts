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
    let highlighted = xml.replace(/&lt;(\/?)?([-\w:]+)([^&]*?)(\/?)\&gt;/g, 
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
    return `<pre><code class="language-xml">${highlighted}</code></pre>`; // Wrap in pre/code
  }, []);

  // Formatierungsfunktion bleibt gleich
  const formatXml = useCallback((xml: string): string => {
     try {
       let formatted = '';
       const reg = /(>)(<)(\/*)/g;
       xml = xml.replace(reg, '$1\r\n$2$3');
       let pad = 0;
       xml.split('\r\n').forEach(node => {
         let indent = 0;
         if (node.match( /.+<\/\w[^>]*>$/ )) {
           indent = 0;
         } else if (node.match( /^<\/\w/ )) {
           if (pad !== 0) {
             pad -= 1;
           }
         } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
           indent = 1;
         } else {
           indent = 0;
         }
         const padding = '  '.repeat(pad);
         formatted += padding + node + '\r\n';
         pad += indent;
       });
       return formatted.trim();
     } catch (e) {
       return xml;
     }
  }, []);

  return { highlightJson, highlightXml, formatXml };
};

export default useHighlighter; 