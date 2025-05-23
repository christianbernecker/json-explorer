import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HistoryItem as HistoryItemType } from '../types';
import useHighlighter from '../utils/highlighter';
import JsonHistoryPanel from './shared/JsonHistoryPanel';
import Button from './shared/Button';
import Card from './shared/Card';
import { decodeTCStringStrict, getProcessedTCData, ProcessedTCData } from '../services/tcfService';
import EnhancedJsonSearch from './search/EnhancedJsonSearch';

// Component-spezifische Props
interface JsonTcfAnalyzerProps {
  isDarkMode: boolean;
  history: HistoryItemType[];
  setHistory: (history: HistoryItemType[]) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
}

// Component für TCF-String Analyse mit zwei Spalten
const JsonTcfAnalyzer: React.FC<JsonTcfAnalyzerProps> = ({
  isDarkMode,
  history,
  setHistory,
  showHistory,
  setShowHistory
}) => {
  // JSON Input/Output State
  const [jsonInput, setJsonInput] = useState('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [jsonError, setJsonError] = useState('');
  const [isJsonSearchOpen, setIsJsonSearchOpen] = useState(false);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(false);
  
  // TCF-Analyse State
  const [tcfString, setTcfString] = useState<string | null>(null);
  const [processedTcfData, setProcessedTcfData] = useState<ProcessedTCData | null>(null);
  const [tcfError, setTcfError] = useState<string | null>(null);
  const [tcfWarning, setTcfWarning] = useState<string | null>(null);
  const [tcfPath, setTcfPath] = useState<string | null>(null);
  
  // UI State
  const [copyMessage, setCopyMessage] = useState('');
  const [copyMessageVisible, setCopyMessageVisible] = useState(false);
  
  // Refs
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const jsonOutputRef = useRef<HTMLDivElement>(null);
  const tcfOutputRef = useRef<HTMLDivElement>(null);
  
  // Syntax-Highlighter
  const { highlightJson } = useHighlighter();

  // Zeilennummern für JSON hinzufügen
  const addLineNumbers = useCallback((html: string) => {
    if (!html) return '';
    const lines = html.split('\n');
    const zoomLevel = 1; 
    const fontSize = Math.round(12 * zoomLevel);
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

  // Helper function to add to history
  const addToHistoryItem = useCallback((item: HistoryItemType) => {
    // @ts-ignore - setHistory erwartet möglicherweise einen anderen Typ als der, der zurückgegeben wird
    setHistory((prev: HistoryItemType[]) => [item, ...prev].slice(0, 10));
  }, [setHistory]);

  // TCF-String im JSON finden
  const findTcfStringInJson = useCallback((obj: any, path = ''): { path: string, tcfString: string } | null => {
    if (typeof obj !== 'object' || obj === null) return null;
    
    // Direkte Überprüfung auf bekannte TCF-String-Pfade wie gdpr.consent
    if (obj.gdpr && typeof obj.gdpr.consent === 'string' && obj.gdpr.consent.length > 10) {
      // Spezielle Prüfung für das häufig verwendete gdpr.consent-Feld
      return { path: 'gdpr.consent', tcfString: obj.gdpr.consent };
    }
    
    // TCF-String-Pattern: Base64-kodierte Zeichen, beginnend mit typischen TCF-Präfixen
    // Weniger restriktiver Regex, der verschiedene TCF-Formate akzeptiert
    const tcfRegex = /^C[A-Za-z0-9_\-+/=]{10,}$/;
    
    // Rekursiv durch JSON traversieren
    const traverse = (obj: any, path = ''): { path: string, tcfString: string } | null => {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Spezielle Prüfung für consent-Felder, auch wenn sie nicht direkt unter gdpr liegen
        if (key === 'consent' && typeof obj[key] === 'string' && obj[key].length > 20) {
          return { path: currentPath, tcfString: obj[key] };
        }
        
        // Prüfe, ob der aktuelle Wert ein String ist und dem TCF-Pattern entspricht
        if (typeof obj[key] === 'string' && tcfRegex.test(obj[key])) {
          return { path: currentPath, tcfString: obj[key] };
        }
        
        // Rekursiv durch nested Objects gehen
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const result = traverse(obj[key], currentPath);
          if (result) return result;
        }
      }
      return null;
    };
    
    return traverse(obj, path);
  }, []);

  // JSON parsen und TCF-String suchen
  const parseJsonAndFindTcf = useCallback(async () => {
    setJsonError('');
    setTcfString(null);
    setProcessedTcfData(null);
    setTcfError(null);
    setTcfWarning(null);
    setTcfPath(null);
    
    if (!jsonInput.trim()) {
      setJsonError('Please enter JSON content');
      return;
    }
    
    try {
      // JSON parsen
      const parsed = JSON.parse(jsonInput);
      setParsedJson(parsed);
      
      // In History speichern
      const historyItem: HistoryItemType = {
        // @ts-ignore - json_tcf ist möglicherweise nicht als gültiger Typ definiert
        type: 'json_tcf',
        content: jsonInput,
        jsonContent: parsed,
        timestamp: Date.now()
      };
      
      // TCF-String suchen
      const tcfResult = findTcfStringInJson(parsed);
      if (tcfResult) {
        const { path, tcfString: foundTcfString } = tcfResult;
        setTcfString(foundTcfString);
        setTcfPath(path);
        // @ts-ignore - tcfString-Feld fehlt möglicherweise in der HistoryItem-Typdefinition
        historyItem.tcfString = foundTcfString;
        
        // TCF-String dekodieren
        try {
          const { tcModel, error: decodeError } = await decodeTCStringStrict(foundTcfString);
          
          if (decodeError || !tcModel) {
            setTcfError(decodeError || 'Failed to decode TCF string.');
          } else {
            // TCF-Daten verarbeiten
            const processedData = getProcessedTCData(tcModel);
            setProcessedTcfData(processedData);
            
            // Prüfe GVL-Status
            if (processedData?.gvlStatus === 'not_loaded') {
              setTcfWarning('GVL could not be loaded. Vendor details might be incomplete.');
            }
          }
        } catch (error) {
          setTcfError(error instanceof Error ? error.message : 'Unknown error during TCF processing');
        }
      } else {
        setTcfWarning("No TCF string found in the JSON structure.");
      }
      
      // Füge zur History hinzu
      addToHistoryItem(historyItem);
      
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
      setParsedJson(null);
    }
  }, [jsonInput, findTcfStringInJson, addToHistoryItem]);

  // Format JSON button handler
  const handleFormatJson = useCallback(() => {
    if (!jsonInput.trim()) return;
    
    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonInput(formatted);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  }, [jsonInput]);

  // Copy formatted JSON
  const handleCopyJson = useCallback(() => {
    if (!parsedJson) return;
    
    try {
      const formatted = JSON.stringify(parsedJson, null, 2);
      navigator.clipboard.writeText(formatted);
      
      setCopyMessage('JSON copied to clipboard');
      setCopyMessageVisible(true);
      setTimeout(() => setCopyMessageVisible(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, [parsedJson]);

  // Copy TCF string
  const handleCopyTcf = useCallback(() => {
    if (!tcfString) return;
    
    try {
      navigator.clipboard.writeText(tcfString);
      
      setCopyMessage('TCF string copied to clipboard');
      setCopyMessageVisible(true);
      setTimeout(() => setCopyMessageVisible(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, [tcfString]);

  // Clear all
  const handleClear = useCallback(() => {
    setJsonInput('');
    setParsedJson(null);
    setJsonError('');
    setTcfString(null);
    setProcessedTcfData(null);
    setTcfError(null);
    setTcfWarning(null);
    setTcfPath(null);
  }, []);

  // Restore from history
  const handleRestoreFromHistory = useCallback((item: HistoryItemType) => {
    if (item.content) {
      setJsonInput(typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2));
    }
    
    if (item.jsonContent) {
      setParsedJson(item.jsonContent);
    }
    
    // @ts-ignore - tcfString-Eigenschaft möglicherweise nicht in HistoryItem definiert
    if (item.tcfString) {
      // @ts-ignore
      setTcfString(item.tcfString);
    }
    
    setShowHistory(false);
    
    // Reparse um alle Werte zu aktualisieren
    setTimeout(() => {
      // @ts-ignore - parseJsonAndFindTcf erwartet möglicherweise Argumente
      parseJsonAndFindTcf();
    }, 100);
  }, [parseJsonAndFindTcf, setShowHistory]);

  // Render JSON output
  useEffect(() => {
    if (parsedJson && jsonOutputRef.current) {
      try {
        const highlighted = highlightJson(JSON.stringify(parsedJson, null, 2), isDarkMode);
        const withLineNumbers = addLineNumbers(highlighted);
        jsonOutputRef.current.innerHTML = withLineNumbers;
      } catch (error) {
        console.error('Error highlighting JSON:', error);
      }
    }
  }, [parsedJson, highlightJson, addLineNumbers, isDarkMode]);

  // TCF-Komponenten rendern
  const renderTcfContent = useCallback(() => {
    if (tcfError) {
      return (
        <div className={`p-4 rounded-md ${isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-800'}`}>
          <h3 className="text-lg font-medium mb-2">Error Decoding TCF String</h3>
          <p>{tcfError}</p>
        </div>
      );
    }
    
    if (!tcfString) {
      return tcfWarning ? (
        <div className={`p-4 rounded-md ${isDarkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-50 text-yellow-800'}`}>
          <p>{tcfWarning}</p>
        </div>
      ) : null;
    }
    
    if (!processedTcfData) {
      return (
        <div className={`p-4 rounded-md ${isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-800'}`}>
          <p>Found TCF string, but decoding is in progress...</p>
        </div>
      );
    }
    
    return (
      <div className="tcf-data-container">
        <div className="mb-4">
          <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            TCF String Analysis
          </h3>
          {tcfPath && (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Found at: <code className="px-1 py-0.5 rounded bg-opacity-20 font-mono text-xs bg-blue-100">{tcfPath}</code>
            </p>
          )}
          <div className="flex items-center mt-2">
            <div className={`text-sm px-2 py-1 rounded-md font-mono break-all ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              {tcfString}
            </div>
            <button
              onClick={handleCopyTcf}
              className={`ml-2 p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-700'}`}
              title="Copy TCF string"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Basis-Informationen */}
        <div className={`p-4 rounded-md mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Basic Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>TCF Version</div>
            <div className="font-medium">{processedTcfData.version}</div>
            
            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Created</div>
            <div className="font-medium">{processedTcfData.created || 'N/A'}</div>
            
            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Last Updated</div>
            <div className="font-medium">{processedTcfData.lastUpdated || 'N/A'}</div>
            
            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>CMP ID</div>
            <div className="font-medium">{processedTcfData.cmpId || 'N/A'}</div>
            
            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>CMP Version</div>
            <div className="font-medium">{processedTcfData.cmpVersion || 'N/A'}</div>
            
            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Consent Language</div>
            <div className="font-medium">{processedTcfData.consentLanguage || 'N/A'}</div>
          </div>
        </div>
        
        {/* Purposes */}
        <div className={`p-4 rounded-md mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Consented Purposes</h4>
          <div className="flex flex-wrap gap-2">
            {processedTcfData.globalPurposeConsents.length > 0 ? (
              processedTcfData.globalPurposeConsents.map(purpose => (
                <span 
                  key={`purpose-${purpose}`}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-green-700 text-green-100' : 'bg-green-100 text-green-800'}`}
                >
                  Purpose {purpose}
                </span>
              ))
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No consented purposes found</p>
            )}
          </div>
        </div>
        
        {/* Legitimate Interest */}
        <div className={`p-4 rounded-md mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Legitimate Interest Purposes</h4>
          <div className="flex flex-wrap gap-2">
            {processedTcfData.globalPurposeLegitimateInterests.length > 0 ? (
              processedTcfData.globalPurposeLegitimateInterests.map(purpose => (
                <span 
                  key={`li-${purpose}`}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-blue-700 text-blue-100' : 'bg-blue-100 text-blue-800'}`}
                >
                  Purpose {purpose}
                </span>
              ))
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No legitimate interest purposes found</p>
            )}
          </div>
        </div>
        
        {/* Special Features */}
        <div className={`p-4 rounded-md mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Special Features Opt-In</h4>
          <div className="flex flex-wrap gap-2">
            {processedTcfData.globalSpecialFeatureOptIns.length > 0 ? (
              processedTcfData.globalSpecialFeatureOptIns.map(feature => (
                <span 
                  key={`sf-${feature}`}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-purple-700 text-purple-100' : 'bg-purple-100 text-purple-800'}`}
                >
                  Feature {feature}
                </span>
              ))
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No special features opted in</p>
            )}
          </div>
        </div>
        
        {/* Vendor Summary */}
        <div className={`p-4 rounded-md mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Key Vendors</h4>
          <div className="overflow-auto max-h-60">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">Consent</th>
                  <th className="px-3 py-2 text-left text-xs font-medium tracking-wider">LI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {processedTcfData.keyVendorResults.length > 0 ? (
                  processedTcfData.keyVendorResults.map(vendor => (
                    <tr key={`vendor-${vendor.id}`} className={isDarkMode ? 'odd:bg-gray-800 even:bg-gray-700' : 'odd:bg-white even:bg-gray-50'}>
                      <td className="px-3 py-2 text-xs">{vendor.id}</td>
                      <td className="px-3 py-2 text-xs font-medium">{vendor.name}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block w-4 h-4 rounded-full ${vendor.hasConsent ? (isDarkMode ? 'bg-green-500' : 'bg-green-400') : (isDarkMode ? 'bg-red-500' : 'bg-red-400')}`}></span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block w-4 h-4 rounded-full ${vendor.hasLegitimateInterest ? (isDarkMode ? 'bg-green-500' : 'bg-green-400') : (isDarkMode ? 'bg-red-500' : 'bg-red-400')}`}></span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-center text-sm italic">No vendor information available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* GVL Status Warning */}
        {processedTcfData.gvlStatus !== 'loaded' && (
          <div className={`p-3 rounded-md text-sm ${isDarkMode ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-50 text-yellow-800'}`}>
            <p>{processedTcfData.gvlStatus === 'error_loading' 
              ? 'Error loading Global Vendor List. Vendor information may be incomplete.'
              : 'Global Vendor List not loaded. Vendor information may be incomplete.'}</p>
          </div>
        )}
      </div>
    );
  }, [tcfString, tcfError, tcfWarning, tcfPath, processedTcfData, isDarkMode, handleCopyTcf]);
  
  // Styling
  const textAreaBorderColor = jsonError 
    ? (isDarkMode ? 'border-red-500' : 'border-red-500') 
    : (isDarkMode ? 'border-gray-600' : 'border-gray-300');

  return (
    <div className="w-full h-full flex flex-col">
      {/* JSON-Eingabebereich */}
      <Card isDarkMode={isDarkMode} className="mb-4" withPadding>
        <div className="mb-2">
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            JSON Input
          </h3>
          <textarea
            ref={textAreaRef}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className={`w-full p-3 rounded-md font-mono text-sm resize-y min-h-[150px] ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-100 placeholder-gray-500' 
                : 'bg-white text-gray-800 placeholder-gray-400'
            } border ${textAreaBorderColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Paste your JSON here..."
          />
          {jsonError && (
            <div className={`mt-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              {jsonError}
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={parseJsonAndFindTcf} 
            variant="primary" 
            isDarkMode={isDarkMode}
          >
            Parse & Find TCF
          </Button>
          <Button 
            onClick={handleFormatJson} 
            variant="secondary" 
            isDarkMode={isDarkMode}
          >
            Format JSON
          </Button>
          <Button 
            onClick={handleClear} 
            variant="secondary" 
            isDarkMode={isDarkMode}
          >
            Clear
          </Button>
        </div>
      </Card>
      
      {/* Ergebnisbereich: JSON und TCF nebeneinander */}
      {parsedJson && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* JSON Output */}
          <Card isDarkMode={isDarkMode} className="flex-1 mb-4 lg:mb-0" withPadding>
            <div className="mb-2 flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Formatted JSON
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsWordWrapEnabled(!isWordWrapEnabled)}
                  className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  title={isWordWrapEnabled ? 'Disable word wrap' : 'Enable word wrap'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7"></path>
                  </svg>
                </button>
                <button
                  onClick={() => setIsJsonSearchOpen(!isJsonSearchOpen)}
                  className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  title="Search in JSON"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </button>
                <button
                  onClick={handleCopyJson}
                  className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                  title="Copy JSON"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* JSON Suche */}
            <EnhancedJsonSearch
              isDarkMode={isDarkMode}
              containerRef={jsonOutputRef}
              isVisible={isJsonSearchOpen}
              onClose={() => setIsJsonSearchOpen(false)}
            />
            
            {/* JSON Output mit Zeilennummern */}
            <div className="json-output-container relative">
              <div 
                ref={jsonOutputRef}
                className={`w-full overflow-auto ${isWordWrapEnabled ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}
                style={{ maxWidth: "100%", maxHeight: "calc(100vh - 500px)" }}
              />
            </div>
          </Card>
          
          {/* TCF Analyse */}
          <Card isDarkMode={isDarkMode} className="flex-1" withPadding>
            <div ref={tcfOutputRef}>
              {renderTcfContent()}
            </div>
          </Card>
        </div>
      )}
      
      {/* History Panel */}
      {showHistory && (
        // @ts-ignore - onRestore-Prop möglicherweise nicht in JsonHistoryPanelProps definiert
        <JsonHistoryPanel
          isDarkMode={isDarkMode}
          history={history}
          onRestore={handleRestoreFromHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
      
      {/* Copy-Message */}
      {copyMessageVisible && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-md z-50 transition-opacity duration-300 ${
          isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800'
        }`}>
          {copyMessage}
        </div>
      )}
    </div>
  );
};

export default JsonTcfAnalyzer; 