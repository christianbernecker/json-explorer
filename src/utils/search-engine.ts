import { SearchResult, ContentType, SearchOptions } from '../types';

// Zentrale Such-Klasse
export class UnifiedSearchEngine {
  // Parser für verschiedene Inhaltstypen
  private parsers = {
    [ContentType.JSON]: this.parseJsonForSearch,
    [ContentType.XML]: this.parseXmlForSearch,
    [ContentType.TEXT]: this.parseTextForSearch
  };
  
  // Führt Suche durch
  public search(content: string, contentType: ContentType, term: string, options: SearchOptions): SearchResult[] {
    if (!content || !term) return [];
    
    // Pattern erstellen (mit oder ohne Regex)
    let pattern: RegExp;
    try {
      if (options.useRegex) {
        pattern = new RegExp(term, options.caseSensitive ? 'g' : 'gi');
      } else {
        const escapedTerm = this.escapeRegExp(term);
        pattern = new RegExp(escapedTerm, options.caseSensitive ? 'g' : 'gi');
      }
    } catch (e) {
      console.error('Invalid regex pattern:', e);
      return [];
    }
    
    // Parser für den jeweiligen Inhaltstyp auswählen
    const parser = this.parsers[contentType];
    if (!parser) {
      console.error(`No parser found for content type: ${contentType}`);
      return [];
    }
    
    // Parsen und Suchen
    return parser.call(this, content, pattern, options);
  }
  
  // Hilft beim Escapen von Regex-Zeichen
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // JSON für Suche parsen und durchsuchen
  private parseJsonForSearch(content: string, pattern: RegExp, options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    
    try {
      const json = JSON.parse(content);
      
      // Rekursiv durch JSON navigieren
      const traverse = (obj: any, path: string[] = []) => {
        if (!obj) return;
        
        if (typeof obj === 'object') {
          for (const key in obj) {
            // Schlüssel prüfen, wenn aktiviert
            if (options.inKeys && pattern.test(key)) {
              results.push({
                type: 'JSON Key',
                path: [...path, key].join('.'),
                line: this.estimateLineNumber(content, key),
                context: `${key}: ${this.formatValuePreview(obj[key])}`,
                match: key,
                contentType: ContentType.JSON
              });
            }
            
            // Wert prüfen
            const value = obj[key];
            
            // Für Strings, wenn Suche in Werten aktiviert ist
            if (options.inValues && typeof value === 'string' && pattern.test(value)) {
              results.push({
                type: 'JSON Value',
                path: [...path, key].join('.'),
                line: this.estimateLineNumber(content, value),
                context: `${key}: ${this.formatValuePreview(value)}`,
                match: value,
                contentType: ContentType.JSON
              });
            }
            
            // Rekursiv weitergehen
            if (typeof value === 'object' && value !== null) {
              traverse(value, [...path, key]);
            }
          }
        }
      };
      
      traverse(json);
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
    
    return results;
  }
  
  // XML für Suche parsen und durchsuchen
  private parseXmlForSearch(content: string, pattern: RegExp, options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      // Rekursiv durch XML-DOM navigieren
      const traverse = (node: Node, path: string[] = []) => {
        if (!node) return;
        
        // Element-Knoten
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const nodeName = element.nodeName;
          
          // Tag-Namen prüfen, wenn aktiviert
          if (options.inKeys && pattern.test(nodeName)) {
            results.push({
              type: 'XML Tag',
              path: [...path, nodeName].join('/'),
              line: this.estimateLineNumber(content, `<${nodeName}`),
              context: this.getXmlNodePreview(element),
              match: nodeName,
              contentType: ContentType.XML
            });
          }
          
          // Attribute durchgehen
          if (options.inKeys || options.inValues) {
            Array.from(element.attributes).forEach(attr => {
              if (options.inKeys && pattern.test(attr.name)) {
                results.push({
                  type: 'XML Attribute',
                  path: [...path, nodeName, '@' + attr.name].join('/'),
                  line: this.estimateLineNumber(content, attr.name),
                  context: `<${nodeName} ${attr.name}="${attr.value}">`,
                  match: attr.name,
                  contentType: ContentType.XML
                });
              }
              
              if (options.inValues && pattern.test(attr.value)) {
                results.push({
                  type: 'XML Attribute Value',
                  path: [...path, nodeName, '@' + attr.name].join('/'),
                  line: this.estimateLineNumber(content, attr.value),
                  context: `<${nodeName} ${attr.name}="${attr.value}">`,
                  match: attr.value,
                  contentType: ContentType.XML
                });
              }
            });
          }
          
          // Textinhalt prüfen
          if (options.inValues && element.textContent && pattern.test(element.textContent)) {
            results.push({
              type: 'XML Content',
              path: [...path, nodeName].join('/'),
              line: this.estimateLineNumber(content, element.textContent),
              context: this.getXmlNodePreview(element),
              match: element.textContent,
              contentType: ContentType.XML
            });
          }
          
          // Kinder verarbeiten
          Array.from(element.childNodes).forEach(child => {
            traverse(child, [...path, nodeName]);
          });
        }
        
        // Text-Knoten
        else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (options.inValues && text && pattern.test(text)) {
            // Eltern-Tag finden für Kontext
            const parent = node.parentElement;
            if (parent) {
              results.push({
                type: 'XML Text',
                path: [...path, '#text'].join('/'),
                line: this.estimateLineNumber(content, text),
                context: this.formatValuePreview(text),
                match: text,
                contentType: ContentType.XML
              });
            }
          }
        }
        
        // CDATA-Knoten
        else if (node.nodeType === Node.CDATA_SECTION_NODE) {
          const text = node.textContent?.trim();
          if (options.inValues && text && pattern.test(text)) {
            results.push({
              type: 'XML CDATA',
              path: [...path, '#cdata'].join('/'),
              line: this.estimateLineNumber(content, '<![CDATA['),
              context: `CDATA: ${this.formatValuePreview(text)}`,
              match: text,
              contentType: ContentType.XML
            });
          }
        }
      };
      
      traverse(xmlDoc.documentElement);
    } catch (e) {
      console.error('Error parsing XML:', e);
    }
    
    return results;
  }
  
  // Plaintext für Suche durchsuchen (Zeilenweise)
  private parseTextForSearch(content: string, pattern: RegExp, options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    
    try {
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          results.push({
            type: 'Text',
            path: `line ${index + 1}`,
            line: index + 1,
            context: this.formatValuePreview(line),
            match: line,
            contentType: ContentType.TEXT
          });
        }
      });
    } catch (e) {
      console.error('Error parsing text:', e);
    }
    
    return results;
  }
  
  // Hilft, die ungefähre Zeilennummer zu schätzen
  private estimateLineNumber(content: string, searchString: string): number {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString)) {
        return i + 1;
      }
    }
    
    return 1; // Fallback
  }
  
  // Formatiert Wertvorschau für Kontext
  private formatValuePreview(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'string') {
      return value.length > 50 ? value.substring(0, 47) + '...' : value;
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `Array(${value.length})`;
      } else {
        return 'Object';
      }
    }
    
    return String(value);
  }
  
  // Erstellt eine XML-Knotenvorschau
  private getXmlNodePreview(element: Element): string {
    const tagName = element.nodeName;
    const attributeText = Array.from(element.attributes)
      .map(attr => `${attr.name}="${attr.value}"`)
      .join(' ');
    
    const textContent = element.textContent?.trim() || '';
    const shortText = textContent.length > 30 
      ? textContent.substring(0, 27) + '...' 
      : textContent;
    
    return attributeText 
      ? `<${tagName} ${attributeText}>${shortText ? `${shortText}` : ''}`
      : `<${tagName}>${shortText ? `${shortText}` : ''}`;
  }
} 