import React, { useState, useEffect } from 'react';
import { purposeNames, decodeTCFStringIAB } from '../utils/tcf-decoder';
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
  const [vendorIdFilter, setVendorIdFilter] = useState<string>('');
  const [filteredVendors, setFilteredVendors] = useState<GVLVendor[]>([]);
  
  // State for advanced functions
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [vendorFilter, setVendorFilter] = useState<VendorFilterOptions>({
    onlyWithConsent: false,
    onlyWithLegitimateInterest: false,
    purposeFilter: null
  });
  
  // Color scheme based on dark mode
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const sectionBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  // Diese Farben werden jetzt durch die Button-Komponente abgelöst
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const buttonColor = isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white';
  const errorColor = isDarkMode ? 'text-red-300' : 'text-red-600';
  const inputBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const inputBorderColor = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const highlightColor = isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportBtnColor = isDarkMode ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-green-500 hover:bg-green-600 text-white';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const secondaryBtnColor = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const bitTextColor = isDarkMode ? 'text-blue-300' : 'text-blue-600';
  const tabActiveBg = isDarkMode ? 'bg-blue-700' : 'bg-blue-500';
  const tabInactiveBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
  const tableHeaderBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-100';
  const tableRowBg = isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  
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
          updateFilteredVendors(data, vendorSearchTerm, vendorIdFilter);
        }
      } catch (error) {
        console.error('Error loading GVL:', error);
        setGvlError(error instanceof Error ? error.message : 'Unknown error loading GVL');
      } finally {
        setIsLoadingGVL(false);
      }
    }
    
    fetchGVL();
  }, [activeTab, vendorSearchTerm, vendorIdFilter]);
  
  // Update filtered vendors
  useEffect(() => {
    if (gvlData) {
      updateFilteredVendors(gvlData, vendorSearchTerm, vendorIdFilter);
    }
  }, [gvlData, vendorSearchTerm, vendorIdFilter]);
  
  // Filter function for vendors
  function updateFilteredVendors(data: GVLData, searchTerm: string, idFilter: string) {
    if (!data || !data.vendors) {
      setFilteredVendors([]);
      return;
    }
    
    let filtered = getVendors(data);
    
    // Filter by name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(term)
      );
    }
    
    // Filter by ID
    if (idFilter) {
      const idNumber = parseInt(idFilter, 10);
      if (!isNaN(idNumber)) {
        // Search for exact ID
        filtered = filtered.filter(v => v.id === idNumber);
      } else {
        // Fallback to substring comparison for non-numeric inputs
        filtered = filtered.filter(v => v.id.toString().includes(idFilter));
      }
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
      const tcModel = decodeTCFStringIAB(tcfString);
      setDecodedVersion(tcModel.version.toString());
      
      // Debug log
      console.log('IAB TCModel:', tcModel);
      
      // TCString-Objekte als JSON kopieren, um UI-freundliche Strukturen zu erstellen
      const processedModel = {
        ...tcModel,
        // Konvertiere Sets zu Arrays für einfachere Handhabung in der UI
        purposesConsent: Array.from(tcModel.purposeConsents || []),
        purposesLITransparency: Array.from(tcModel.purposeLegitimateInterests || []),
        specialFeatureOptIns: Array.from(tcModel.specialFeatureOptins || []),
        // Erstelle leere Vendor-Ergebnisse für die UI
        vendorResults: []
      };
      
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
      const vendorIds = [136, 137, 44];
      if (additionalVendorId && !vendorIds.includes(additionalVendorId)) {
        vendorIds.push(additionalVendorId);
      }
      
      // Generiere Vendor-Ergebnisse mit den Daten der IAB-Library
      const results = vendorIds.map(id => {
        // Die IAB-Library verwendet das Vector-Objekt - hier prüfen wir mit der korrekten Methode
        const hasConsent = decodedData?.vendorConsents?.has?.(id) || false;
        const hasLegitimateInterest = decodedData?.vendorLegitimateInterests?.has?.(id) || false;
        const name = decodedData?.gvl?.vendors?.[id]?.name || `Vendor ${id}`;
        const policyUrl = decodedData?.gvl?.vendors?.[id]?.policyUrl || '#';
        
        return {
          id,
          name,
          policyUrl,
          hasConsent,
          hasLegitimateInterest,
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
        created: new Date(decodedData.created * 1000).toISOString(),
        lastUpdated: new Date(decodedData.lastUpdated * 1000).toISOString(),
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
  
  // Show vendor details
  const handleViewVendorDetails = (vendor: any) => {
    // Erweitere den Vendor um zusätzliche Daten aus der GVL, falls verfügbar
    const enrichedVendor = { ...vendor };
    
    const vendorId = vendor.id;
    const gvlVendor = decodedData?.gvl?.vendors?.[vendorId];
    
    // Füge fehlende Daten aus der GVL hinzu
    if (gvlVendor) {
      // Erstelle Purpose-Infos
      const purposes = gvlVendor.purposes?.map((purposeId: number) => {
        const purposeName = decodedData?.gvl?.purposes?.[purposeId]?.name || `Purpose ${purposeId}`;
        // Die IAB-Library verwendet das Vector-Objekt - hier prüfen wir mit der korrekten Methode
        const hasConsent = decodedData?.purposeConsents?.has?.(purposeId) || false;
        const hasLegitimateInterest = decodedData?.purposeLegitimateInterests?.has?.(purposeId) || false;
        
        return {
          id: purposeId,
          name: purposeName,
          hasConsent,
          hasLegitimateInterest,
          isAllowed: hasConsent,
          isLegitimateInterestAllowed: hasLegitimateInterest,
          isFlexiblePurpose: gvlVendor.flexiblePurposes?.includes(purposeId) || false,
          restriction: '-'
        };
      }) || [];
      
      // Erstelle Special Feature Infos
      const specialFeatures = gvlVendor.specialFeatures?.map((featureId: number) => {
        const featureName = decodedData?.gvl?.specialFeatures?.[featureId]?.name || `Feature ${featureId}`;
        // Die IAB-Library verwendet das Vector-Objekt - hier prüfen wir mit der korrekten Methode
        const hasConsent = decodedData?.specialFeatureOptins?.has?.(featureId) || false;
        
        return {
          id: featureId,
          name: featureName,
          hasConsent
        };
      }) || [];
      
      // Füge Special Purposes hinzu
      const specialPurposes = gvlVendor.specialPurposes?.map((purposeId: number) => {
        const purposeName = decodedData?.gvl?.specialPurposes?.[purposeId]?.name || `Special Purpose ${purposeId}`;
        
        return {
          id: purposeId,
          name: purposeName
        };
      }) || [];
      
      // Füge Features hinzu
      const features = gvlVendor.features?.map((featureId: number) => {
        const featureName = decodedData?.gvl?.features?.[featureId]?.name || `Feature ${featureId}`;
        
        return {
          id: featureId,
          name: featureName
        };
      }) || [];
      
      // Erweitere den Vendor mit allen Daten
      enrichedVendor.purposes = purposes;
      enrichedVendor.specialFeatures = specialFeatures;
      enrichedVendor.specialPurposes = specialPurposes;
      enrichedVendor.features = features;
    }
    
    setSelectedVendor(enrichedVendor);
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
              Last Updated: {new Date(gvlData.lastUpdated).toLocaleDateString()}
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
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
          <div className="flex-1">
            <input 
              type="text"
              placeholder="Search vendors by name..."
              className={`w-full px-3 py-2 rounded ${inputBgColor} ${inputBorderColor} border`}
              value={vendorSearchTerm}
              onChange={(e) => setVendorSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <input 
              type="text"
              placeholder="Filter by ID..."
              className={`w-full px-3 py-2 rounded ${inputBgColor} ${inputBorderColor} border`}
              value={vendorIdFilter}
              onChange={(e) => setVendorIdFilter(e.target.value)}
            />
          </div>
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
          {filteredVendors.length !== Object.keys(gvlData.vendors).length && 
            ` (of ${Object.keys(gvlData.vendors).length} total)`
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[136, 137, 44].map((id: number) => {
                    // Die IAB-Library verwendet das Vector-Objekt - hier prüfen wir mit der korrekten Methode
                    const hasConsent = decodedData?.vendorConsents?.has?.(id) || false;
                    const hasLegInt = decodedData?.vendorLegitimateInterests?.has?.(id) || false;
                    const name = decodedData?.gvl?.vendors?.[id]?.name || `Vendor ${id}`;
                    return (
                      <div key={id} className={`p-3 rounded-lg ${sectionBgColor}`}>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold">{name}</h4>
                          <span className="text-sm bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">ID: {id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className={`px-2 py-1 rounded ${hasConsent ? 'bg-green-200 dark:bg-green-900' : 'bg-red-200 dark:bg-red-900'}`}>
                            Consent: {hasConsent ? 'Yes' : 'No'}
                          </div>
                          <div className={`px-2 py-1 rounded ${hasLegInt ? 'bg-green-200 dark:bg-green-900' : 'bg-red-200 dark:bg-red-900'}`}>
                            Legitimate Interest: {hasLegInt ? 'Yes' : 'No'}
                          </div>
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
                        <td className="px-4 py-2">{decodedVersion}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Created</td>
                        <td className="px-4 py-2">
                          {decodedData.created ? new Date(decodedData.created * 1000).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Last Updated</td>
                        <td className="px-4 py-2">
                          {decodedData.lastUpdated ? new Date(decodedData.lastUpdated * 1000).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">CMP ID</td>
                        <td className="px-4 py-2">{decodedData.cmpId}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">CMP Version</td>
                        <td className="px-4 py-2">{decodedData.cmpVersion}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Consent Screen</td>
                        <td className="px-4 py-2">{decodedData.consentScreen}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Consent Language</td>
                        <td className="px-4 py-2">{decodedData.consentLanguage}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Vendor List Version</td>
                        <td className="px-4 py-2">{decodedData.vendorListVersion}</td>
                      </tr>
                      <tr className={tableRowBg}>
                        <td className="px-4 py-2 font-medium">Policy Version</td>
                        <td className="px-4 py-2">{decodedData.policyVersion}</td>
                      </tr>
                      {decodedVersion === '2.2' && (
                        <>
                          <tr className={tableRowBg}>
                            <td className="px-4 py-2 font-medium">Purpose One Treatment</td>
                            <td className="px-4 py-2">{decodedData.purposeOneTreatment ? 'Yes' : 'No'}</td>
                          </tr>
                          <tr className={tableRowBg}>
                            <td className="px-4 py-2 font-medium">Publisher Country Code</td>
                            <td className="px-4 py-2">{decodedData.publisherCC}</td>
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
                        decodedData.purposesConsent?.map((p: any) => (
                          <li key={`consent-${p}`} className="p-2 bg-green-100 dark:bg-green-900 rounded">
                            {p}. {purposeNames[p-1] || `Purpose ${p}`}
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
                        decodedData.purposesLITransparency?.map((p: any) => (
                          <li key={`li-${p}`} className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                            {p}. {purposeNames[p-1] || `Purpose ${p}`}
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
                      {decodedData.specialFeatureOptIns?.map((f: any) => (
                        <li key={`feature-${f}`} className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
                          Special Feature {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Vendors */}
              <div className="my-6">
                <h3 className="text-lg font-semibold mb-3">Vendor Analysis</h3>
                
                {isLoadingGVL ? (
                  <div className="p-4 text-center">
                    Loading Global Vendor List...
                  </div>
                ) : gvlError ? (
                  <div className={`p-4 my-4 rounded-md bg-red-100 dark:bg-red-900 ${errorColor}`}>
                    <p>Error loading GVL: {gvlError}</p>
                    <p className="mt-2">Note: Basic vendor info is still available</p>
                  </div>
                ) : (
                  <>
                    {/* Filter controls */}
                    <div className="mb-4 flex flex-wrap gap-3">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="consentFilter"
                          checked={vendorFilter.onlyWithConsent}
                          onChange={e => setVendorFilter({...vendorFilter, onlyWithConsent: e.target.checked})}
                          className="mr-2"
                        />
                        <label htmlFor="consentFilter">Show only vendors with consent</label>
                      </div>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="legIntFilter"
                          checked={vendorFilter.onlyWithLegitimateInterest}
                          onChange={e => setVendorFilter({...vendorFilter, onlyWithLegitimateInterest: e.target.checked})}
                          className="mr-2"
                        />
                        <label htmlFor="legIntFilter">Show only vendors with legitimate interest</label>
                      </div>
                    </div>
                    
                    {/* Vendor list */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr className={tableHeaderBg}>
                            <th className="px-4 py-2 text-left">ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-center">Consent</th>
                            <th className="px-4 py-2 text-center">Legitimate Interest</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {getFilteredVendorResults().map((v: any) => (
                            <tr key={v.id} className={tableRowBg}>
                              <td className="px-4 py-2">{v.id}</td>
                              <td className="px-4 py-2">{v.name}</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`inline-block w-4 h-4 rounded-full ${v.hasConsent ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span className={`inline-block w-4 h-4 rounded-full ${v.hasLegitimateInterest ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <Button
                                  onClick={() => handleViewVendorDetails(v)}
                                  variant="primary"
                                  isDarkMode={isDarkMode}
                                  size="sm"
                                  fullWidth
                                >
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
              
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
            <h2 className="text-xl font-semibold">{selectedVendor.name} (ID: {selectedVendor.id})</h2>
          </div>
          
          <div className="flex gap-4 mb-4">
            <div className={`inline-block px-3 py-1 rounded-full ${selectedVendor.hasConsent ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              Consent: {selectedVendor.hasConsent ? 'Yes' : 'No'}
            </div>
            
            <div className={`inline-block px-3 py-1 rounded-full ${selectedVendor.hasLegitimateInterest ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              Legitimate Interest: {selectedVendor.hasLegitimateInterest ? 'Yes' : 'No'}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <p><strong>ID:</strong> {selectedVendor.id}</p>
              <p><strong>Name:</strong> {selectedVendor.name}</p>
              <p><strong>Policy URL:</strong> {selectedVendor.policyUrl}</p>
              <p><strong>Consent:</strong> {selectedVendor.hasConsent ? 'Yes' : 'No'}</p>
              <p><strong>Legitimate Interest:</strong> {selectedVendor.hasLegitimateInterest ? 'Yes' : 'No'}</p>
              <p><strong>Purposes:</strong> {selectedVendor.purposes.map((p: any) => p.name).join(', ')}</p>
              <p><strong>Special Features:</strong> {selectedVendor.specialFeatures.map((f: any) => f.name).join(', ')}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Purposes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className={tableHeaderBg}>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-center">Consent</th>
                    <th className="px-4 py-2 text-center">LegInt</th>
                    <th className="px-4 py-2 text-center">Allowed</th>
                    <th className="px-4 py-2 text-center">LegInt Allowed</th>
                    <th className="px-4 py-2 text-center">Flexible</th>
                    <th className="px-4 py-2 text-left">Restriction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedVendor.purposes.map((purpose: any) => (
                    <tr key={purpose.id} className={tableRowBg}>
                      <td className="px-4 py-2">{purpose.id}</td>
                      <td className="px-4 py-2">{purpose.name}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block w-4 h-4 rounded-full ${purpose.hasConsent ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block w-4 h-4 rounded-full ${purpose.hasLegitimateInterest ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block w-4 h-4 rounded-full ${purpose.isAllowed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block w-4 h-4 rounded-full ${purpose.isLegitimateInterestAllowed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block w-4 h-4 rounded-full ${purpose.isFlexiblePurpose ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </td>
                      <td className="px-4 py-2">{purpose.restriction || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Special Features</h3>
            {selectedVendor.specialFeatures.length === 0 ? (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
                No special features
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className={tableHeaderBg}>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-center">Has Consent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedVendor.specialFeatures.map((f: any) => (
                      <tr key={f.id} className={tableRowBg}>
                        <td className="px-4 py-2">{f.id}</td>
                        <td className="px-4 py-2">{f.name}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-block w-4 h-4 rounded-full ${f.hasConsent ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {selectedVendor.specialPurposes && selectedVendor.specialPurposes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Special Purposes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className={tableHeaderBg}>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedVendor.specialPurposes.map((purpose: any) => (
                      <tr key={purpose.id} className={tableRowBg}>
                        <td className="px-4 py-2">{purpose.id}</td>
                        <td className="px-4 py-2">{purpose.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {selectedVendor.features && selectedVendor.features.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Features</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className={tableHeaderBg}>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedVendor.features.map((feature: any) => (
                      <tr key={feature.id} className={tableRowBg}>
                        <td className="px-4 py-2">{feature.id}</td>
                        <td className="px-4 py-2">{feature.name}</td>
                      </tr>
                    ))}
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