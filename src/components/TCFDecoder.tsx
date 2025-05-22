import React, { useState, useEffect } from 'react';
import { decodeTCStringStrict, getProcessedTCData, ProcessedTCData, loadAndCacheGVL } from '../services/tcfService';
import { addHistoryItem } from '../services/historyService';
import Button from './shared/Button';
import { GVL } from '@iabtechlabtcf/core';

interface TCFDecoderProps {
  isDarkMode: boolean;
  initialTcString?: string | null;
  initialTab?: string;
}

// Type für die Tabs
type ActiveTab = 'decoder' | 'gvl-explorer' | 'vendor-details';

const TCFDecoder: React.FC<TCFDecoderProps> = ({ isDarkMode, initialTcString, initialTab = 'decoder' }) => {
  // State für den Decoder
  const [tcfString, setTcfString] = useState(initialTcString || '');
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodeWarning, setDecodeWarning] = useState<string | null>(null);
  const [processedTcfData, setProcessedTcfData] = useState<ProcessedTCData | null>(null);
  
  // State für GVL Explorer und Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab as ActiveTab || 'decoder');
  const [gvlExplorerInstance, setGvlExplorerInstance] = useState<GVL | null>(null);
  const [isLoadingGVL, setIsLoadingGVL] = useState<boolean>(false);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [vendorSearchTerm, setVendorSearchTerm] = useState<string>('');
  
  // State für Vendor Details
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  
  // GVL laden für GVL Explorer
  const loadGVL = async () => {
    if (isLoadingGVL || gvlExplorerInstance) return;
    
    try {
      setIsLoadingGVL(true);
      const gvl = await loadAndCacheGVL();
      setGvlExplorerInstance(gvl);
      
      // Alle Vendors filtern
      if (gvl && gvl.vendors) {
        const allVendors = Object.values(gvl.vendors).sort((a, b) => a.id - b.id);
        setFilteredVendors(allVendors);
      }
    } catch (error) {
      console.error('Error loading GVL:', error);
    } finally {
      setIsLoadingGVL(false);
    }
  };
  
  // Wenn sich der initialTab ändert, aktualisiere den aktiven Tab
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as ActiveTab);
      
      // Wenn GVL Explorer aktiviert wird und noch keine Daten geladen sind
      if (initialTab === 'gvl-explorer' && !gvlExplorerInstance) {
        loadGVL();
      }
      
      // Bei Wechsel von vendor-details zurück zum Haupttab
      if (initialTab !== 'vendor-details' && activeTab === 'vendor-details') {
        setSelectedVendor(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab, activeTab, gvlExplorerInstance]);
  
  // Styling
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
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

  // Vendor-Details anzeigen
  const handleViewVendorDetails = (vendor: any) => {
    // Standardisiere das Vendor-Objekt
    const safeVendor = {
      id: vendor.id,
      name: vendor.name,
      policyUrl: vendor.policyUrl || '',
      purposesConsent: vendor.purposesConsent || vendor.purposes || [],
      purposesLI: vendor.purposesLI || vendor.legIntPurposes || [],
      specialFeaturesOptIn: vendor.specialFeaturesOptIn || vendor.specialFeatures || [],
      features: vendor.features || [],
      specialPurposes: vendor.specialPurposes || [],
      hasConsent: typeof vendor.hasConsent === 'boolean' ? vendor.hasConsent : false,
      hasLegitimateInterest: typeof vendor.hasLegitimateInterest === 'boolean' ? vendor.hasLegitimateInterest : false,
      debugInfo: vendor.debugInfo || {},
      publisherRestrictions: vendor.publisherRestrictions || []
    };
    setSelectedVendor(safeVendor);
    setActiveTab('vendor-details');
  };
  
  // Zurück zu den Ergebnissen
  const handleBackFromVendorDetails = () => {
    setSelectedVendor(null);
    setActiveTab('decoder');
  };

  return (
    <div className="w-full h-full flex flex-col px-0 sm:px-1 md:px-3 lg:px-4">
      {/* TCF Decoder Tab */}
      {(activeTab === 'decoder' || !activeTab) && (
        <>
          <div className="mb-2 sm:mb-3 md:mb-4">
            <div className="flex flex-row space-x-2 sm:space-x-3 md:space-x-4">
              <div className="flex-1">
                <h3 className={`text-base md:text-lg font-semibold mb-1 md:mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>TCF String Input</h3>
                <textarea
                  className={`w-full h-28 sm:h-32 p-2 sm:p-3 border rounded-lg font-mono text-xs mb-1 md:mb-2 outline-none transition ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter TCF String here..."
                  value={tcfString}
                  onChange={(e) => setTcfString(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-4">
              <Button 
                onClick={handleDecode}
                variant="primary"
                isDarkMode={isDarkMode}
                title="Decode TCF String"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Decode String
              </Button>
              <Button 
                onClick={clearInput}
                variant="secondary"
                isDarkMode={isDarkMode}
                title="Clear Input"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </Button>
              {processedTcfData && (
                <Button 
                  onClick={handleExportJSON}
                  variant="export"
                  isDarkMode={isDarkMode}
                  title="Export Results as JSON"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Results as JSON
                </Button>
              )}
            </div>
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
                              onClick={() => handleViewVendorDetails(vendor)}
                              variant="secondary"
                              size="sm"
                              isDarkMode={isDarkMode}
                            >
                              View Details
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
              
              {/* All Vendors with Consent Status */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">All Vendors with Consent Status</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={tableHeaderBg}>
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Vendor</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Consent</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Leg. Interest</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${bgColor}`}>
                      {processedTcfData.rawTCModel?.gvl?.vendors ? 
                        Object.values(processedTcfData.rawTCModel.gvl.vendors)
                          .sort((a, b) => a.id - b.id)
                          .map((vendor) => {
                            const vendorId = vendor.id;
                            const hasConsent = processedTcfData.rawTCModel?.vendorConsents?.has(vendorId) || false;
                            const hasLegitimateInterest = processedTcfData.rawTCModel?.vendorLegitimateInterests?.has(vendorId) || false;
                            
                            return (
                              <tr key={`vendor-${vendorId}`} className={tableRowBg}>
                                <td className="px-4 py-2">{vendorId}</td>
                                <td className="px-4 py-2">{vendor.name}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${hasConsent ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                                    {hasConsent ? 'Yes' : 'No'}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${hasLegitimateInterest ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                                    {hasLegitimateInterest ? 'Yes' : 'No'}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <Button 
                                    onClick={() => {
                                      handleViewVendorDetails(vendor);
                                    }}
                                    isDarkMode={isDarkMode}
                                    variant="secondary"
                                    size="sm"
                                  >
                                    View Details
                                  </Button>
                                </td>
                              </tr>
                            );
                          }) : 
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-center">
                            No vendor data available.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* TCF String Information */}
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
                        {processedTcfData.globalPurposeConsents.map((purposeId: number) => (
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
                        {processedTcfData.globalPurposeLegitimateInterests.map((purposeId: number) => (
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
                        {processedTcfData.globalSpecialFeatureOptIns.map((featureId: number) => (
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
        </>
      )}
      
      {/* GVL Explorer Tab */}
      {activeTab === 'gvl-explorer' && (
        <div className="mt-4">
          {isLoadingGVL ? (
            <div className="text-center p-10">
              <p>Loading Global Vendor List...</p>
            </div>
          ) : !gvlExplorerInstance ? (
            <div className="text-center p-10">
              <p>No GVL data available. Please decode a TCF string first or refresh.</p>
              <Button
                onClick={loadGVL}
                isDarkMode={isDarkMode}
                className="mt-4"
              >
                Load GVL
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h3 className="text-lg font-semibold">Global Vendor List Explorer</h3>
                  <p className={`text-sm ${secondaryTextColor}`}>
                    Version {gvlExplorerInstance.vendorListVersion} ({gvlExplorerInstance.tcfPolicyVersion})
                    <span className="mx-2">•</span>
                    Last Updated: {gvlExplorerInstance.lastUpdated ? new Date(gvlExplorerInstance.lastUpdated).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <input 
                  type="text"
                  placeholder="Search for vendor name or ID..."
                  className={`w-full px-3 py-2 rounded ${inputBgColor} ${inputBorderColor} border`}
                  value={vendorSearchTerm}
                  onChange={(e) => {
                    setVendorSearchTerm(e.target.value);
                    // Filter vendors based on search term
                    if (gvlExplorerInstance && gvlExplorerInstance.vendors) {
                      const term = e.target.value.toLowerCase();
                      const filtered = Object.values(gvlExplorerInstance.vendors).filter(v => {
                        return v.id.toString().includes(term) || v.name.toLowerCase().includes(term);
                      }).sort((a, b) => a.id - b.id);
                      setFilteredVendors(filtered);
                    }
                  }}
                />
              </div>
              
              <div className={`border ${borderColor} rounded overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={tableHeaderBg}>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Vendor Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Purposes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Special Features</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${borderColor}`}>
                      {filteredVendors.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-center">
                            No vendors found matching your criteria
                          </td>
                        </tr>
                      ) : filteredVendors.map(vendor => (
                        <tr key={vendor.id} className={tableRowBg}>
                          <td className="px-4 py-3 whitespace-nowrap">{vendor.id}</td>
                          <td className="px-4 py-3">
                            {vendor.name}
                            {vendor.deletedDate && (
                              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${errorColor} bg-red-100 dark:bg-red-900`}>
                                Deleted
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">
                              {vendor.purposes?.length || 0} consent, {vendor.legIntPurposes?.length || 0} legitInt
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">
                              {vendor.specialFeatures?.length || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => {
                                  handleViewVendorDetails(vendor);
                                }}
                                isDarkMode={isDarkMode}
                                variant="secondary"
                                size="sm"
                              >
                                View Details
                              </Button>
                              <a 
                                href={vendor.policyUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Policy
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className={`mt-4 text-sm ${secondaryTextColor}`}>
                Found {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
                {filteredVendors.length !== Object.keys(gvlExplorerInstance?.vendors || {}).length && 
                  ` (of ${Object.keys(gvlExplorerInstance?.vendors || {}).length} total)`
                }
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Vendor Details Tab */}
      {activeTab === 'vendor-details' && selectedVendor && (
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button
              onClick={handleBackFromVendorDetails}
              variant="secondary"
              isDarkMode={isDarkMode}
              size="sm"
            >
              ← Back
            </Button>
            <h2 className="text-xl font-semibold ml-3">{selectedVendor.name} (ID: {selectedVendor.id})</h2>
          </div>
          
          {/* Policy URL gleich am Anfang anzeigen */}
          {selectedVendor.policyUrl && (
            <div className="mb-4">
              <p className="text-sm">
                <strong>Policy URL:</strong>{" "}
                <a href={selectedVendor.policyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {selectedVendor.policyUrl}
                </a>
              </p>
            </div>
          )}
          
          {/* Vendor Consent and LI Status Badges */}
          <div className="flex flex-wrap gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${selectedVendor.hasConsent ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              Consent: {selectedVendor.hasConsent ? 'Yes' : 'No'}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${selectedVendor.hasLegitimateInterest ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              Legitimate Interest: {selectedVendor.hasLegitimateInterest ? 'Yes' : 'No'}
            </span>
          </div>
          
          {/* Decoded Purposes and Special Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Purposes with Consent</h4>
              {selectedVendor.purposesConsent && selectedVendor.purposesConsent.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.purposesConsent.map((pId: number) => (
                    <li key={`vd-consent-${pId}`}>{`${pId}. ${processedTcfData?.rawTCModel?.gvl?.purposes?.[pId.toString()]?.name || `Purpose ${pId}`}`}</li>
                  ))}
                </ul>
              ) : <p className="text-sm italic">None</p>}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Purposes with Legitimate Interest</h4>
              {selectedVendor.purposesLI && selectedVendor.purposesLI.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.purposesLI.map((pId: number) => (
                    <li key={`vd-li-${pId}`}>{`${pId}. ${processedTcfData?.rawTCModel?.gvl?.purposes?.[pId.toString()]?.name || `Purpose ${pId}`}`}</li>
                  ))}
                </ul>
              ) : <p className="text-sm italic">None</p>}
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Special Purposes</h4>
              {selectedVendor.specialPurposes && selectedVendor.specialPurposes.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.specialPurposes.map((spId: number) => (
                    <li key={`vd-sp-${spId}`}>{`${spId}. ${processedTcfData?.rawTCModel?.gvl?.specialPurposes?.[spId.toString()]?.name || `Special Purpose ${spId}`}`}</li>
                  ))}
                </ul>
              ) : <p className="text-sm italic">None</p>}
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Features</h4>
              {selectedVendor.features && selectedVendor.features.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.features.map((fId: number) => (
                    <li key={`vd-f-${fId}`}>{`${fId}. ${processedTcfData?.rawTCModel?.gvl?.features?.[fId.toString()]?.name || `Feature ${fId}`}`}</li>
                  ))}
                </ul>
              ) : <p className="text-sm italic">None</p>}
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Special Features with Opt-in</h4>
              {selectedVendor.specialFeaturesOptIn && selectedVendor.specialFeaturesOptIn.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.specialFeaturesOptIn.map((sfId: number) => (
                    <li key={`vd-sf-${sfId}`}>{`${sfId}. ${processedTcfData?.rawTCModel?.gvl?.specialFeatures?.[sfId.toString()]?.name || `Special Feature ${sfId}`}`}</li>
                  ))}
                </ul>
              ) : <p className="text-sm italic">None</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TCFDecoder; 