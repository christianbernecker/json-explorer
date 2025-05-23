import React, { useState, useCallback, useRef, useEffect } from 'react';
// Inline-Definition der Props, da es Importprobleme mit der JsonDiffToolProps-Schnittstelle gibt
interface JsonDiffToolProps {
  isDarkMode: boolean;
}
import useHighlighter from '../utils/highlighter';
import Button from './shared/Button';
import Card from './shared/Card';

const JsonDiffTool: React.FC<JsonDiffToolProps> = ({ isDarkMode }) => {
  // State für JSON-Inhalte
  const [leftJson, setLeftJson] = useState<string>('');
  const [rightJson, setRightJson] = useState<string>('');
  const [parsedLeftJson, setParsedLeftJson] = useState<any>(null);
  const [parsedRightJson, setParsedRightJson] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  // State für Vergleichsmodus
  const [mode, setMode] = useState<'full' | 'structure' | 'values'>('full');
  
  // State für Vergleichsergebnisse
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [valueCount, setValueCount] = useState<number>(0);
  const [structureCount, setStructureCount] = useState<number>(0);
  
  // Refs für Textareas
  const leftTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const rightTextAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Utility-Funktion zum Highlighting
  const { highlightJson } = useHighlighter();
  
  // Vergleicht zwei JSON-Objekte
  const compareJson = useCallback((left: any, right: any) => {
    // Hilfsfunktion zum tiefen Vergleich
    const deepCompare = (obj1: any, obj2: any, path = ''): any => {
      // Inhalte formatieren für bessere Lesbarkeit
      const formatValue = (val: any): string => {
        if (val === null) return 'null';
        if (val === undefined) return 'undefined';
        if (typeof val === 'object') {
          if (Array.isArray(val)) {
            return `Array[${val.length}]`;
          }
          return 'Object';
        }
        return String(val);
      };
      
      // Fallunterscheidungen: Beide null/undefined, verschiedene Typen, primitiv vs. Objekt...
      if (obj1 === obj2) return null; // Gleich, kein Unterschied
      
      if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
        return {
          type: 'missing',
          path,
          left: formatValue(obj1),
          right: formatValue(obj2)
        };
      }
      
      if (typeof obj1 !== typeof obj2) {
        return {
          type: 'type',
          path,
          left: formatValue(obj1),
          right: formatValue(obj2)
        };
      }
      
      if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return {
          type: 'value',
          path,
          left: formatValue(obj1),
          right: formatValue(obj2)
        };
      }
      
      // Arrays vs. Objekte - verschiedene Struktur
      const isArray1 = Array.isArray(obj1);
      const isArray2 = Array.isArray(obj2);
      
      if (isArray1 !== isArray2) {
        return {
          type: 'structure',
          path,
          left: formatValue(obj1),
          right: formatValue(obj2)
        };
      }
      
      // Struktur gleich, Inhalt prüfen
      const differences: any[] = [];
      
      // Alle Schlüssel von obj1 durchgehen
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      for (const key of keys1) {
        const childPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj2)) {
          differences.push({
            type: 'missing',
            path: childPath,
            left: formatValue(obj1[key]),
            right: null
          });
          continue;
        }
        
        const diff = deepCompare(obj1[key], obj2[key], childPath);
        if (diff) {
          if (Array.isArray(diff)) {
            differences.push(...diff);
          } else {
            differences.push(diff);
          }
        }
      }
      
      // Schlüssel in obj2 aber nicht in obj1
      for (const key of keys2) {
        if (!(key in obj1)) {
          const childPath = path ? `${path}.${key}` : key;
          differences.push({
            type: 'missing',
            path: childPath,
            left: null,
            right: formatValue(obj2[key])
          });
        }
      }
      
      return differences.length ? differences : null;
    };
    
    try {
      const differences = deepCompare(left, right);
      
      if (!differences) {
        return { identical: true };
      }
      
      // Zähle verschiedene Unterschiede
      const valueDiffs = differences.filter((d: any) => d.type === 'value').length;
      const structureDiffs = differences.filter((d: any) => d.type === 'missing' || d.type === 'structure' || d.type === 'type').length;
      
      setValueCount(valueDiffs);
      setStructureCount(structureDiffs);
      
      return {
        identical: false,
        differences
      };
    } catch (err) {
      console.error('Error in JSON comparison:', err);
      return null;
    }
  }, []);
  
  // Handler für Vergleich-Button
  const handleCompare = useCallback(() => {
    try {
      setError('');
      
      if (!leftJson.trim() || !rightJson.trim()) {
        setError('Please enter JSON in both panels');
        return;
      }
      
      const leftObj = JSON.parse(leftJson);
      const rightObj = JSON.parse(rightJson);
      
      setParsedLeftJson(leftObj);
      setParsedRightJson(rightObj);
      
      const results = compareJson(leftObj, rightObj);
      setComparisonResults(results);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      setComparisonResults(null);
    }
  }, [leftJson, rightJson, compareJson]);
  
  // Handler für Clear-Button
  const handleClear = useCallback(() => {
    setLeftJson('');
    setRightJson('');
    setParsedLeftJson(null);
    setParsedRightJson(null);
    setComparisonResults(null);
    setError('');
  }, []);
  
  // JSON-Eingabe aktualisieren
  const handleLeftJsonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLeftJson(e.target.value);
  }, []);
  
  const handleRightJsonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRightJson(e.target.value);
  }, []);
  
  // Modus-Umschaltung
  const handleModeChange = useCallback((newMode: 'full' | 'structure' | 'values') => {
    setMode(newMode);
  }, []);
  
  // Filtere Ergebnisse basierend auf dem gewählten Modus
  const filteredResults = useCallback(() => {
    if (!comparisonResults || !comparisonResults.differences) return null;
    
    if (mode === 'full') return comparisonResults.differences;
    
    if (mode === 'structure') {
      return comparisonResults.differences.filter((d: any) => 
        d.type === 'missing' || d.type === 'structure' || d.type === 'type'
      );
    }
    
    if (mode === 'values') {
      return comparisonResults.differences.filter((d: any) => d.type === 'value');
    }
    
    return null;
  }, [comparisonResults, mode]);
  
  // Highlight-Funktion für Side-by-Side-Anzeige
  const renderHighlightedJson = useCallback((jsonObj: any) => {
    try {
      return highlightJson(jsonObj, isDarkMode);
    } catch (error) {
      return '<div class="text-red-500">Error formatting JSON</div>';
    }
  }, [highlightJson, isDarkMode]);
  
  return (
    <div className="w-full container mx-auto px-4 pb-12 pt-4">
      {/* Modus-Auswahl */}
      <div className="mb-6">
        <Card isDarkMode={isDarkMode} withPadding={false} className="border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <h3 className={`text-base font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Comparison Mode:</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleModeChange('full')}
                variant={mode === 'full' ? 'primary' : 'secondary'}
                isDarkMode={isDarkMode}
                className="px-4 py-2"
              >
                Compare Comparision
              </Button>
              <Button
                onClick={() => handleModeChange('structure')}
                variant={mode === 'structure' ? 'primary' : 'secondary'}
                isDarkMode={isDarkMode}
                className="px-4 py-2"
              >
                Structure Only
              </Button>
              <Button
                onClick={() => handleModeChange('values')}
                variant={mode === 'values' ? 'primary' : 'secondary'}
                isDarkMode={isDarkMode}
                className="px-4 py-2"
              >
                Values Only
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* JSON-Eingabefelder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card isDarkMode={isDarkMode} withPadding className="border border-gray-200 dark:border-gray-700">
          <h3 className={`text-base md:text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Left JSON</h3>
          <textarea
            ref={leftTextAreaRef}
            value={leftJson}
            onChange={handleLeftJsonChange}
            placeholder="Paste your first JSON here..."
            className={`w-full h-64 p-3 border rounded-lg font-mono text-xs mb-2 outline-none transition ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </Card>
        
        <Card isDarkMode={isDarkMode} withPadding className="border border-gray-200 dark:border-gray-700">
          <h3 className={`text-base md:text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Right JSON</h3>
          <textarea
            ref={rightTextAreaRef}
            value={rightJson}
            onChange={handleRightJsonChange}
            placeholder="Paste your second JSON here..."
            className={`w-full h-64 p-3 border rounded-lg font-mono text-xs mb-2 outline-none transition ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </Card>
      </div>
      
      {/* Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button 
          onClick={handleCompare} 
          variant="primary" 
          isDarkMode={isDarkMode}
          title="Compare JSONs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Compare
        </Button>
        <Button 
          onClick={handleClear} 
          variant="secondary" 
          isDarkMode={isDarkMode}
          title="Clear all inputs"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </Button>
      </div>
      
      {/* Fehlermeldung */}
      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-800">
          <p>{error}</p>
        </div>
      )}
      
      {/* Vergleichsergebnisse */}
      {comparisonResults && (
        <div className="space-y-6">
          <Card isDarkMode={isDarkMode} withPadding className="border border-gray-200 dark:border-gray-700">
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Comparison Results
              </div>
            </h2>
            
            {/* Zusammenfassung */}
            <div className="mb-4">
              <h3 className={`text-base font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Comparison Summary</h3>
              
              {comparisonResults.identical ? (
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-md text-green-800 dark:text-green-100">
                  JSONs are identical
                </div>
              ) : (
                <div>
                  <div className="flex flex-col md:flex-row gap-4">
                    {valueCount > 0 && (
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md text-yellow-800 dark:text-yellow-100">
                        <strong>Value Differences: {valueCount}</strong>
                        <p className="text-sm mt-1">In fields that exist in both JSON objects</p>
                      </div>
                    )}
                    
                    {structureCount > 0 && (
                      <div className="p-3 bg-red-100 dark:bg-red-900 rounded-md text-red-800 dark:text-red-100">
                        <strong>Structure Differences: {structureCount}</strong>
                        <p className="text-sm mt-1">Missing fields or type differences</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Detaillierte Unterschiede */}
            {!comparisonResults.identical && filteredResults() && (
              <div>
                <h3 className={`text-base font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Value Differences ({filteredResults().length})
                </h3>
                
                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                      <tr>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Path</th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Left Value</th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Right Value</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {filteredResults().map((diff: any, index: number) => (
                        <tr key={index} className={`${diff.type === 'value' ? (isDarkMode ? 'bg-yellow-900 bg-opacity-20' : 'bg-yellow-50') : (isDarkMode ? 'bg-red-900 bg-opacity-20' : 'bg-red-50')}`}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{diff.path}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${diff.left === null ? 'text-red-500 italic' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                            {diff.left === null ? 'Missing' : diff.left}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${diff.right === null ? 'text-red-500 italic' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                            {diff.right === null ? 'Missing' : diff.right}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
          
          {/* Side-by-Side-Ansicht */}
          {parsedLeftJson && parsedRightJson && (
            <Card isDarkMode={isDarkMode} withPadding className="border border-gray-200 dark:border-gray-700">
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Side-by-Side View</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 overflow-auto h-96 rounded-md border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Left JSON</h3>
                  <pre 
                    className={`text-xs font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-800'} whitespace-pre-wrap break-words`}
                    dangerouslySetInnerHTML={{ __html: renderHighlightedJson(parsedLeftJson) }}
                  />
                </div>
                <div className={`p-4 overflow-auto h-96 rounded-md border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Right JSON</h3>
                  <pre 
                    className={`text-xs font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-800'} whitespace-pre-wrap break-words`}
                    dangerouslySetInnerHTML={{ __html: renderHighlightedJson(parsedRightJson) }}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-between text-xs">
                <div className={`flex items-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  <span className={`inline-block w-3 h-3 rounded-full mr-1 ${isDarkMode ? 'bg-red-500' : 'bg-red-500'}`}></span>
                  Missing in Right
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  <span className={`inline-block w-3 h-3 rounded-full mr-1 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-500'}`}></span>
                  Missing in Left
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  <span className={`inline-block w-3 h-3 rounded-full mr-1 ${isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'}`}></span>
                  Different Values
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default JsonDiffTool; 