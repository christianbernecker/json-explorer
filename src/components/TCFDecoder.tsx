import React, { useState, useEffect } from 'react';
// Entferne alte Imports
// import { purposeNames, decodeTCStringIAB } from '../utils/tcf-decoder';
// import { loadGVL, getVendors, GVLData, GVLVendor, clearGVLCache } from '../utils/gvl-loader';

// Neue Imports vom tcfService
import {
  loadAndCacheGVL, 
  decodeTCStringStrict, 
  getProcessedTCData, 
  ProcessedTCData, 
  // ProcessedVendorInfo, // Wird ggf. später für Detailansichten benötigt
} from '../services/tcfService';
import { GVL } from '@iabtechlabtcf/core'; // GVL-Typ wird weiterhin benötigt für GVL-Explorer

import Button from './shared/Button';

interface TCFDecoderProps {
  isDarkMode: boolean;
}

// Tabs for display
type ActiveTab = 'decoder' | 'gvl-explorer' | 'vendor-details';

// Filter options for display (bleibt für GVL Explorer relevant)
/* // Entfernt, da ungenutzt
interface VendorFilterOptions {
  onlyWithConsent: boolean;
  onlyWithLegitimateInterest: boolean;
  purposeFilter: number | null;
}
*/

// Example TCF string - mit bekannten LI-Eigenschaften für Vendor 136
// Diese Version soll LI für Vendor 136 aber nicht für 137 aktivieren
const EXAMPLE_TCF_STRING = "CQRemBOQRemBOAGACAENCZAAAAAAAAAAAAAAAAAAAAA.II7Nd_X__bX9n-_7_6ft0eY1f9_r37uQzDhfNk-8F3L_W_LwX32E7NF36tq4KmR4ku1bBIQNtHMnUDUmxaolVrzHsak2cpyNKJ_JkknsZe2dYGF9Pn9lD-YKZ7_5_9_f52T_9_9_-39z3_9f___dv_-__3_W474Ek8_n_v-_v_dFLgEkB1RgCQAgGyChQoUKCRQUKBIQEIoggYJJBZEJACQQKIEIKNEHABAIQCgEAACIAAQgCQAIgAAAIAkACQAg0AAAIKAgAwAICRQAMgABCIgIAECAAEIgACGAARBAASwAApACSAAACLAIkAAMASmAUhgAD.YAAAAAAAAAAAA"; // Neuer Beispielstring für den Test

const TCFDecoder: React.FC<TCFDecoderProps> = ({ isDarkMode }) => {
  // State für den Decoder
  const [tcfString, setTcfString] = useState('');
  // const [additionalVendorId, setAdditionalVendorId] = useState<number>(136); // Entfernt, da ungenutzt
  // const [decodedVersion, setDecodedVersion] = useState<string>(''); // Kommt jetzt aus processedTcfData
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodeWarning, setDecodeWarning] = useState<string | null>(null);
  const [processedTcfData, setProcessedTcfData] = useState<ProcessedTCData | null>(null);
  // const [decodedData, setDecodedData] = useState<any | null>(null); // Wird durch processedTcfData ersetzt
  // const [showBitRepresentation, setShowBitRepresentation] = useState<boolean>(false); // Entfernt, da ungenutzt
  // const [bitRepresentation, setBitRepresentation] = useState<string>(''); // Entfernt, da ungenutzt
  
  // State für GVL und Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('decoder');
  // GVL-Instanz für den GVL-Explorer (direkt vom Service laden)
  const [gvlExplorerInstance, setGvlExplorerInstance] = useState<GVL | null>(null);
  const [isLoadingGVL, setIsLoadingGVL] = useState<boolean>(false); // Für GVL-Explorer Ladevorgang
  const [gvlError, setGvlError] = useState<string | null>(null); // Für GVL-Explorer Fehler
  
  // State for GVL Explorer
  const [vendorSearchTerm, setVendorSearchTerm] = useState<string>('');
  // filteredVendors muss jetzt mit dem GVL-Objekt aus @iabtechlabtcf/core arbeiten
  // Der Typ GVLVendor aus dem alten gvl-loader passt nicht mehr direkt.
  // Wir verwenden `any` für den Moment oder definieren eine passendere Struktur basierend auf `gvlVendor` aus der Lib.
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]); 
  
  // State for advanced functions
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null); // Muss ggf. an ProcessedVendorInfo angepasst werden
  // const [vendorFilter, setVendorFilter] = useState<VendorFilterOptions>({ // Entfernt, da ungenutzt
  //   onlyWithConsent: false,
  //   onlyWithLegitimateInterest: false,
  //   purposeFilter: null
  // });
  
  // Color scheme based on dark mode
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sectionBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  // Diese Farben werden jetzt durch die Button-Komponente abgelöst
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const buttonColor = isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white';
  const errorColor = isDarkMode ? 'text-red-300' : 'text-red-600';
  const inputBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const inputBorderColor = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const highlightColor = isDarkMode ? 'text-yellow-300' : 'text-yellow-600';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportBtnColor = isDarkMode ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-green-500 hover:bg-green-600 text-white';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  // const bitTextColor = isDarkMode ? 'text-blue-300' : 'text-blue-600'; // Entfernt, da ungenutzt
  const tabActiveBg = isDarkMode ? 'bg-blue-700' : 'bg-blue-500';
  const tabInactiveBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
  const tableHeaderBg = isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800';
  const tableRowBg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tableLightRowBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tableDarkRowBg = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  
  // Load GVL for GVL Explorer
  useEffect(() => {
    async function fetchGVLForExplorer() {
      if (activeTab === 'gvl-explorer' && !gvlExplorerInstance) {
        try {
          // Verwende die neue Funktion zum Löschen des Service Caches
          // clearTcfServiceGVLCache(); // Optional: Cache leeren bei jedem Laden?
          
          setIsLoadingGVL(true);
          setGvlError(null);
          const gvl = await loadAndCacheGVL(); // Lade GVL über den Service
          setGvlExplorerInstance(gvl); // Speichere die GVL Instanz für den Explorer
          updateFilteredVendors(gvl, vendorSearchTerm); // Initialisiere gefilterte Vendoren
        } catch (error) {
          console.error('Error loading GVL for Explorer:', error);
          setGvlError(error instanceof Error ? error.message : 'Unknown error loading GVL for Explorer');
          setGvlExplorerInstance(null); // Stelle sicher, dass keine alte Instanz bleibt
        } finally {
          setIsLoadingGVL(false);
        }
      }
    }
    
    fetchGVLForExplorer();
    // Abhängigkeiten: Nur ausführen, wenn der Tab aktiv wird oder sich die Instanz ändert (sollte nur 1x sein)
  }, [activeTab, gvlExplorerInstance, vendorSearchTerm]); // vendorSearchTerm hinzugefügt, um Filter zu aktualisieren
  
  // Update filtered vendors wenn GVL-Instanz oder Suchbegriff sich ändert
  useEffect(() => {
    if (gvlExplorerInstance) {
      updateFilteredVendors(gvlExplorerInstance, vendorSearchTerm);
    }
  }, [gvlExplorerInstance, vendorSearchTerm]);
  
  // Filter function for vendors (muss mit GVL-Instanz arbeiten)
  function updateFilteredVendors(gvl: GVL, searchTerm: string) {
    if (!gvl || !gvl.vendors) {
      setFilteredVendors([]);
      return;
    }
    
    // `gvl.vendors` ist ein Objekt { id: vendorObject }. Konvertiere zu Array.
    let filtered = Object.values(gvl.vendors);
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => {
        const idMatch = v.id.toString().includes(term);
        const nameMatch = v.name.toLowerCase().includes(term);
        return idMatch || nameMatch;
      });
    }
    
    // Sortiere nach ID
    filtered.sort((a, b) => a.id - b.id);

    setFilteredVendors(filtered);
  }
  
  // Load example TCF string
  const loadExample = () => {
    setTcfString(EXAMPLE_TCF_STRING);
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
      
      // Ggf. Bit-Repräsentation (wenn noch benötigt)
      // setBitRepresentation(...) 

    } catch (error) {
      // Fange unerwartete Fehler im Service ab
      console.error('Error during TCF decoding/processing:', error);
      setDecodeError(error instanceof Error ? error.message : 'Unknown error during processing');
      setProcessedTcfData(null);
    }
  };

  // Filter for vendors by consent/LegInt - DIESE FUNKTION IST NUN OBSOLET
  // Die Vendor-Daten kommen jetzt aufbereitet vom Service in processedTcfData.keyVendorResults
  // const getFilteredVendorResults = (): any[] => { ... };

  // Export JSON (muss processedTcfData verwenden)
  const handleExportJSON = () => {
    if (!processedTcfData) {
      setDecodeError('No data to export');
      return;
    }
      
    try {
      // Erstelle eine kopierte Version mit serialisierbaren Typen 
      // Beachte: rawTCModel kann nicht direkt serialisiert werden
      const serializable = {
        version: processedTcfData.version,
        created: processedTcfData.created,
        lastUpdated: processedTcfData.lastUpdated,
        cmpId: processedTcfData.cmpId,
        cmpVersion: processedTcfData.cmpVersion,
        consentScreen: processedTcfData.consentScreen,
        consentLanguage: processedTcfData.consentLanguage,
        vendorListVersion: processedTcfData.vendorListVersion,
        policyVersion: processedTcfData.policyVersion,
        isServiceSpecific: processedTcfData.isServiceSpecific,
        // KORREKTUR: useNonStandardTexts
        useNonStandardTexts: processedTcfData.useNonStandardTexts,
        // KORREKTUR: publisherCountryCode
        publisherCountryCode: processedTcfData.publisherCountryCode,
        purposeOneTreatment: processedTcfData.purposeOneTreatment,
        supportsOOB: processedTcfData.supportsOOB,
        // KORREKTUR: globalSpecialFeatureOptIns, globalPurposeConsents, globalPurposeLegitimateInterests
        globalSpecialFeatureOptIns: processedTcfData.globalSpecialFeatureOptIns || [],
        globalPurposeConsents: processedTcfData.globalPurposeConsents || [],
        globalPurposeLegitimateInterests: processedTcfData.globalPurposeLegitimateInterests || [],
        // KORREKTUR: keyVendorResults verwenden (oder später alle relevanten)
        vendors: processedTcfData.keyVendorResults || [] 
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(serializable, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "tcf_decoded_data.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error('Error exporting JSON:', error);
      setDecodeError('Failed to export data as JSON.');
    }
  };

  // Tab change handler
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };
  
  // Export GVL as JSON
  const handleExportGVL = () => {
    if (!gvlExplorerInstance) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gvlExplorerInstance, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "gvl_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  // Vendor details
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleViewVendorDetails = (vendor: any) => {
    setSelectedVendor(vendor);
    setActiveTab('vendor-details');
  };
  
  // Back to results overview
  const handleBackToResults = () => {
    setSelectedVendor(null);
    setActiveTab('decoder');
  };

  // GVL Explorer tab
  const renderGVLExplorer = () => {
    if (isLoadingGVL) {
      return <div className={`p-4 text-center ${textColor}`}>Loading Global Vendor List...</div>;
    }
    
    if (gvlError) {
      return <div className={`p-4 text-center ${errorColor}`}>Error: {gvlError}</div>;
    }
    
    if (!gvlExplorerInstance) {
      return <div className={`p-4 text-center ${textColor}`}>GVL data not available</div>;
    }

    return (
      <div className={`mt-4 ${textColor}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-3 md:space-y-0">
          <div>
            <h3 className="text-lg font-semibold">Global Vendor List Explorer</h3>
            <p className={`text-sm ${secondaryTextColor}`}>
              Version {gvlExplorerInstance.vendorListVersion} ({gvlExplorerInstance.tcfPolicyVersion})
              <span className="mx-2">•</span>
              Last Updated: {gvlExplorerInstance.lastUpdated ? new Date(gvlExplorerInstance.lastUpdated).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <Button 
            onClick={handleExportGVL} 
            variant="export"
            isDarkMode={isDarkMode}
            size="sm"
          >
            Export GVL as JSON
          </Button>
        </div>
        
        <div className="mb-4">
          <input 
            type="text"
            placeholder="Suche nach Vendor Namen oder ID..."
            className={`w-full px-3 py-2 rounded ${inputBgColor} ${inputBorderColor} border`}
            value={vendorSearchTerm}
            onChange={(e) => {
              setVendorSearchTerm(e.target.value);
            }}
          />
        </div>
        
        <div className={`border ${borderColor} rounded overflow-hidden`}>
          <div className={`w-full overflow-x-auto`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={tableHeaderBg}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Vendor Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Purposes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Special Features</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Policy</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${borderColor}`}>
                {isLoadingGVL ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-center">
                      Loading Global Vendor List...
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
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
                        {vendor.purposes.length} consent, {vendor.legIntPurposes.length} legitInt
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {vendor.specialFeatures.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a 
                        href={vendor.policyUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Privacy Policy
                      </a>
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
      </div>
    );
  };

  const renderDecoder = () => (
     <div className={`p-6 ${bgColor} ${textColor}`}>
        {/* HIER BEGINNT DER FEHLENDE INPUT-BEREICH */}
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
          <Button onClick={handleDecode} isDarkMode={isDarkMode} variant="primary">
            Decode String
          </Button>
          <Button onClick={loadExample} isDarkMode={isDarkMode} variant="secondary">
            Load Example
          </Button>
          {processedTcfData && (
            <Button onClick={handleExportJSON} isDarkMode={isDarkMode} variant="export">
              Export Results as JSON
            </Button>
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
        {/* HIER ENDET DER FEHLENDE INPUT-BEREICH */}
        
        {/* Results section */}
        {processedTcfData && (
          <div id="results" className={`my-6 p-5 border ${borderColor} rounded-md`}>
            {/* ... (Results Header) ... */}
            
            {/* Key Vendors Section - ANPASSUNG DER DATENZUGRIFFE HIER */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Key Vendors (136, 137, 44)</h3>
                <div className="grid grid-cols-1 gap-4">
                  {processedTcfData.keyVendorResults?.map((vendorEntry) => { // vendorEntry ist ProcessedVendorInfo
                    const id = vendorEntry.id;
                    const hasVendorConsent = vendorEntry.hasConsent;
                    const hasVendorLI = vendorEntry.hasLegitimateInterest;
                    const vendorName = vendorEntry.name;
                    // Diese sind bereits die gefilterten, erlaubten Purposes/Features
                    const purposesWithConsent = vendorEntry.purposesConsent; 
                    const purposesWithLI = vendorEntry.purposesLI;
                    const specialFeaturesAllowed = vendorEntry.specialFeaturesOptIn;

                    return (
                      <div key={id} className={`p-4 border rounded-lg ${borderColor} ${bgColor}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{vendorName}</h4>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${hasVendorConsent ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                              Consent: {hasVendorConsent ? 'Yes' : 'No'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${hasVendorLI ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                              LI: {hasVendorLI ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>

                        <div className="text-sm mt-2">
                          {purposesWithConsent.length > 0 && (
                            <div className="mb-1">
                              <strong>Purposes mit Consent:</strong> 
                              {purposesWithConsent.map((p, index) => (
                                <span key={`pwc-${p}`}>Purpose {p}{index < purposesWithConsent.length - 1 ? ', ' : ''}</span>
                              ))}
                            </div>
                          )}
                          {purposesWithLI.length > 0 && (
                            <div className="mb-1">
                              <strong>Purposes mit Leg. Interest:</strong> 
                              {purposesWithLI.map((p, index) => (
                                <span key={`pli-${p}`}>Purpose {p}{index < purposesWithLI.length - 1 ? ', ' : ''}</span>
                              ))}
                            </div>
                          )}
                           {specialFeaturesAllowed.length > 0 && (
                            <div className="mb-1">
                              <strong>Special Features mit Opt-In:</strong> 
                              {specialFeaturesAllowed.map((f, index) => (
                                <span key={`sf-${f}`}>Special Feature {f}{index < specialFeaturesAllowed.length - 1 ? ', ' : ''}</span>
                              ))}
                            </div>
                          )}
                           {(purposesWithConsent.length === 0 && purposesWithLI.length === 0 && specialFeaturesAllowed.length === 0) && (
                               <p className="text-xs text-gray-500 dark:text-gray-400">Keine erlaubten Zwecke oder Spezialfeatures für diesen Vendor basierend auf den globalen Signalen.</p>
                           )}
                        </div>
                        <Button 
                            onClick={() => handleViewVendorDetails(vendorEntry)} 
                            isDarkMode={isDarkMode}
                            size="sm" 
                            className="mt-2 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
                                View More Details
                            </Button>
                      </div>
                    );
                  })}
                </div>
            </div>

            {/* Core Information Table - KORREKTUR BEI VERSION CHECK */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Core Information</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={tableHeaderBg}>
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Field</th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${bgColor}`}>
                    <tr className={tableRowBg}>
                      <td className="px-4 py-2 font-medium">Version</td>
                      <td className="px-4 py-2">{processedTcfData.version || 'N/A'}</td>
                    </tr>
                    <tr className={tableRowBg}>
                      <td className="px-4 py-2 font-medium">Created</td>
                      <td className="px-4 py-2">
                        {processedTcfData.created ? new Date(processedTcfData.created).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                    <tr className={tableRowBg}>
                      <td className="px-4 py-2 font-medium">Last Updated</td>
                      <td className="px-4 py-2">
                        {processedTcfData.lastUpdated ? new Date(processedTcfData.lastUpdated).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                    <tr className={tableRowBg}>
                      <td className="px-4 py-2 font-medium">CMP ID</td>
                      <td className="px-4 py-2">{processedTcfData.cmpId ?? 'N/A'}</td>
                    </tr>
                    <tr className={tableRowBg}>
                      <td className="px-4 py-2 font-medium">CMP Version</td>
                      <td className="px-4 py-2">{processedTcfData.cmpVersion ?? 'N/A'}</td>
                    </tr>
                    <tr className={tableRowBg}>
                      <td className="px-4 py-2 font-medium">Consent Screen</td>
                      <td className="px-4 py-2">{processedTcfData.consentScreen ?? 'N/A'}</td>
                    </tr>
                    <tr className={tableRowBg}>
                      <td className="px-4 py-2 font-medium">Consent Language</td>
                      <td className="px-4 py-2">{processedTcfData.consentLanguage || 'N/A'}</td>
                    </tr>
                    <tr className={tableRowBg}>
                      <td className="px-4 py-2 font-medium">Vendor List Version</td>
                      <td className="px-4 py-2">{processedTcfData.vendorListVersion ?? 'N/A'}</td>
                    </tr>
                    <tr className={tableRowBg}>
                      <td className="px-4 py-2 font-medium">Policy Version</td>
                      <td className="px-4 py-2">{processedTcfData.policyVersion ?? 'N/A'}</td>
                    </tr>
                    {/* Spezifische Felder für TCF v2.2 */}
                    {/* KORREKTUR: Numerischer Vergleich für Version */}
                    {processedTcfData.version === 2.2 && (
                      <>
                        <tr className={tableRowBg}>
                          <td className="px-4 py-2 font-medium">Purpose One Treatment</td>
                          <td className="px-4 py-2">{processedTcfData.purposeOneTreatment ? 'Yes' : 'No'}</td>
                        </tr>
                        <tr className={tableRowBg}>
                          <td className="px-4 py-2 font-medium">Publisher Country Code</td>
                          <td className="px-4 py-2">{processedTcfData.publisherCountryCode || 'N/A'}</td>
                        </tr>
                      </>
                    )}
                     <tr className={tableRowBg}>
                       <td className="px-4 py-2 font-medium">Is Service Specific</td>
                       <td className="px-4 py-2">{processedTcfData.isServiceSpecific ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Use Non Standard Texts</td>
                        <td className="px-4 py-2">{processedTcfData.useNonStandardTexts ? 'Yes' : 'No'}</td>
                    </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Supports OOB</td>
                        <td className="px-4 py-2">{processedTcfData.supportsOOB ? 'Yes' : 'No'}</td>
                     </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Global Consents Section - KORREKTUR: Purpose-Namen über GVL holen (wie bei Key Vendors) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
               {/* Purpose Consents */}
               <div className="p-4 border rounded-lg border-gray-300 dark:border-gray-700">
                  <h4 className="font-semibold mb-3">Global Purpose Consents</h4>
                  <ul className="space-y-1 text-sm">
                     {processedTcfData.globalPurposeConsents?.length === 0 ? (
                       <li className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">None</li>
                     ) : (
                       processedTcfData.globalPurposeConsents?.map((p: number) => (
                         <li key={`consent-${p}`} className="p-2 bg-green-100 dark:bg-green-900 rounded">
                           {`${p}. ${processedTcfData.rawTCModel?.gvl?.purposes?.[p.toString()]?.name || `Purpose ${p}`}`}
                         </li>
                       ))
                     )}
                  </ul>
               </div>
               {/* Legitimate Interests */}
               <div className="p-4 border rounded-lg border-gray-300 dark:border-gray-700">
                  <h4 className="font-semibold mb-3">Global Legitimate Interests</h4>
                  <ul className="space-y-1 text-sm">
                     {processedTcfData.globalPurposeLegitimateInterests?.length === 0 ? (
                       <li className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">None</li>
                     ) : (
                       processedTcfData.globalPurposeLegitimateInterests?.map((p: number) => (
                         <li key={`li-${p}`} className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                            {`${p}. ${processedTcfData.rawTCModel?.gvl?.purposes?.[p.toString()]?.name || `Purpose ${p}`}`}
                         </li>
                       ))
                     )}
                  </ul>
               </div>
               {/* Special Features */}
                <div className="p-4 border rounded-lg border-gray-300 dark:border-gray-700">
                  <h4 className="font-semibold mb-3">Global Special Feature Opt-ins</h4>
                   <ul className="space-y-1 text-sm">
                    {processedTcfData.globalSpecialFeatureOptIns?.length === 0 ? (
                     <li className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">None</li>
                     ) : (
                      processedTcfData.globalSpecialFeatureOptIns?.map((f: number) => (
                        <li key={`feature-${f}`} className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
                          {`${f}. ${processedTcfData.rawTCModel?.gvl?.specialFeatures?.[f.toString()]?.name || `Special Feature ${f}`}`}
                        </li>
                      ))
                    )}
                  </ul>
               </div>
            </div>
            
            {/* Vollständige Vendor-Liste mit Consent-Status */}
            {processedTcfData.rawTCModel?.gvl?.vendors && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Alle Vendoren mit Consent-Status</h3>
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
                      {Object.values(processedTcfData.rawTCModel.gvl.vendors)
                        .sort((a, b) => a.id - b.id)
                        .map((vendor) => {
                          const vendorId = vendor.id;
                          const hasConsent = processedTcfData.rawTCModel?.vendorConsents?.has(vendorId) || false;
                          
                          // Überprüfe, ob der Vendor in der LI-Liste steht UND ob er LI-Purposes hat
                          const hasVendorLIFlag = processedTcfData.rawTCModel?.vendorLegitimateInterests?.has(vendorId) || false;
                          const vendorLIPurposes = vendor.legIntPurposes || [];
                          const acceptedLIPurposes = vendorLIPurposes.filter(p => 
                            processedTcfData.rawTCModel?.purposeLegitimateInterests?.has(p)
                          );
                          // Beide Bedingungen müssen erfüllt sein
                          const hasLI = hasVendorLIFlag && acceptedLIPurposes.length > 0;
                          
                          return (
                            <tr key={`vendor-${vendorId}`} className={tableRowBg}>
                              <td className="px-4 py-2">{vendorId}</td>
                              <td className="px-4 py-2">{vendor.name}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${hasConsent ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                                  {hasConsent ? 'Ja' : 'Nein'}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${hasLI ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                                  {hasLI ? 'Ja' : 'Nein'}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <Button 
                                  onClick={() => {
                                    // Erstelle ein simuliertes ProcessedVendorInfo-Objekt für diesen Vendor
                                    const vendorPurposes = vendor.purposes || [];
                                    const vendorLIPurposes = vendor.legIntPurposes || [];
                                    const vendorSpecialFeatures = vendor.specialFeatures || [];
                                    
                                    // Filter auf erlaubte Purposes basierend auf globalen Consent-Einstellungen
                                    const activePurposesConsent = hasConsent ? 
                                      vendorPurposes.filter(p => processedTcfData.rawTCModel?.purposeConsents?.has(p)) :
                                      [];
                                    
                                    // LI-Purposes nur filtern wenn der Vendor in der LI-Liste steht
                                    const activePurposesLI = hasVendorLIFlag ? 
                                      vendorLIPurposes.filter(p => processedTcfData.rawTCModel?.purposeLegitimateInterests?.has(p)) :
                                      [];
                                    
                                    const vendorInfo = {
                                      id: vendorId,
                                      name: vendor.name,
                                      hasConsent: hasConsent,
                                      hasLegitimateInterest: hasLI,
                                      policyUrl: vendor.policyUrl,
                                      purposesConsent: activePurposesConsent,
                                      purposesLI: activePurposesLI,
                                      specialFeaturesOptIn: 
                                        vendorSpecialFeatures.filter(f => processedTcfData.rawTCModel?.specialFeatureOptins?.has(f))
                                    };
                                    
                                    handleViewVendorDetails(vendorInfo);
                                  }}
                                  isDarkMode={isDarkMode}
                                  size="sm"
                                  className="text-xs"
                                >
                                  Details
                                </Button>
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
        
        {/* ... (Placeholder, Tab Navigation) ... */}
      </div> 
  );
  
  return (
    <div className={`${bgColor} ${textColor} p-6 rounded-lg shadow-lg w-full max-w-full mx-auto`}>
      <h1 className="text-2xl font-bold mb-4 flex items-center justify-between">
        <span>TCF String Decoder</span>
        <span className={`text-sm font-normal px-2 py-1 rounded ${highlightColor}`}>
          {processedTcfData?.version ? `Detected: TCF v${processedTcfData.version}` : 'Supports TCF v2.0 & v2.2'}
        </span>
      </h1>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            activeTab === 'decoder' 
              ? `${tabActiveBg} text-white` 
              : `${tabInactiveBg} ${secondaryTextColor}`
          }`}
          onClick={() => handleTabChange('decoder')}
        >
          TCF Decoder
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
            activeTab === 'gvl-explorer' 
              ? `${tabActiveBg} text-white` 
              : `${tabInactiveBg} ${secondaryTextColor}`
          }`}
          onClick={() => handleTabChange('gvl-explorer')}
        >
          GVL Explorer
        </button>
        {selectedVendor && (
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'vendor-details' 
                ? `${tabActiveBg} text-white` 
                : `${tabInactiveBg} ${secondaryTextColor}`
            }`}
            onClick={() => handleTabChange('vendor-details')}
          >
            Vendor Details
          </button>
        )}
      </div>
      
      {/* TCF Decoder Tab */}
      {activeTab === 'decoder' && renderDecoder()}
      
      {/* GVL Explorer Tab */}
      {activeTab === 'gvl-explorer' && renderGVLExplorer()}
      
      {/* Vendor Details Tab */}
      {activeTab === 'vendor-details' && selectedVendor && (
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button
              onClick={handleBackToResults}
              variant="secondary"
              isDarkMode={isDarkMode}
              size="sm"
            >
              ← Back
            </Button>
            <h2 className="text-xl font-semibold ml-3">{selectedVendor.name} (ID: {selectedVendor.id})</h2>
          </div>
          
          {/* Vendor Consent and LI Status Badges */}
          <div className="flex flex-wrap gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${selectedVendor.hasConsent ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              Consent: {selectedVendor.hasConsent ? 'Yes' : 'No'}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${selectedVendor.hasLegitimateInterest ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              Legitimate Interest: {selectedVendor.hasLegitimateInterest ? 'Yes' : 'No'}
            </span>
          </div>
          
          {/* GVL Information (if available) */}
          {processedTcfData?.rawTCModel?.gvl?.vendors && processedTcfData.rawTCModel.gvl.vendors[selectedVendor.id] && (
            <div className="mb-6 p-4 border rounded-lg border-gray-300 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-3">GVL Information</h3>
              <p className="text-sm"><strong>Name:</strong> {processedTcfData.rawTCModel.gvl.vendors[selectedVendor.id].name}</p>
              <p className="text-sm"><strong>Policy URL:</strong> 
                <a href={processedTcfData.rawTCModel.gvl.vendors[selectedVendor.id].policyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {processedTcfData.rawTCModel.gvl.vendors[selectedVendor.id].policyUrl}
                </a>
              </p>
              {/* Add more GVL details as needed */}
            </div>
          )}
          
          {/* Decoded Purposes and Special Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Purposes with Consent</h4>
              {selectedVendor.purposesConsent.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.purposesConsent.map((pId: number) => (
                    <li key={`vd-consent-${pId}`}>{`${pId}. ${processedTcfData?.rawTCModel?.gvl?.purposes?.[pId.toString()]?.name || `Purpose ${pId}`}`}</li>
                  ))}
                </ul>
              ) : <p className="text-sm italic">None</p>}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Purposes with Legitimate Interest</h4>
              {selectedVendor.purposesLI.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.purposesLI.map((pId: number) => (
                    <li key={`vd-li-${pId}`}>{`${pId}. ${processedTcfData?.rawTCModel?.gvl?.purposes?.[pId.toString()]?.name || `Purpose ${pId}`}`}</li>
                  ))}
                </ul>
              ) : <p className="text-sm italic">None</p>}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Special Features with Opt-in</h4>
              {selectedVendor.specialFeaturesOptIn.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.specialFeaturesOptIn.map((sfId: number) => (
                    <li key={`vd-sf-${sfId}`}>{`${sfId}. ${processedTcfData?.rawTCModel?.gvl?.specialFeatures?.[sfId.toString()]?.name || `Special Feature ${sfId}`}`}</li>
                  ))}
                </ul>
              ) : <p className="text-sm italic">None</p>}
            </div>
          </div>
          
          {/* Add more details from `selectedVendor` as needed */}
        </div>
      )}
    </div>
  );
};

export default TCFDecoder; 