import { useCallback } from 'react';

/**
 * Hook zum Hinzufügen von Zeilennummern zu formatierten Code-Beispielen
 * 
 * @param isDarkMode Ob die Anwendung im Dark Mode ist
 * @returns Eine Callback-Funktion zum Hinzufügen von Zeilennummern 
 */
export function useAddLineNumbers(isDarkMode: boolean) {
  return useCallback((html: string, language: string = '') => {
    if (!html) return '';
    
    const lines = html.split('\n');
    const zoomLevel = 1; 
    const fontSize = Math.round(12 * zoomLevel); // 12px ist die Standardgröße für text-sm
    
    let result = '<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; table-layout: fixed; border-collapse: collapse;">';
    
    lines.forEach((line, index) => {
      result += `
        <tr>
          <td style="width: 30px; text-align: right; color: ${isDarkMode ? '#9ca3af' : '#999'}; user-select: none; padding-right: 8px; font-size: ${fontSize}px; border-right: 1px solid ${isDarkMode ? '#4b5563' : '#ddd'}; vertical-align: top;">${index + 1}</td>
          <td style="padding-left: 8px; font-family: monospace; font-size: ${fontSize}px;">${line || '&nbsp;'}</td>
        </tr>
      `;
    });
    
    result += '</table>';
    return result;
  }, [isDarkMode]); 
}

export default useAddLineNumbers; 