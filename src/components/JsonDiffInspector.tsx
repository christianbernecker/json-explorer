import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  JsonDiffInspectorProps,
  StructuralDifference, 
  ValueDifference,
  HistoryItem as HistoryItemType
} from '../types';
import useHighlighter from '../utils/highlighter';
import { HistoryItem } from './shared';
import Button from './shared/Button';
import Card from './shared/Card';

// JSON Diff Inspector Component
const JsonDiffInspector = React.memo(({ 
  isDarkMode, 
  history,
  setHistory,
  showHistory,
  setShowHistory
}: JsonDiffInspectorProps) => {
  // Refs for content
  const leftContentRef = useRef<HTMLDivElement>(null);
  
  const [leftJsonInput, setLeftJsonInput] = useState('');
  const [rightJsonInput, setRightJsonInput] = useState('');
  const [comparisonResult, setComparisonResult] = useState<{
    structureDifferences: StructuralDifference[],
    valueDifferences: ValueDifference[]
  } | null>(null);
  const [comparisonMode, setComparisonMode] = useState('both'); // 'structure', 'values', or 'both'
  const [error, setError] = useState('');
  const [fontSize, setFontSize] = useState(12); // Use fontSize directly instead of zoomLevel
  
  // Custom hook for syntax highlighting
  const { highlightJson } = useHighlighter();
  
  // Optimized function to add line numbers
  const addLineNumbers = useCallback((html: string, type: string) => {
    if (!html) return '';
    
    const lines = html.split('\n');
    let result = '<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; table-layout: fixed; border-collapse: collapse;">';
    
    lines.forEach((line, index) => {
      result += `
        <tr>
          <td style="width: 30px; text-align: right; color: ${isDarkMode ? '#9ca3af' : '#999'}; user-select: none; padding-right: 8px; font-size: ${fontSize}px; border-right: 1px solid ${isDarkMode ? '#4b5563' : '#ddd'}; vertical-align: top;">${index + 1}</td>
          <td style="padding-left: 8px; white-space: pre-wrap; font-family: monospace; font-size: ${fontSize}px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-all; max-width: calc(100% - 38px);">${line}</td>
        </tr>
      `;
    });
    
    result += '</table>';
    return result;
  }, [fontSize, isDarkMode]);
  
  // Find structural differences between two JSON objects
  const findStructuralDifferences = useCallback((sourceObj: any, targetObj: any, path: string, differences: StructuralDifference[], side: string) => {
    if (typeof sourceObj !== 'object' || sourceObj === null) return;
    
    Object.keys(sourceObj).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (targetObj === null || typeof targetObj !== 'object' || !(key in targetObj)) {
        differences.push({
          path: currentPath,
          type: side === 'left' ? 'missing_in_right' : 'missing_in_left',
          description: side === 'left' 
            ? `Field exists in left JSON but missing in right JSON` 
            : `Field exists in right JSON but missing in left JSON`
        });
      } else if (typeof sourceObj[key] === 'object' && sourceObj[key] !== null) {
        // Recursively check nested objects
        findStructuralDifferences(sourceObj[key], targetObj[key], currentPath, differences, side);
      }
    });
  }, []);
  
  // Find value differences between two JSON objects
  const findValueDifferences = useCallback((leftObj: any, rightObj: any, path: string, differences: ValueDifference[]) => {
    if (typeof leftObj !== 'object' || leftObj === null || typeof rightObj !== 'object' || rightObj === null) {
      if (leftObj !== rightObj) {
        differences.push({
          path: path || 'root',
          leftValue: leftObj,
          rightValue: rightObj,
          description: `Values are different`
        });
      }
      return;
    }
    
    // Get common keys (fields that exist in both objects)
    const keys = Object.keys(leftObj).filter(key => Object.keys(rightObj).includes(key));
    
    keys.forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const leftValue = leftObj[key];
      const rightValue = rightObj[key];
      
      if (typeof leftValue !== typeof rightValue) {
        differences.push({
          path: currentPath,
          leftValue: leftValue,
          rightValue: rightValue,
          description: `Types are different: ${typeof leftValue} vs ${typeof rightValue}`
        });
      } else if (typeof leftValue === 'object' && leftValue !== null) {
        // Recursively check nested objects
        findValueDifferences(leftValue, rightValue, currentPath, differences);
      } else if (leftValue !== rightValue) {
        differences.push({
          path: currentPath,
          leftValue: leftValue,
          rightValue: rightValue,
          description: `Values are different`
        });
      }
    });
  }, []);
  
  // Format difference values for display
  const formatDiffValue = useCallback((value: any) => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }, []);
  
  // Restore item from history
  const handleRestoreFromHistory = useCallback((item: HistoryItemType) => {
    if (item.type === 'json_diff' && item.leftJson && item.rightJson) {
      setLeftJsonInput(item.leftJson);
      setRightJsonInput(item.rightJson);
      if (item.comparisonMode) {
        setComparisonMode(item.comparisonMode);
      }
      
      // Perform comparison
      try {
        const leftJson = JSON.parse(item.leftJson);
        const rightJson = JSON.parse(item.rightJson);
        
        const result = {
          structureDifferences: [] as StructuralDifference[],
          valueDifferences: [] as ValueDifference[],
        };
        
        // Compare structure and values based on selected mode
        if (item.comparisonMode === 'structure' || item.comparisonMode === 'both') {
          findStructuralDifferences(leftJson, rightJson, '', result.structureDifferences, 'left');
          findStructuralDifferences(rightJson, leftJson, '', result.structureDifferences, 'right');
        }
        
        if (item.comparisonMode === 'values' || item.comparisonMode === 'both') {
          findValueDifferences(leftJson, rightJson, '', result.valueDifferences);
        }
        
        // Sort differences by path for better readability
        result.structureDifferences.sort((a, b) => 
          a.path && b.path ? a.path.localeCompare(b.path) : 0
        );
        result.valueDifferences.sort((a, b) => 
          a.path && b.path ? a.path.localeCompare(b.path) : 0
        );
        
        setComparisonResult(result);
        setError('');
      } catch (err: any) {
        setError(`Parsing error: ${err.message}`);
        setComparisonResult(null);
      }
      
      // Hide history panel after restore
      setShowHistory(false);
    }
  }, [findStructuralDifferences, findValueDifferences, setShowHistory]);
  
  // Compare JSON objects
  const compareJson = useCallback(() => {
    try {
      if (!leftJsonInput.trim() || !rightJsonInput.trim()) {
        setError('Please provide JSON for both sides.');
        return;
      }
      
      const leftJson = JSON.parse(leftJsonInput);
      const rightJson = JSON.parse(rightJsonInput);
      
      const result = {
        structureDifferences: [] as StructuralDifference[],
        valueDifferences: [] as ValueDifference[],
      };
      
      // Compare structure and values based on selected mode
      if (comparisonMode === 'structure' || comparisonMode === 'both') {
        findStructuralDifferences(leftJson, rightJson, '', result.structureDifferences, 'left');
        findStructuralDifferences(rightJson, leftJson, '', result.structureDifferences, 'right');
      }
      
      if (comparisonMode === 'values' || comparisonMode === 'both') {
        findValueDifferences(leftJson, rightJson, '', result.valueDifferences);
      }
      
      // Sort differences by path for better readability
      result.structureDifferences.sort((a, b) => 
        a.path && b.path ? a.path.localeCompare(b.path) : 0
      );
      result.valueDifferences.sort((a, b) => 
        a.path && b.path ? a.path.localeCompare(b.path) : 0
      );
      
      setComparisonResult(result);
      setError('');
      
      // Add to history
      const newHistoryItem: HistoryItemType = {
        id: Date.now().toString(),
        type: 'json_diff',
        content: `Comparison of JSON objects (${comparisonMode} mode)`,
        leftJson: leftJsonInput,
        rightJson: rightJsonInput,
        comparisonMode: comparisonMode,
        timestamp: Date.now()
      };
      
      // Add to history (limit to 10 items)
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
      
    } catch (err: any) {
      setError(`Parsing error: ${err.message}`);
      setComparisonResult(null);
    }
  }, [leftJsonInput, rightJsonInput, comparisonMode, findStructuralDifferences, findValueDifferences, setHistory]);
  
  // Handle input changes
  const handleLeftInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLeftJsonInput(e.target.value);
  }, []);
  
  const handleRightInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRightJsonInput(e.target.value);
  }, []);
  
  // Clear inputs and results
  const handleClear = useCallback(() => {
    setLeftJsonInput('');
    setRightJsonInput('');
    setComparisonResult(null);
    setError('');
  }, []);
  
  // Add keyboard shortcuts specific to this component
  useEffect(() => {
    const handleDiffKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'c': // Compare JSONs
            e.preventDefault();
            compareJson();
            break;
          case 'l': // Clear Inputs & Results
            e.preventDefault();
            handleClear();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleDiffKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDiffKeyDown);
    };
  }, [compareJson, handleClear]); // Add dependencies
  
  // Hilfsfunktion zum Anpassen der Schriftgröße
  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + 1, 20));
  }, []);
  
  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - 1, 8));
  }, []);
  
  const resetFontSize = useCallback(() => {
    setFontSize(12);
  }, []);
  
  return (
    <div className="w-full h-full">
      {/* History overlay */}
      {showHistory && history.length > 0 && (
        <div className="absolute z-10 top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Comparisons</h2>
              <button 
                onClick={() => setShowHistory(false)}
                className={`p-1 rounded-full ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              {history.map((item, index) => (
                <HistoryItem 
                  key={item.id || index}
                  item={item} 
                  onClick={() => handleRestoreFromHistory(item)} 
                  isDarkMode={isDarkMode} 
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="w-full container mx-auto flex flex-col space-y-6">
        {/* Comparison mode selector */}
        <Card isDarkMode={isDarkMode} withPadding className="border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 items-center">
            <h3 className={`font-medium mr-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Comparison Mode:</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setComparisonMode('both')}
                variant={comparisonMode === 'both' ? 'primary' : 'secondary'}
                isDarkMode={isDarkMode}
                size="sm"
              >
                Full Comparison
              </Button>
              <Button
                onClick={() => setComparisonMode('structure')}
                variant={comparisonMode === 'structure' ? 'primary' : 'secondary'}
                isDarkMode={isDarkMode}
                size="sm"
              >
                Structure Only
              </Button>
              <Button
                onClick={() => setComparisonMode('values')}
                variant={comparisonMode === 'values' ? 'primary' : 'secondary'}
                isDarkMode={isDarkMode}
                size="sm"
              >
                Values Only
              </Button>
            </div>
          </div>
        </Card>
        
        {/* JSON input panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card isDarkMode={isDarkMode} withPadding className="border border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Left JSON</h3>
            <textarea
              value={leftJsonInput}
              onChange={handleLeftInputChange}
              placeholder="Paste your first JSON here..."
              className={`w-full h-60 p-3 font-mono text-sm border rounded focus:outline-none transition ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </Card>
          
          <Card isDarkMode={isDarkMode} withPadding className="border border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Right JSON</h3>
            <textarea
              value={rightJsonInput}
              onChange={handleRightInputChange}
              placeholder="Paste your second JSON here..."
              className={`w-full h-60 p-3 font-mono text-sm border rounded focus:outline-none transition ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </Card>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={compareJson}
            variant="primary"
            isDarkMode={isDarkMode}
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
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </Button>
          <Button
            onClick={() => setShowHistory(true)}
            variant="secondary"
            isDarkMode={isDarkMode}
            disabled={history.length === 0}
            title="Show recent comparisons"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History ({history.length})
          </Button>
          
          {/* Font Size Controls */}
          <div className="ml-auto flex items-center space-x-2">
            <Button 
              onClick={decreaseFontSize}
              variant="secondary"
              isDarkMode={isDarkMode}
              size="sm"
              title="Decrease font size"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </Button>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{fontSize}px</span>
            <Button 
              onClick={increaseFontSize}
              variant="secondary"
              isDarkMode={isDarkMode}
              size="sm"
              title="Increase font size"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </Button>
            <Button 
              onClick={resetFontSize}
              variant="secondary"
              isDarkMode={isDarkMode}
              size="sm"
              title="Reset font size"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className={`p-4 rounded-md ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
            <p>{error}</p>
          </div>
        )}
        
        {/* Comparison results */}
        {comparisonResult && (
          <div className="space-y-4">
            <Card isDarkMode={isDarkMode} withPadding className="border border-gray-200 dark:border-gray-700 w-full">
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Comparison Results</h2>
              
              <div className="mb-4 w-full">
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Summary</h3>
                
                <div className="flex flex-wrap gap-4 w-full">
                  {comparisonResult.structureDifferences.length === 0 && comparisonResult.valueDifferences.length === 0 ? (
                    <div className={`p-3 rounded-md ${isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'} w-full`}>
                      <p className="font-medium">JSON objects are identical</p>
                    </div>
                  ) : (
                    <>
                      {comparisonResult.structureDifferences.length > 0 && (
                        <div className={`p-3 rounded-md ${isDarkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'} flex-grow`}>
                          <p className="font-medium">Structure Differences: {comparisonResult.structureDifferences.length}</p>
                          <p className="text-sm">Missing fields or type mismatches</p>
                        </div>
                      )}
                      
                      {comparisonResult.valueDifferences.length > 0 && (
                        <div className={`p-3 rounded-md ${isDarkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800'} flex-grow`}>
                          <p className="font-medium">Value Differences: {comparisonResult.valueDifferences.length}</p>
                          <p className="text-sm">Fields that exist in both but have different values</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Structure differences */}
              {comparisonResult.structureDifferences.length > 0 && (comparisonMode === 'structure' || comparisonMode === 'both') && (
                <div className="mb-6">
                  <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Structure Differences</h3>
                  
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                        <tr>
                          <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Path</th>
                          <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Issue</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {comparisonResult.structureDifferences.map((diff, index) => (
                          <tr key={index} className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{diff.path}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{diff.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Value differences */}
              {comparisonResult.valueDifferences.length > 0 && (comparisonMode === 'values' || comparisonMode === 'both') && (
                <div>
                  <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Value Differences</h3>
                  
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
                        {comparisonResult.valueDifferences.map((diff, index) => (
                          <tr key={index} className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{diff.path}</td>
                            <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} break-words`}>{formatDiffValue(diff.leftValue)}</td>
                            <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} break-words`}>{formatDiffValue(diff.rightValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
            
            {/* Side-by-side view */}
            <Card isDarkMode={isDarkMode} withPadding className="border border-gray-200 dark:border-gray-700 w-full">
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Side-by-Side View</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                <div className={`p-4 rounded-lg border overflow-auto break-words ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} h-[500px] w-full`}>
                  <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Left JSON</h3>
                  <div 
                    ref={leftContentRef}
                    dangerouslySetInnerHTML={{ 
                      __html: addLineNumbers(highlightJson(JSON.parse(leftJsonInput), isDarkMode), 'json') 
                    }}
                    className="w-full"
                  />
                </div>
                <div className={`p-4 rounded-lg border overflow-auto break-words ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} h-[500px] w-full`}>
                  <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Right JSON</h3>
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: addLineNumbers(highlightJson(JSON.parse(rightJsonInput), isDarkMode), 'json') 
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
});

export default JsonDiffInspector; 