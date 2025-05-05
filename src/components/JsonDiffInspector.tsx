import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  JsonDiffInspectorProps,
  StructuralDifference, 
  ValueDifference,
  HistoryItem as HistoryItemType
} from '../types';
import useHighlighter from '../utils/highlighter';
import { HistoryItem } from './shared';

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
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Custom hook for syntax highlighting
  const { highlightJson } = useHighlighter();
  
  // Optimized function to add line numbers
  const addLineNumbers = useCallback((html: string, type: string) => {
    if (!html) return '';
    
    const lines = html.split('\n');
    let result = '<table cellpadding="0" cellspacing="0" border="0" style="width: 100%; table-layout: fixed; border-collapse: collapse;">';
    
    // Calculate font size based on zoom level
    const fontSize = Math.round(12 * zoomLevel);
    
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
  }, [zoomLevel, isDarkMode]);
  
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
        type: 'json_diff',
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
  
  // Render comparison results
  const renderComparisonResults = useCallback(() => {
    if (!comparisonResult) return null;
    
    const { structureDifferences, valueDifferences } = comparisonResult;
    const hasStructuralDiffs = structureDifferences.length > 0 && (comparisonMode === 'structure' || comparisonMode === 'both');
    const hasValueDiffs = valueDifferences.length > 0 && (comparisonMode === 'values' || comparisonMode === 'both');
    
    if (!hasStructuralDiffs && !hasValueDiffs) {
      return (
        <div className={`p-4 border rounded-lg ${
          isDarkMode ? 'bg-green-900 text-green-100 border-green-800' : 'bg-green-50 text-green-800 border-green-100'
        }`}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">No differences found! The JSON objects are identical.</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Summary of differences */}
        <div className={`p-4 border rounded-lg ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Comparison Summary
          </h3>
          <div className="flex flex-wrap gap-4">
            {hasStructuralDiffs && (
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-200' : 'bg-red-50 text-red-800'
              }`}>
                <div className="font-semibold">Structural Differences: {structureDifferences.length}</div>
                <div className="text-sm mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                  }`}>
                    Missing in Right: {structureDifferences.filter(d => d.type === 'missing_in_right').length}
                  </span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                  }`}>
                    Missing in Left: {structureDifferences.filter(d => d.type === 'missing_in_left').length}
                  </span>
                </div>
              </div>
            )}
            
            {hasValueDiffs && (
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-amber-900 bg-opacity-20 text-amber-200' : 'bg-amber-50 text-amber-800'
              }`}>
                <div className="font-semibold">Value Differences: {valueDifferences.length}</div>
                <div className="text-sm mt-1">
                  In fields that exist in both JSON objects
                </div>
              </div>
            )}
          </div>
        </div>
        
        {hasStructuralDiffs && (
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Structural Differences ({structureDifferences.length})
            </h3>
            <div className={`border rounded-lg overflow-hidden ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <table className="w-full table-fixed">
                <thead className={`${
                  isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'
                }`}>
                  <tr>
                    <th className="px-4 py-2 text-left w-2/5">Path</th>
                    <th className="px-4 py-2 text-left w-3/5">Issue</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700 text-gray-300' : 'divide-gray-200'
                }`}>
                  {structureDifferences.map((diff, index) => (
                    <tr key={`struct-${index}`} className={`${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    } ${diff.type === 'missing_in_right' 
                      ? isDarkMode ? 'bg-red-900 bg-opacity-20' : 'bg-red-50' 
                      : isDarkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50'
                    }`}>
                      <td className="px-4 py-3 font-mono text-sm break-all w-2/5 overflow-hidden text-ellipsis">{diff.path}</td>
                      <td className="px-4 py-3 break-words w-3/5">{diff.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {hasValueDiffs && (
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Value Differences ({valueDifferences.length})
            </h3>
            <div className={`border rounded-lg overflow-hidden ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <table className="w-full table-fixed">
                <thead className={`${
                  isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'
                }`}>
                  <tr>
                    <th className="px-4 py-2 text-left w-1/4">Path</th>
                    <th className="px-4 py-2 text-left w-[37.5%]">Left Value</th>
                    <th className="px-4 py-2 text-left w-[37.5%]">Right Value</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700 text-gray-300' : 'divide-gray-200'
                }`}>
                  {valueDifferences.map((diff, index) => (
                    <tr key={`value-${index}`} className={`${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <td className="px-4 py-3 font-mono text-sm break-all w-1/4 overflow-hidden text-ellipsis align-top">{diff.path}</td>
                      <td className={`px-4 py-3 font-mono text-sm whitespace-pre-wrap break-all align-top w-[37.5%] overflow-hidden ${
                        isDarkMode ? 'text-red-300' : 'text-red-600'
                      }`}>
                        {formatDiffValue(diff.leftValue)}
                      </td>
                      <td className={`px-4 py-3 font-mono text-sm whitespace-pre-wrap break-all align-top w-[37.5%] overflow-hidden ${
                        isDarkMode ? 'text-green-300' : 'text-green-600'
                      }`}>
                        {formatDiffValue(diff.rightValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Side-by-Side View */}
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Side-by-Side View
          </h3>
          <div className="flex flex-row gap-4 overflow-hidden">
            <div className="w-1/2 min-w-0 overflow-hidden">
              <div className={`p-2 rounded-lg font-semibold text-center ${
                isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200'
              }`}>
                Left JSON
              </div>
              <div className={`mt-2 p-4 rounded-lg border shadow-inner overflow-auto max-h-96 max-w-full ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                {leftJsonInput ? 
                  <div dangerouslySetInnerHTML={{ 
                    __html: addLineNumbers(highlightJson(JSON.parse(leftJsonInput), isDarkMode), 'json') 
                  }} className="overflow-x-auto whitespace-pre break-words w-full" style={{ maxWidth: "100%" }} />
                : ''}
              </div>
            </div>
            <div className="w-1/2 min-w-0 overflow-hidden">
              <div className={`p-2 rounded-lg font-semibold text-center ${
                isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200'
              }`}>
                Right JSON
              </div>
              <div className={`mt-2 p-4 rounded-lg border shadow-inner overflow-auto max-h-96 max-w-full ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                {rightJsonInput ? 
                  <div dangerouslySetInnerHTML={{ 
                    __html: addLineNumbers(highlightJson(JSON.parse(rightJsonInput), isDarkMode), 'json') 
                  }} className="overflow-x-auto whitespace-pre break-words w-full" style={{ maxWidth: "100%" }} />
                : ''}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <div className={`px-3 py-1 rounded-lg text-sm flex items-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className="w-3 h-3 rounded-full bg-red-500 bg-opacity-30 mr-2"></span>
                <span>Missing in Right</span>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm flex items-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className="w-3 h-3 rounded-full bg-green-500 bg-opacity-30 mr-2"></span>
                <span>Missing in Left</span>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm flex items-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className="w-3 h-3 rounded-full bg-amber-500 bg-opacity-30 mr-2"></span>
                <span>Different Values</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [comparisonResult, comparisonMode, isDarkMode, formatDiffValue, leftJsonInput, rightJsonInput, highlightJson, addLineNumbers]);
  
  return (
    <div className="w-full">
      {/* History panel */}
      {showHistory && (
        <div className={`mb-6 p-4 border rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Recent Comparisons
            </h3>
            <button 
              onClick={() => setShowHistory(false)}
              className={`p-1 rounded-md hover:bg-gray-200 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {history.length > 0 ? (
              history.map((item, index) => (
                <HistoryItem 
                  key={item.timestamp} 
                  item={item} 
                  index={index} 
                  onRestore={handleRestoreFromHistory}
                  isDarkMode={isDarkMode}
                />
              ))
            ) : (
              <div className={`p-3 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No history yet. Compare some JSON to get started.
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          isDarkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-blue-50 text-blue-800 border border-blue-100'
        }`}>
          <strong>Comparison Mode:</strong> 
          <div className="mt-2 flex flex-wrap gap-2">
            <label className={`flex items-center cursor-pointer ${
              comparisonMode === 'both' 
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            } px-3 py-1 rounded-lg`}>
              <input 
                type="radio" 
                name="comparisonMode" 
                value="both" 
                checked={comparisonMode === 'both'}
                onChange={() => setComparisonMode('both')}
                className="sr-only"
              />
              <span>Complete Comparison</span>
            </label>
            <label className={`flex items-center cursor-pointer ${
              comparisonMode === 'structure' 
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            } px-3 py-1 rounded-lg`}>
              <input 
                type="radio" 
                name="comparisonMode" 
                value="structure" 
                checked={comparisonMode === 'structure'}
                onChange={() => setComparisonMode('structure')}
                className="sr-only"
              />
              <span>Structure Only</span>
            </label>
            <label className={`flex items-center cursor-pointer ${
              comparisonMode === 'values' 
                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            } px-3 py-1 rounded-lg`}>
              <input 
                type="radio" 
                name="comparisonMode" 
                value="values" 
                checked={comparisonMode === 'values'}
                onChange={() => setComparisonMode('values')}
                className="sr-only"
              />
              <span>Values Only</span>
            </label>
          </div>
        </div>
        
        {/* JSON Inputs */}
        <div className="flex flex-row space-x-4">
          <div className="flex-1">
            <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Left JSON</h3>
            <textarea
              value={leftJsonInput}
              onChange={handleLeftInputChange}
              placeholder="Paste your first JSON here..."
              className={`w-full h-64 p-3 border rounded-lg font-mono text-sm mb-2 outline-none transition ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Right JSON</h3>
            <textarea
              value={rightJsonInput}
              onChange={handleRightInputChange}
              placeholder="Paste your second JSON here..."
              className={`w-full h-64 p-3 border rounded-lg font-mono text-sm mb-2 outline-none transition ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>
        </div>
        
        <div className="flex space-x-3 mt-4">
          <button
            onClick={compareJson}
            className={`px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="Compare (Ctrl+Shift+C)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Compare
          </button>
          <button
            onClick={handleClear}
            className={`px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition flex items-center ${
              isDarkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className={`p-4 mb-4 rounded-lg flex items-center ${
          isDarkMode 
            ? 'bg-red-900 text-red-200 border-l-4 border-red-600' 
            : 'bg-red-50 text-red-600 border-l-4 border-red-500'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Comparison Results */}
      {comparisonResult && (
        <div className="mt-6" ref={leftContentRef}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Comparison Results</h2>
              <div className="ml-4 flex items-center space-x-2">
                <button 
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                  className={`p-1 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Smaller Font Size"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{Math.round(zoomLevel * 100)}%</span>
                <button 
                  onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                  className={`p-1 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Larger Font Size"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <button 
                  onClick={() => setZoomLevel(1)}
                  className={`p-1 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Reset Zoom"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ fontSize: `${Math.round(14 * zoomLevel)}px` }}>
            {renderComparisonResults()}
          </div>
        </div>
      )}
    </div>
  );
});

export default JsonDiffInspector; 