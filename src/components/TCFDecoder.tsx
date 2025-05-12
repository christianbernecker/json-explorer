import React, { useState, useEffect } from 'react';
import { purposeNames, decodeTCStringIAB } from '../utils/tcf-decoder';
import { loadGVL, getVendors, GVLData, GVLVendor, clearGVLCache } from '../utils/gvl-loader';
import Button from './shared/Button';

interface TCFDecoderProps {
  isDarkMode: boolean;
}

// Tabs for display
type ActiveTab = 'decoder' | 'gvl-explorer' | 'vendor-details';

// Filter options for display
interface VendorFilterOptions {
  onlyWithConsent: boolean;
  onlyWithLegitimateInterest: boolean;
  purposeFilter: number | null;
}

// Example TCF string
const EXAMPLE_TCF_STRING = "CPBZjR9PBZjR9AKAZADEBUCsAP_AAH_AAAqIHWtf_X_fb39j-_59_9t0eY1f9_7_v-0zjhfds-8Nyf_X_L8X42M7vF36pq4KuR4Eu3LBIQFlHOHUTUmw6okVrTPsak2Mr7NKJ7LEinMbe2dYGHtfn91TuZKY7_78_9fz3_-v_v___9f3r-3_3__59X---_e_V399zLv9__34HlAEmGpfABdiWODJtGlUKIEYVhIdAKACigGFoisIHVwU7K4CP0EDABAagIwIgQYgoxYBAAIBAEhEQEgB4IBEARAIAAQAqQEIACNgEFgBYGAQACgGhYgRQBCBIQZHBUcpgQESLRQT2VgCUXexphCGUUAJAAA.YAAAAAAAAAAA";

const TCFDecoder: React.FC<TCFDecoderProps> = ({ isDarkMode }) => {
  // State for the decoder
  const [tcfString, setTcfString] = useState('');
  const [additionalVendorId, setAdditionalVendorId] = useState<number>(136);
  const [decodedVersion, setDecodedVersion] = useState<string>('');
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodedData, setDecodedData] = useState<any | null>(null);
  const [showBitRepresentation, setShowBitRepresentation] = useState<boolean>(false);
  const [bitRepresentation, setBitRepresentation] = useState<string>('');
  
  // State for GVL and tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('decoder');
  const [gvlData, setGvlData] = useState<GVLData | null>(null);
  const [isLoadingGVL, setIsLoadingGVL] = useState<boolean>(false);
  const [gvlError, setGvlError] = useState<string | null>(null);
  
  // State for GVL Explorer
  const [vendorSearchTerm, setVendorSearchTerm] = useState<string>('');
  const [filteredVendors, setFilteredVendors] = useState<GVLVendor[]>([]);
  
  // State for advanced functions
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vendorFilter, setVendorFilter] = useState<VendorFilterOptions>({
    onlyWithConsent: false,
    onlyWithLegitimateInterest: false,
    purposeFilter: null
  });
  
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const secondaryBtnColor = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const bitTextColor = isDarkMode ? 'text-blue-300' : 'text-blue-600';
  const tabActiveBg = isDarkMode ? 'bg-blue-700' : 'bg-blue-500';
  const tabInactiveBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
  const tableHeaderBg = isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800';
  const tableRowBg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tableLightRowBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tableDarkRowBg = isDarkMode ? 'bg-gray-900' : 'bg-gray-50';
  
  // Load GVL
  useEffect(() => {
    async function fetchGVL() {
      try {
        // Clear the GVL cache to ensure we always get the latest data
        clearGVLCache();
        
        setIsLoadingGVL(true);
        setGvlError(null);
        const data = await loadGVL();
        setGvlData(data);
        if (activeTab === 'gvl-explorer') {
          updateFilteredVendors(data, vendorSearchTerm);
        }
      } catch (error) {
        console.error('Error loading GVL:', error);
        setGvlError(error instanceof Error ? error.message : 'Unknown error loading GVL');
      } finally {
        setIsLoadingGVL(false);
      }
    }
    
    fetchGVL();
  }, [activeTab, vendorSearchTerm]);
  
  // Update filtered vendors
  useEffect(() => {
    if (gvlData) {
      updateFilteredVendors(gvlData, vendorSearchTerm);
    }
  }, [gvlData, vendorSearchTerm]);
  
  // Filter function for vendors
  function updateFilteredVendors(data: GVLData, searchTerm: string) {
    if (!data || !data.vendors) {
      setFilteredVendors([]);
      return;
    }
    
    let filtered = getVendors(data);
    
    // Kombinierte Suche für Namen und ID
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => {
        // Suche nach ID
        const idMatch = v.id.toString().includes(term);
        // Suche nach Name
        const nameMatch = v.name.toLowerCase().includes(term);
        
        return idMatch || nameMatch;
      });
    }
    
    setFilteredVendors(filtered);
  }
  
  // Load example TCF string
  const loadExample = () => {
    setTcfString(EXAMPLE_TCF_STRING);
  };

  // Process TCF string
  const handleDecode = async () => {
    try {
      setDecodeError(null);
      
      if (!tcfString.trim()) {
        setDecodeError('Please enter a TCF string');
        return;
      }
      
      // Neue IAB-Implementierung
      const tcModel = decodeTCStringIAB(tcfString);
      
      // DEBUG LOG: Gib das empfangene tcModel aus
      console.log('DEBUG: Received tcModel from decodeTCStringIAB:', tcModel);
      
      // Prüfe, ob das Decodieren erfolgreich war
      if (!tcModel) {
        setDecodeError('Failed to decode TCF string. The string may be invalid or corrupted.');
        return;
      }
      
      setDecodedVersion(tcModel.version?.toString() || '2');
      
      // Debug log
      console.log('IAB TCModel:', tcModel);
      
      // TCString-Objekte als JSON kopieren, um UI-freundliche Strukturen zu erstellen
      const processedModel = {
        ...tcModel,
        // Die Struktur ist jetzt anders in unserer neuen Implementierung
        purposesConsent: tcModel.coreData.purposesConsent || [],
        purposesLITransparency: tcModel.coreData.purposesLITransparency || [],
        specialFeatureOptIns: tcModel.coreData.specialFeatureOptIns || [],
        // Verwende die vorhandenen Vendor-Ergebnisse
        vendorResults: tcModel.vendorResults || []
      };
      
      // DEBUG LOG: Gib das processierte Model vor dem Setzen des States aus
      console.log('DEBUG: Processed Model for State:', processedModel);
      
      // Statt Probleme mit Typen zu haben, verwenden wir die originalen Referenzen
      // auf die Daten der IAB-Library
      setDecodedData(processedModel);
      setBitRepresentation(''); // Optional: kann entfernt werden
    } catch (error) {
      console.error('Error decoding:', error);
      setDecodeError(error instanceof Error ? error.message : 'Unknown error decoding');
      setDecodedData(null);
      setBitRepresentation('');
    }
  };

  // Filter for vendors by consent/LegInt
  const getFilteredVendorResults = (): any[] => {
    // Erstelle UI-freundliche Vendor-Ergebnisse, falls sie noch nicht existieren
    if (!decodedData.vendorResults || decodedData.vendorResults.length === 0) {
      // Default Vendors anzeigen (136, 137, 44) und zusätzlichen Vendor
      const keyVendorIds = [136, 137, 44];
      if (additionalVendorId && !keyVendorIds.includes(additionalVendorId)) {
        keyVendorIds.push(additionalVendorId);
      }
      
      // Sammle alle Vendoren mit Consent oder LegitimateInterest
      const vendorIds = new Set(keyVendorIds);
      
      // Durchlaufe alle möglichen Vendor-IDs aus dem TCString-Objekt
      if (decodedData?.vendorConsents || decodedData?.vendorLegitimateInterests) {
        // Bei GVL-Daten können wir tatsächlich vorhandene Vendor-IDs überprüfen
        if (decodedData?.gvl?.vendors) {
          Object.keys(decodedData.gvl.vendors).forEach(id => {
            const numId = parseInt(id, 10);
            if (!isNaN(numId) && !vendorIds.has(numId)) {
              // Prüfe, ob dieser Vendor Consent oder LegitimateInterest hat
              // WICHTIG: Verwende isSet() statt has() - das ist die korrekte API der IAB-Library
              const hasConsent = decodedData?.vendorConsents?.isSet?.(numId) || false;
              const hasLegitimateInterest = decodedData?.vendorLegitimateInterests?.isSet?.(numId) || false;
              
              if (hasConsent || hasLegitimateInterest) {
                vendorIds.add(numId);
              }
            }
          });
        } else {
          // Wenn keine GVL-Daten, dann prüfen wir die Bitfelder direkt
          // Maximal 1000 Vendor-IDs überprüfen (um Endlosschleife zu vermeiden)
          for (let id = 1; id <= 1000; id++) {
            if (!vendorIds.has(id)) {
              // WICHTIG: Verwende isSet() statt has() - das ist die korrekte API der IAB-Library
              const hasConsent = decodedData?.vendorConsents?.isSet?.(id) || false;
              const hasLegitimateInterest = decodedData?.vendorLegitimateInterests?.isSet?.(id) || false;
              
              if (hasConsent || hasLegitimateInterest) {
                vendorIds.add(id);
              }
            }
          }
        }
      }
      
      // Generiere Vendor-Ergebnisse mit den Daten der IAB-Library
      const results = Array.from(vendorIds).map(id => {
        // WICHTIG: Verwende isSet() statt has() - das ist die korrekte API der IAB-Library
        const hasConsent = decodedData?.vendorConsents?.isSet?.(id) || false;
        const hasLegitimateInterest = decodedData?.vendorLegitimateInterests?.isSet?.(id) || false;
        const name = decodedData?.gvl?.vendors?.[id]?.name || `Vendor ${id}`;
        const policyUrl = decodedData?.gvl?.vendors?.[id]?.policyUrl || '#';
        const isKeyVendor = keyVendorIds.includes(id);
        
        return {
          id,
          name,
          policyUrl,
          hasConsent,
          hasLegitimateInterest,
          isKeyVendor, // Flag für Key Vendors
          // Dummy-Structures für die UI-Anzeige
          purposes: [],
          specialFeatures: []
        };
      });
      
      // Update vendorResults
      decodedData.vendorResults = results;
    }
    
    let filtered = [...decodedData.vendorResults];
    
    if (vendorFilter.onlyWithConsent) {
      filtered = filtered.filter(v => v.hasConsent);
    }
    
    if (vendorFilter.onlyWithLegitimateInterest) {
      filtered = filtered.filter(v => v.hasLegitimateInterest);
    }
    
    return filtered;
  };

  // JSON export of results
  const handleExportJSON = () => {
    if (!decodedData) return;
    
    try {
      // Erstelle eine kopierte Version mit serialisierbaren Typen (keine Sets/Maps)
      const serializable = {
        version: decodedVersion,
        created: decodedData.created ? new Date(decodedData.created).toISOString() : null,
        lastUpdated: decodedData.lastUpdated ? new Date(decodedData.lastUpdated).toISOString() : null,
        // Basis-Informationen
        cmpId: decodedData.cmpId,
        cmpVersion: decodedData.cmpVersion,
        consentScreen: decodedData.consentScreen,
        consentLanguage: decodedData.consentLanguage,
        vendorListVersion: decodedData.vendorListVersion,
        policyVersion: decodedData.policyVersion,
        isServiceSpecific: decodedData.isServiceSpecific,
        useNonStandardStacks: decodedData.useNonStandardStacks,
        // Nutze die konvertierten Arrays
        specialFeatureOptIns: decodedData.specialFeatureOptIns || [],
        purposesConsent: decodedData.purposesConsent || [],
        purposesLITransparency: decodedData.purposesLITransparency || [],
        purposeOneTreatment: decodedData.purposeOneTreatment,
        publisherCC: decodedData.publisherCC,
        // Vendoren
        vendors: getFilteredVendorResults()
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(serializable, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "tcf_decoded.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error('Error exporting JSON:', error);
      setDecodeError(error instanceof Error ? error.message : 'Unknown error exporting JSON');
    }
  };

  // Tab change handler
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };
  
  // Export GVL as JSON
  const handleExportGVL = () => {
    if (!gvlData) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gvlData, null, 2));
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
    
    if (!gvlData) {
      return <div className={`p-4 text-center ${textColor}`}>GVL data not available</div>;
    }

    return (
      <div className={`mt-4 ${textColor}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-3 md:space-y-0">
          <div>
            <h3 className="text-lg font-semibold">Global Vendor List Explorer</h3>
            <p className={`text-sm ${secondaryTextColor}`}>
              Version {gvlData.vendorListVersion} ({gvlData.tcfPolicyVersion})
              <span className="mx-2">•</span>
              Last Updated: {gvlData.lastUpdated ? new Date(gvlData.lastUpdated).toLocaleDateString() : 'N/A'}
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
          {filteredVendors.length !== Object.keys(gvlData?.vendors || {}).length && 
            ` (of ${Object.keys(gvlData?.vendors || {}).length} total)`
          }
        </div>
      </div>
    );
  };

  return (
    <div className={`${bgColor} ${textColor} p-6 rounded-lg shadow-lg w-full max-w-full mx-auto`}>
      <h1 className="text-2xl font-bold mb-4 flex items-center justify-between">
        <span>TCF String Decoder</span>
        <span className={`text-sm font-normal px-2 py-1 rounded ${highlightColor}`}>
          {decodedVersion ? `Detected: TCF v${decodedVersion}` : 'Supports TCF v2.0 & v2.2'}
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
      {activeTab === 'decoder' && (
        <>
          {/* Input section */}
          <div className="mb-6">
            <label htmlFor="tcfInput" className="block font-semibold mb-2">Enter TCF String:</label>
            <textarea 
              id="tcfInput"
              className={`w-full h-24 p-3 rounded-md ${inputBgColor} ${inputBorderColor} border text-sm font-mono mb-4`}
              placeholder="Paste your TCF string here..."
              value={tcfString}
              onChange={(e) => setTcfString(e.target.value)}
            />
            
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label htmlFor="vendorIdInput" className="block font-semibold mb-2">
                  Additional Vendor ID:
                </label>
                <input 
                  type="number" 
                  id="vendorIdInput"
                  min="1"
                  value={additionalVendorId}
                  onChange={(e) => setAdditionalVendorId(Number(e.target.value))}
                  className={`w-32 p-2 rounded-md ${inputBgColor} ${inputBorderColor} border text-sm`}
                />
              </div>
              
              <div className="self-end flex space-x-2">
                <Button 
                  onClick={handleDecode}
                  variant="primary"
                  isDarkMode={isDarkMode}
                  size="md"
                >
                  Decode TCF String
                </Button>
                
                <Button 
                  onClick={loadExample}
                  variant="secondary"
                  isDarkMode={isDarkMode}
                  size="md"
                >
                  Load Example
                </Button>
              </div>
            </div>
          </div>
          
          {/* Error display */}
          {decodeError && (
            <div className={`p-4 my-4 rounded-md bg-red-100 dark:bg-red-900 ${errorColor}`}>
              <p>{decodeError}</p>
            </div>
          )}
          
          {/* Results section */}
          {decodedData && (
            <div id="results" className={`my-6 p-5 border ${borderColor} rounded-md`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Decoding Results</h2>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleExportJSON}
                    variant="export"
                    isDarkMode={isDarkMode}
                    size="sm"
                  >
                    Export JSON
                  </Button>
                  
                  <Button 
                    onClick={() => setShowBitRepresentation(!showBitRepresentation)}
                    variant="secondary"
                    isDarkMode={isDarkMode}
                    size="sm"
                  >
                    {showBitRepresentation ? 'Hide Binary' : 'Show Binary'}
                  </Button>
                </div>
              </div>

              {/* Key Vendors Section */}
              <div className="mb-6 p-4 border-b border-gray-300 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Key Vendors (136, 137, 44)</h3>
                <div className="grid grid-cols-1 gap-4">
                  {[136, 137, 44].map((id: number) => {
                    const vendorEntry = decodedData?.vendorResults?.find((v: any) => v.id === id);
                    const hasVendorConsent = vendorEntry?.hasConsent || false;
                    
                    // DEBUG LOG: Gib den Consent-Status für jeden Key Vendor aus
                    console.log(`DEBUG: Key Vendor ${id}, Consent: ${hasVendorConsent}, Entry:`, vendorEntry);
                    
                    // KORREKTUR: Direkter Zugriff auf hasLegitimateInterest
                    const hasVendorLI = vendorEntry?.hasLegitimateInterest || false;
                    
                    // Vendor spezifische Purposes aus der GVL (oder dem Vendor Entry, falls GVL nicht geladen)
                    const gvlVendorInfo = decodedData?.gvl?.vendors?.[id];
                    const vendorPurposes = gvlVendorInfo?.purposeIds || vendorEntry?.purposes || [];
                    const vendorLegIntPurposes = gvlVendorInfo?.legIntPurposeIds || vendorEntry?.legIntPurposes || [];
                    const vendorSpecialFeatures = gvlVendorInfo?.specialFeatureIds || [];
                    
                    // Für welche Purposes wurde Consent gegeben (global)?
                    const globalPurposesWithConsent = decodedData?.purposesConsent || [];
                    
                    // Für welche Purposes wurde Legitimate Interest gegeben (global)?
                    const globalPurposesWithLI = decodedData?.purposesLITransparency || [];
                    
                    // Special Features Opt-in (global)
                    const globalSpecialFeatures = decodedData?.specialFeatureOptIns || [];
                    
                    // Schnittmenge zwischen globalen Purposes und Vendor Purposes
                    const purposesWithConsent = vendorPurposes.filter((purposeId: number) => 
                      globalPurposesWithConsent.includes(purposeId) && // Globaler Consent für den Purpose
                      hasVendorConsent // UND der Vendor hat generellen Consent
                    );
                    
                    const purposesWithLI = vendorLegIntPurposes.filter((purposeId: number) => 
                      globalPurposesWithLI.includes(purposeId) && // Globaler LI für den Purpose
                      hasVendorLI // UND der Vendor hat generelles LI
                    );
                    
                    const specialFeaturesAllowed = vendorSpecialFeatures.filter((featureId: number) => 
                      globalSpecialFeatures.includes(featureId)
                    );
                    
                    // Name des Vendors aus der GVL
                    const vendorName = decodedData?.gvl?.vendors?.[id]?.name || `Vendor ${id}`;
                    
                    // Hilfsfunktion zum sicheren Abrufen von Purpose-Namen
                    const getPurposeName = (purposeId: number): string => {
                      return purposeId in purposeNames 
                        ? purposeNames[purposeId as keyof typeof purposeNames] 
                        : `Purpose ${purposeId}`;
                    };
                    
                    return (
                      <div key={id} className="mb-6 p-4 border rounded-lg border-gray-300 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold">{vendorName}</h3>
                          <div className={`px-3 py-1 rounded-md text-sm ${hasVendorConsent ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            Consent: {hasVendorConsent ? 'Ja' : 'Nein'}
                          </div>
                        </div>
                        <p className="text-sm mb-2">Vendor ID: {id}</p>
                        
                        <div className="mt-3">
                          <p className="font-medium">Purposes mit Consent:</p>
                          {purposesWithConsent.length > 0 ? (
                            <ul className="list-disc pl-5">
                              {purposesWithConsent.map((purposeId: number) => (
                                <li key={`consent-${purposeId}`} className="text-sm">
                                  {getPurposeName(purposeId)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm italic">Keine Purposes mit Consent</p>
                          )}
                        </div>
                        
                        <div className="mt-3">
                          <p className="font-medium">Purposes mit Legitimate Interest:</p>
                          {purposesWithLI.length > 0 ? (
                            <ul className="list-disc pl-5">
                              {purposesWithLI.map((purposeId: number) => (
                                <li key={`li-${purposeId}`} className="text-sm">
                                  {getPurposeName(purposeId)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm italic">Keine Purposes mit Legitimate Interest</p>
                          )}
                        </div>
                        
                        <div className="mt-3">
                          <p className="font-medium">Special Features (Opt-in):</p>
                          {specialFeaturesAllowed.length > 0 ? (
                            <ul className="list-disc pl-5">
                              {specialFeaturesAllowed.map((featureId: number) => (
                                <li key={`feature-${featureId}`} className="text-sm">
                                  Special Feature {featureId} {/* Ggf. Namen aus GVL laden */}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm italic">Keine Special Features mit Opt-in</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Core metadata */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Core Information</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr className={tableHeaderBg}>
                        <th className="px-4 py-2 text-left">Field</th>
                        <th className="px-4 py-2 text-left">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Version</td>
                        <td className="px-4 py-2">{decodedData.version || 'N/A'}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Created</td>
                        <td className="px-4 py-2">
                          {decodedData.coreData?.created ? new Date(decodedData.coreData.created).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Last Updated</td>
                        <td className="px-4 py-2">
                          {decodedData.coreData?.lastUpdated ? new Date(decodedData.coreData.lastUpdated).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">CMP ID</td>
                        <td className="px-4 py-2">{decodedData.coreData?.cmpId ?? 'N/A'}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">CMP Version</td>
                        <td className="px-4 py-2">{decodedData.coreData?.cmpVersion ?? 'N/A'}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Consent Screen</td>
                        <td className="px-4 py-2">{decodedData.coreData?.consentScreen ?? 'N/A'}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Consent Language</td>
                        <td className="px-4 py-2">{decodedData.coreData?.consentLanguage || 'N/A'}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Vendor List Version</td>
                        <td className="px-4 py-2">{decodedData.coreData?.vendorListVersion ?? 'N/A'}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Policy Version</td>
                        <td className="px-4 py-2">{decodedData.coreData?.policyVersion ?? 'N/A'}</td>
                      </tr>
                      {/* Spezifische Felder für TCF v2.2 */}
                      {decodedData.version === '2.2' && (
                        <>
                          <tr className={tableRowBg}>
                            <td className="px-4 py-2 font-medium">Purpose One Treatment</td>
                            <td className="px-4 py-2">{decodedData.coreData?.purposeOneTreatment ? 'Yes' : 'No'}</td>
                          </tr>
                          <tr className={tableRowBg}>
                            <td className="px-4 py-2 font-medium">Publisher Country Code</td>
                            <td className="px-4 py-2">{decodedData.coreData?.publisherCC || 'N/A'}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Consent details */}
              <div className="my-6">
                <h3 className="text-lg font-semibold mb-3">Consent Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Purpose Consents</h4>
                    <ul className="space-y-1 text-sm">
                      {decodedData.purposesConsent?.length === 0 ? (
                        <li className="p-2 bg-red-100 dark:bg-red-900 rounded">No purpose consents given</li>
                      ) : (
                        decodedData.purposesConsent?.map((p: number) => (
                          <li key={`consent-${p}`} className="p-2 bg-green-100 dark:bg-green-900 rounded">
                            {`${p}. ${purposeNames[p] || `Purpose ${p}`}`}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Legitimate Interests</h4>
                    <ul className="space-y-1 text-sm">
                      {decodedData.purposesLITransparency?.length === 0 ? (
                        <li className="p-2 bg-red-100 dark:bg-red-900 rounded">No legitimate interests declared</li>
                      ) : (
                        decodedData.purposesLITransparency?.map((p: number) => (
                          <li key={`li-${p}`} className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                            {`${p}. ${purposeNames[p] || `Purpose ${p}`}`}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Special Features */}
              <div className="my-6">
                <h3 className="text-lg font-semibold mb-3">Special Features</h3>
                <div>
                  {decodedData.specialFeatureOptIns?.length === 0 ? (
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                      No special features opted in
                    </div>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {decodedData.specialFeatureOptIns?.map((f: number) => (
                        <li key={`feature-${f}`} className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
                          Special Feature {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Vollständige Vendor-Liste */}
              {decodedData?.gvl?.vendors && (
                <div className="mb-6 p-4 border-b border-gray-300 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-3">Alle Vendors mit Consent-Status</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className={tableHeaderBg}>
                        <tr>
                          <th className="px-4 py-2 text-left">Vendor ID</th>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Consent</th>
                          <th className="px-4 py-2 text-left">Legitimate Interest</th>
                          <th className="px-4 py-2 text-left">Purposes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredVendors.map((vendor) => {
                          const vendorId = vendor.id;
                          const hasVendorConsent = decodedData.coreData?.vendorConsent?.includes(vendorId) || false;
                          const hasVendorLI = decodedData.coreData?.vendorLI?.includes(vendorId) || false;
                          
                          const vendorSpecificInfo = decodedData.vendorResults?.find((v:any) => v.id === vendorId);
                          const consentPurposes = vendorSpecificInfo?.purposes || [];
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const liPurposes = vendorSpecificInfo?.legIntPurposes || [];
                          
                          return (
                            <tr key={vendorId} className={tableRowBg}>
                              <td className="px-4 py-2">{vendorId}</td>
                              <td className="px-4 py-2">{vendor.name}</td>
                              <td className="px-4 py-2">
                                <span className={hasVendorConsent ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400'}>
                                  {hasVendorConsent ? 'Ja' : 'Nein'}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <span className={hasVendorLI ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400'}>
                                  {hasVendorLI ? 'Ja' : 'Nein'}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                {consentPurposes.length > 0 ? (
                                  <ul className="list-disc list-inside">
                                    {consentPurposes.map((purposeId: number) => (
                                      <li key={`consent-${purposeId}`}>
                                        Purpose {purposeId}: {decodedData?.gvl?.purposes?.[purposeId]?.name || `Purpose ${purposeId}`}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="italic">Keine Purposes mit Consent</p>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bit representation */}
              {showBitRepresentation && (
                <div className="my-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <h3 className="text-lg font-semibold mb-3">Binary Representation</h3>
                  <div className={`font-mono text-xs whitespace-pre-wrap ${bitTextColor}`}>
                    {bitRepresentation}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!decodedData && !decodeError && (
            <div className={`p-4 border ${borderColor} rounded-md mt-6`}>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Results will be displayed here...
              </p>
            </div>
          )}
        </>
      )}
      
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
          {gvlData && gvlData.vendors && gvlData.vendors[selectedVendor.id] && (
            <div className="mb-6 p-4 border rounded-lg border-gray-300 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-3">GVL Information</h3>
              <p className="text-sm"><strong>Name:</strong> {gvlData.vendors[selectedVendor.id].name}</p>
              <p className="text-sm"><strong>Policy URL:</strong> 
                <a href={gvlData.vendors[selectedVendor.id].policyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {gvlData.vendors[selectedVendor.id].policyUrl}
                </a>
              </p>
              {/* Add more GVL details as needed */}
            </div>
          )}
          
          {/* Decoded Purposes and Special Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Purposes with Consent</h4>
              {selectedVendor.purposes?.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.purposes.map((pId: number) => (
                    <li key={`vd-consent-${pId}`}>{`${pId}. ${purposeNames[pId] || `Purpose ${pId}`}`}</li>
                  ))}
                </ul>
              ) : <p className="text-sm italic">None</p>}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Purposes with Legitimate Interest</h4>
              {selectedVendor.legIntPurposes?.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.legIntPurposes.map((pId: number) => (
                    <li key={`vd-li-${pId}`}>{`${pId}. ${purposeNames[pId] || `Purpose ${pId}`}`}</li>
                  ))}
                </ul>
              ) : <p className="text-sm italic">None</p>}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Special Features with Opt-in</h4>
              {selectedVendor.specialFeatures?.length > 0 ? (
                <ul className="list-disc pl-5 text-sm">
                  {selectedVendor.specialFeatures.map((sfId: number) => (
                    <li key={`vd-sf-${sfId}`}>{`Special Feature ${sfId}`}</li> // Ggf Namen aus GVL
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