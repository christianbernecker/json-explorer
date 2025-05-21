import React, { useState } from 'react';
import { decodeTCStringStrict, getProcessedTCData, ProcessedTCData } from '../services/tcfService';
import { addHistoryItem } from '../services/historyService';
import Button from './shared/Button';

interface TCFDecoderProps {
  isDarkMode: boolean;
  initialTcString?: string | null;
}

const TCFDecoder: React.FC<TCFDecoderProps> = ({ isDarkMode, initialTcString }) => {
  // State für den Decoder
  const [tcfString, setTcfString] = useState(initialTcString || '');
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodeWarning, setDecodeWarning] = useState<string | null>(null);
  const [processedTcfData, setProcessedTcfData] = useState<ProcessedTCData | null>(null);
  
  // Styling
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const errorColor = isDarkMode ? 'text-red-300' : 'text-red-600';
  const inputBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const inputBorderColor = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const highlightColor = isDarkMode ? 'text-yellow-300' : 'text-yellow-600';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const tableHeaderBg = isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800';
  const tableRowBg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  
  // Clear the input field
  const clearInput = () => {
    setTcfString('');
    setProcessedTcfData(null);
    setDecodeError(null);
    setDecodeWarning(null);
  };

  // Add current string to history
  const addToHistory = (str: string) => {
    if (!str.trim()) return;
    
    // Verwende den historyService statt lokaler History
    addHistoryItem('tcf', str);
  };

  // Process TCF string using the new service
  const handleDecode = async () => {
    setDecodeError(null);
    setDecodeWarning(null);
    setProcessedTcfData(null); // Reset previous results

    if (!tcfString.trim()) {
      setDecodeError('Please enter a TCF string');
      return;
    }

    try {
      // Add to history before processing
      addToHistory(tcfString);
      
      // 1. Decode using the service
      const { tcModel, error: decodeStrictError } = await decodeTCStringStrict(tcfString);

      if (decodeStrictError || !tcModel) {
        setDecodeError(decodeStrictError || 'Failed to decode TCF string (unknown error).');
        return;
      }

      // 2. Process the data for UI
      const processedData = getProcessedTCData(tcModel);

      if (!processedData) {
        // Sollte nicht passieren, wenn tcModel gültig war, aber sicherheitshalber
        setDecodeError('Failed to process the decoded TCF model.');
        return;
      }
      
      // Set the processed data for rendering
      setProcessedTcfData(processedData);

      // Check GVL status from processed data (optional warning)
      if (processedData.gvlStatus === 'not_loaded') {
        setDecodeWarning('GVL could not be loaded by the TCF library based on the string. Vendor details might be incomplete.');
      }
    } catch (error) {
      // Fange unerwartete Fehler im Service ab
      console.error('Error during TCF decoding/processing:', error);
      setDecodeError(error instanceof Error ? error.message : 'Unknown error during processing');
      setProcessedTcfData(null);
    }
  };

  // Export decoded data as JSON
  const handleExportJSON = () => {
    if (!processedTcfData) return;
    
    try {
      // Erstelle einen Blob mit den JSON-Daten
      const blob = new Blob([JSON.stringify(processedTcfData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Erstelle und klicke auf einen temporären Download-Link
      const a = document.createElement('a');
      a.href = url;
      a.download = `tcf-decoded-${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Räume auf
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  return (
    <div className={`p-6 ${bgColor} ${textColor}`}>
      {/* Input Area */}
      <div className="mb-4">
        <textarea
          className={`w-full p-2 border rounded ${inputBgColor} ${inputBorderColor} ${textColor} focus:ring-2 focus:ring-blue-500`}
          rows={4}
          placeholder="Enter TCF String here..."
          value={tcfString}
          onChange={(e) => setTcfString(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={handleDecode}>Decode String</Button>
        <Button onClick={clearInput}>Clear</Button>
        {processedTcfData && (
          <Button onClick={handleExportJSON}>Export Results as JSON</Button>
        )}
      </div>
      
      {decodeError && (
        <div className={`mb-4 p-3 border border-red-400 rounded ${errorColor} bg-red-100 dark:bg-red-900`}>
          <strong>Error:</strong> {decodeError}
        </div>
      )}
      {decodeWarning && (
        <div className={`mb-4 p-3 border border-yellow-400 rounded ${highlightColor} bg-yellow-50 dark:bg-yellow-900`}>
          <strong>Warning:</strong> {decodeWarning}
        </div>
      )}
      
      {/* Results section */}
      {processedTcfData && (
        <div id="results" className={`my-6 p-5 border ${borderColor} rounded-md`}>
          {/* Key Vendors Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Key Vendors (136, 137, 44)</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {processedTcfData.keyVendorResults.length > 0 ? (
                processedTcfData.keyVendorResults.map((vendor) => (
                  <div key={vendor.id} className={`p-4 border rounded-lg border-gray-300 dark:border-gray-700 ${bgColor}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{vendor.name}</h4>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${vendor.hasConsent ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                          Consent: {vendor.hasConsent ? 'Yes' : 'No'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${vendor.hasLegitimateInterest ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                          LI: {vendor.hasLegitimateInterest ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm mt-2">
                      <div className="mb-1">
                        <strong>Purposes with Consent:</strong>
                        {vendor.purposesConsent.length > 0 ? (
                          <span> {vendor.purposesConsent.map(p => `Purpose ${p}`).join(', ')}</span>
                        ) : (
                          <span className="ml-1 text-gray-500 dark:text-gray-400">None</span>
                        )}
                      </div>
                      <div className="mb-1">
                        <strong>Purposes with Leg. Interest:</strong>
                        {vendor.purposesLI.length > 0 ? (
                          <span> {vendor.purposesLI.map(p => `Purpose ${p}`).join(', ')}</span>
                        ) : (
                          <span className="ml-1 text-gray-500 dark:text-gray-400">None</span>
                        )}
                      </div>
                      <div className="mb-1">
                        <strong>Special Features with Opt-In:</strong>
                        {vendor.specialFeaturesOptIn.length > 0 ? (
                          <span> {vendor.specialFeaturesOptIn.map(f => `Feature ${f}`).join(', ')}</span>
                        ) : (
                          <span className="ml-1 text-gray-500 dark:text-gray-400">None</span>
                        )}
                      </div>
                      
                      <div className="mb-1">
                        <strong>Features:</strong>
                        {vendor.features.length > 0 ? (
                          <span> {vendor.features.map(f => `Feature ${f}`).join(', ')}</span>
                        ) : (
                          <span className="ml-1 text-gray-500 dark:text-gray-400">None</span>
                        )}
                      </div>
                      
                      <div className="mb-1">
                        <strong>Special Purposes:</strong>
                        {vendor.specialPurposes.length > 0 ? (
                          <span> {vendor.specialPurposes.map(sp => `Special Purpose ${sp}`).join(', ')}</span>
                        ) : (
                          <span className="ml-1 text-gray-500 dark:text-gray-400">None</span>
                        )}
                      </div>
                      
                      {/* Publisher Restrictions Section */}
                      {vendor.publisherRestrictions && vendor.publisherRestrictions.length > 0 && (
                        <div className="mb-1">
                          <strong>Publisher Restrictions:</strong>
                          <ul className="list-disc pl-5 mt-1">
                            {vendor.publisherRestrictions.map((restriction, idx) => (
                              <li key={`restriction-${idx}`} className="text-xs">
                                Purpose {restriction.purposeId}: 
                                <span className={`ml-1 ${
                                  restriction.restrictionType === 0 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                  {restriction.restrictionType === 0 
                                    ? 'Not Allowed' 
                                    : restriction.restrictionType === 1 
                                      ? 'Require Consent' 
                                      : 'Require Legitimate Interest'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-2">
                        <Button
                          onClick={() => window.open(`https://iabeurope.eu/vendor-search/#${vendor.id}`, '_blank')}
                          variant="secondary"
                          size="sm"
                          isDarkMode={isDarkMode}
                        >
                          View in IAB Vendor List
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className={secondaryTextColor}>No key vendors found or GVL data not available.</p>
              )}
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3">TCF String Information</h3>
            
            <div className={`p-4 border rounded-lg border-gray-300 dark:border-gray-700 ${bgColor}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <p className="text-sm"><strong>TCF Version:</strong> {processedTcfData.version}</p>
                  <p className="text-sm"><strong>Created:</strong> {processedTcfData.created ? new Date(processedTcfData.created).toLocaleString() : 'Unknown'}</p>
                  <p className="text-sm"><strong>Last Updated:</strong> {processedTcfData.lastUpdated ? new Date(processedTcfData.lastUpdated).toLocaleString() : 'Unknown'}</p>
                  <p className="text-sm"><strong>CMP ID:</strong> {processedTcfData.cmpId}</p>
                  <p className="text-sm"><strong>CMP Version:</strong> {processedTcfData.cmpVersion}</p>
                </div>
                <div>
                  <p className="text-sm"><strong>Consent Screen:</strong> {processedTcfData.consentScreen}</p>
                  <p className="text-sm"><strong>Vendor List Version:</strong> {processedTcfData.vendorListVersion}</p>
                  <p className="text-sm"><strong>Publisher Country:</strong> {processedTcfData.publisherCountryCode}</p>
                  <p className="text-sm"><strong>Use Non-Standard Texts:</strong> {processedTcfData.useNonStandardTexts ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Global Consent Status</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 border rounded border-gray-300 dark:border-gray-700">
                    <h5 className="font-medium mb-2">Purpose Consents</h5>
                    {processedTcfData.globalPurposeConsents.map((purposeId) => (
                      <span 
                        key={purposeId} 
                        className="inline-block px-2 py-1 mr-1 mb-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs"
                      >
                        Purpose {purposeId}
                      </span>
                    ))}
                    {processedTcfData.globalPurposeConsents.length === 0 && (
                      <span className="text-xs text-gray-500">None</span>
                    )}
                  </div>
                  
                  <div className="p-3 border rounded border-gray-300 dark:border-gray-700">
                    <h5 className="font-medium mb-2">Legitimate Interests</h5>
                    {processedTcfData.globalPurposeLegitimateInterests.map((purposeId) => (
                      <span 
                        key={purposeId} 
                        className="inline-block px-2 py-1 mr-1 mb-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs"
                      >
                        Purpose {purposeId}
                      </span>
                    ))}
                    {processedTcfData.globalPurposeLegitimateInterests.length === 0 && (
                      <span className="text-xs text-gray-500">None</span>
                    )}
                  </div>
                  
                  <div className="p-3 border rounded border-gray-300 dark:border-gray-700">
                    <h5 className="font-medium mb-2">Special Features Opt-in</h5>
                    {processedTcfData.globalSpecialFeatureOptIns.map((featureId) => (
                      <span 
                        key={featureId} 
                        className="inline-block px-2 py-1 mr-1 mb-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs"
                      >
                        Feature {featureId}
                      </span>
                    ))}
                    {processedTcfData.globalSpecialFeatureOptIns.length === 0 && (
                      <span className="text-xs text-gray-500">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Publisher restrictions table (if present) */}
          {processedTcfData.rawTCModel?.publisherRestrictions && processedTcfData.rawTCModel.publisherRestrictions.numRestrictions > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Publisher Restrictions</h3>
              
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y divide-gray-300 dark:divide-gray-700 border ${borderColor} rounded-lg overflow-hidden`}>
                  <thead className={tableHeaderBg}>
                    <tr>
                      <th className="px-4 py-3 text-left">Purpose ID</th>
                      <th className="px-4 py-3 text-left">Purpose</th>
                      <th className="px-4 py-3 text-left">Restriction Type</th>
                      <th className="px-4 py-3 text-left">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from(processedTcfData.rawTCModel.publisherRestrictions.getRestrictions()).map(({ purposeId, restrictionType }, index) => {
                      const purpose = processedTcfData.rawTCModel?.gvl?.purposes?.[purposeId.toString()];
                      
                      return (
                        <tr key={`pub-restriction-${index}`} className={index % 2 === 0 ? tableRowBg : ''}>
                          <td className="px-4 py-2 whitespace-nowrap">{purposeId}</td>
                          <td className="px-4 py-2">
                            {purpose ? (
                              <span title={purpose.description}>
                                <strong>{purposeId}:</strong> {purpose.name}
                              </span>
                            ) : (
                              <span><strong>{purposeId}:</strong> Unknown Purpose</span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              restrictionType === 0
                                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                : restrictionType === 1
                                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                  : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            }`}>
                              Type {restrictionType}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {restrictionType === 0 
                              ? 'Not Allowed' 
                              : restrictionType === 1 
                                ? 'Require Consent' 
                                : 'Require Legitimate Interest'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TCFDecoder; 