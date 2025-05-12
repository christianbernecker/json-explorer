import React, { useState, useEffect } from 'react';
import { decodeTCFString, purposeNames, generateBitRepresentation } from '../utils/tcf-decoder';
import { loadGVL, getVendors, GVLData, GVLVendor } from '../utils/gvl-loader';
import { analyzeTCFWithGVL, EnhancedVendorResult, filterPurposesByStatus } from '../utils/tcf-decoder-enhanced';

interface TCFDecoderProps {
  isDarkMode: boolean;
}

// Tabs für die Anzeige
type ActiveTab = 'decoder' | 'gvl-explorer' | 'vendor-details';

// Filter-Optionen für die Anzeige
interface VendorFilterOptions {
  onlyWithConsent: boolean;
  onlyWithLegitimateInterest: boolean;
  purposeFilter: number | null;
}

// Beispiel TCF-String
const EXAMPLE_TCF_STRING = "CPBZjR9PBZjR9AKAZADEBUCsAP_AAH_AAAqIHWtf_X_fb39j-_59_9t0eY1f9_7_v-0zjhfds-8Nyf_X_L8X42M7vF36pq4KuR4Eu3LBIQFlHOHUTUmw6okVrTPsak2Mr7NKJ7LEinMbe2dYGHtfn91TuZKY7_78_9fz3_-v_v___9f3r-3_3__59X---_e_V399zLv9__34HlAEmGpfABdiWODJtGlUKIEYVhIdAKACigGFoisIHVwU7K4CP0EDABAagIwIgQYgoxYBAAIBAEhEQEgB4IBEARAIAAQAqQEIACNgEFgBYGAQACgGhYgRQBCBIQZHBUcpgQESLRQT2VgCUXexphCGUUAJAAA.YAAAAAAAAAAA";

const TCFDecoder: React.FC<TCFDecoderProps> = ({ isDarkMode }) => {
  // State für den Decoder
  const [tcfString, setTcfString] = useState('');
  const [additionalVendorId, setAdditionalVendorId] = useState<number>(136);
  const [decodedVersion, setDecodedVersion] = useState<string>('');
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodedData, setDecodedData] = useState<any | null>(null);
  const [vendorResults, setVendorResults] = useState<EnhancedVendorResult[]>([]);
  const [showBitRepresentation, setShowBitRepresentation] = useState<boolean>(false);
  const [bitRepresentation, setBitRepresentation] = useState<string>('');
  
  // State für die GVL und Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('decoder');
  const [gvlData, setGvlData] = useState<GVLData | null>(null);
  const [isLoadingGVL, setIsLoadingGVL] = useState<boolean>(false);
  const [gvlError, setGvlError] = useState<string | null>(null);
  
  // State für GVL Explorer
  const [vendorSearchTerm, setVendorSearchTerm] = useState<string>('');
  const [vendorIdFilter, setVendorIdFilter] = useState<string>('');
  const [filteredVendors, setFilteredVendors] = useState<GVLVendor[]>([]);
  
  // State für erweiterte Funktionen
  const [selectedVendor, setSelectedVendor] = useState<EnhancedVendorResult | null>(null);
  const [vendorFilter, setVendorFilter] = useState<VendorFilterOptions>({
    onlyWithConsent: false,
    onlyWithLegitimateInterest: false,
    purposeFilter: null
  });
  
  // Farbschema basierend auf Dark-Mode
  const bgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const sectionBgColor = isDarkMode ? 'bg-slate-700' : 'bg-slate-50';
  const buttonColor = 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white';
  const errorColor = 'text-red-500';
  const inputBgColor = isDarkMode ? 'bg-slate-700' : 'bg-white';
  const inputBorderColor = isDarkMode ? 'border-slate-600' : 'border-slate-300';
  const highlightColor = isDarkMode ? 'bg-blue-900' : 'bg-blue-100';
  const exportBtnColor = 'bg-green-600 hover:bg-green-700 text-white';
  const secondaryBtnColor = isDarkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-200 hover:bg-gray-300';
  const secondaryTextColor = isDarkMode ? 'text-white' : 'text-gray-700';
  const bitTextColor = isDarkMode ? 'text-blue-300' : 'text-blue-600';
  const tabActiveBg = isDarkMode ? 'bg-blue-800' : 'bg-blue-600';
  const tabInactiveBg = isDarkMode ? 'bg-slate-700' : 'bg-slate-300';
  const tableHeaderBg = isDarkMode ? 'bg-slate-700' : 'bg-gray-100';
  const tableRowBg = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50';
  
  // GVL laden
  useEffect(() => {
    async function fetchGVL() {
      try {
        setIsLoadingGVL(true);
        setGvlError(null);
        const data = await loadGVL();
        setGvlData(data);
        if (activeTab === 'gvl-explorer') {
          updateFilteredVendors(data, vendorSearchTerm, vendorIdFilter);
        }
      } catch (error) {
        console.error('Fehler beim Laden der GVL:', error);
        setGvlError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden der GVL');
      } finally {
        setIsLoadingGVL(false);
      }
    }
    
    fetchGVL();
  }, [activeTab, vendorSearchTerm, vendorIdFilter]);
  
  // Gefilterte Vendors aktualisieren
  useEffect(() => {
    if (gvlData) {
      updateFilteredVendors(gvlData, vendorSearchTerm, vendorIdFilter);
    }
  }, [gvlData, vendorSearchTerm, vendorIdFilter]);
  
  // Filterfunktion für Vendors
  function updateFilteredVendors(data: GVLData, searchTerm: string, idFilter: string) {
    if (!data || !data.vendors) {
      setFilteredVendors([]);
      return;
    }
    
    let filtered = getVendors(data);
    
    // Nach Namen filtern
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(term)
      );
    }
    
    // Nach ID filtern
    if (idFilter) {
      const idNumber = parseInt(idFilter, 10);
      if (!isNaN(idNumber)) {
        // Suche nach exakter ID
        filtered = filtered.filter(v => v.id === idNumber);
      } else {
        // Fallback auf substring-Vergleich für nicht-numerische Eingaben
        filtered = filtered.filter(v => v.id.toString().includes(idFilter));
      }
    }
    
    setFilteredVendors(filtered);
  }
  
  // Beispiel-TCF-String laden
  const loadExample = () => {
    setTcfString(EXAMPLE_TCF_STRING);
  };

  // TCF String verarbeiten
  const handleDecode = async () => {
    try {
      setDecodeError(null);
      
      if (!tcfString.trim()) {
        setDecodeError('Bitte geben Sie einen TCF-String ein');
        return;
      }
      
      // String dekodieren
      const result = decodeTCFString(tcfString);
      setDecodedVersion(result.version);
      setDecodedData(result.coreData);
      
      // Bit-Darstellung generieren
      const bits = generateBitRepresentation(result.coreData.fullString);
      setBitRepresentation(bits);
      
      // Erweiterte Analyse mit GVL
      if (!gvlData) {
        // Falls GVL noch nicht geladen wurde, laden wir sie jetzt
        setIsLoadingGVL(true);
        try {
          const data = await loadGVL();
          setGvlData(data);
          const enhancedResult = analyzeTCFWithGVL(tcfString, data);
          setVendorResults(enhancedResult.vendorResults);
        } catch (error) {
          console.error('Fehler beim Laden der GVL:', error);
          setGvlError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden der GVL');
        } finally {
          setIsLoadingGVL(false);
        }
      } else {
        // GVL bereits geladen, führe erweiterte Analyse durch
        const enhancedResult = analyzeTCFWithGVL(tcfString, gvlData);
        setVendorResults(enhancedResult.vendorResults);
      }
      
    } catch (error) {
      console.error('Fehler beim Dekodieren:', error);
      setDecodeError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Dekodieren');
      setDecodedData(null);
      setVendorResults([]);
      setBitRepresentation('');
    }
  };

  // Filter für Vendors nach Consent/LegInt
  const getFilteredVendorResults = (): EnhancedVendorResult[] => {
    let filtered = [...vendorResults];
    
    if (vendorFilter.onlyWithConsent) {
      filtered = filtered.filter(v => v.hasConsent);
    }
    
    if (vendorFilter.onlyWithLegitimateInterest) {
      filtered = filtered.filter(v => v.hasLegitimateInterest);
    }
    
    if (vendorFilter.purposeFilter) {
      filtered = filtered.filter(v => 
        v.purposes.some(p => 
          p.id === vendorFilter.purposeFilter && 
          (p.hasConsent || p.hasLegitimateInterest)
        )
      );
    }
    
    return filtered;
  };

  // JSON-Export der Ergebnisse
  const handleExportJSON = () => {
    if (!decodedData) return;
    
    const exportData = {
      version: decodedVersion,
      created: new Date(decodedData.created * 100).toISOString(),
      lastUpdated: new Date(decodedData.lastUpdated * 100).toISOString(),
      cmpId: decodedData.cmpId,
      cmpVersion: decodedData.cmpVersion,
      consentScreen: decodedData.consentScreen,
      consentLanguage: decodedData.consentLanguage,
      vendorListVersion: decodedData.vendorListVersion,
      policyVersion: decodedData.policyVersion,
      isServiceSpecific: decodedData.isServiceSpecific,
      useNonStandardStacks: decodedData.useNonStandardStacks,
      specialFeatureOptIns: decodedData.specialFeatureOptIns,
      purposesConsent: decodedData.purposesConsent,
      purposesLITransparency: decodedData.purposesLITransparency,
      purposeOneTreatment: decodedData.purposeOneTreatment,
      publisherCC: decodedData.publisherCC,
      tcfPolicyVersion: decodedData.policyVersion,
      
      vendors: vendorResults.map(v => ({
        id: v.id,
        name: v.name,
        policyUrl: v.policyUrl,
        hasConsent: v.hasConsent,
        hasLegitimateInterest: v.hasLegitimateInterest,
        purposes: v.purposes.map(p => ({
          id: p.id,
          name: p.name,
          hasConsent: p.hasConsent,
          hasLegitimateInterest: p.hasLegitimateInterest,
          isAllowed: p.isAllowed,
          isLegitimateInterestAllowed: p.isLegitimateInterestAllowed,
          restriction: p.restriction
        })),
        specialFeatures: v.specialFeatures.map(f => ({
          id: f.id,
          name: f.name,
          hasConsent: f.hasConsent
        }))
      }))
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "tcf_decoded.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Tab-Wechsel-Handler
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };
  
  // Export der GVL als JSON
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
  
  // Vendor Details anzeigen
  const handleViewVendorDetails = (vendor: EnhancedVendorResult) => {
    setSelectedVendor(vendor);
    setActiveTab('vendor-details');
  };
  
  // Zurück zur Ergebnis-Übersicht
  const handleBackToResults = () => {
    setSelectedVendor(null);
    setActiveTab('decoder');
  };

  return (
    <div className={`${bgColor} ${textColor} p-6 rounded-lg shadow-lg w-full max-w-full mx-auto`}>
      <h1 className="text-2xl font-bold mb-4 flex items-center justify-between">
        <span>TCF String Decoder</span>
        <span className={`text-sm font-normal px-2 py-1 rounded ${highlightColor}`}>
          {decodedVersion ? `Erkannt: TCF v${decodedVersion}` : 'Unterstützt TCF v2.0 & v2.2'}
        </span>
      </h1>
      
      {/* Tab-Navigation */}
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
          {/* Eingabebereich */}
          <div className="mb-6">
            <label htmlFor="tcfInput" className="block font-semibold mb-2">TCF String eingeben:</label>
            <textarea 
              id="tcfInput"
              className={`w-full h-24 p-3 rounded-md ${inputBgColor} ${inputBorderColor} border text-sm font-mono mb-4`}
              placeholder="Fügen Sie Ihren TCF-String hier ein..."
              value={tcfString}
              onChange={(e) => setTcfString(e.target.value)}
            />
            
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label htmlFor="vendorIdInput" className="block font-semibold mb-2">
                  Zusätzliche Vendor ID:
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
                <button 
                  onClick={handleDecode}
                  className={`px-4 py-2 ${buttonColor} rounded-md shadow-md hover:shadow-lg transition-all duration-200`}
                >
                  TCF String dekodieren
                </button>
                
                <button 
                  onClick={loadExample}
                  className={`px-4 py-2 ${secondaryBtnColor} ${secondaryTextColor} rounded-md shadow-md hover:shadow-lg transition-all duration-200 text-sm`}
                >
                  Beispiel laden
                </button>
              </div>
            </div>
          </div>
          
          {/* Fehleranzeige */}
          {decodeError && (
            <div className={`p-4 my-4 rounded-md bg-red-100 dark:bg-red-900 ${errorColor}`}>
              <p>{decodeError}</p>
            </div>
          )}
          
          {/* Ergebnisbereich */}
          {decodedData && (
            <div id="results" className={`my-6 p-5 border ${borderColor} rounded-md`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Decodierungs-Ergebnisse</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowBitRepresentation(!showBitRepresentation)}
                    className={`px-3 py-1 ${secondaryBtnColor} ${secondaryTextColor} rounded-md text-sm shadow-sm`}
                  >
                    {showBitRepresentation ? 'Bits ausblenden' : 'Bits anzeigen'}
                  </button>
                  <button 
                    onClick={handleExportJSON}
                    className={`px-3 py-1 ${exportBtnColor} rounded-md text-sm shadow-sm`}
                  >
                    Als JSON exportieren
                  </button>
                </div>
              </div>
              
              {/* Bit-Darstellung */}
              {showBitRepresentation && (
                <div className={`p-3 mb-5 rounded-md overflow-x-auto border ${borderColor}`}>
                  <h3 className="text-sm font-semibold mb-2">Bit-Darstellung:</h3>
                  <pre className={`text-xs ${bitTextColor} font-mono whitespace-pre-wrap`}>{bitRepresentation}</pre>
                </div>
              )}
              
              {/* Allgemeine Informationen */}
              <div className={`p-4 mb-5 rounded-md ${sectionBgColor}`}>
                <h3 className="text-lg font-semibold mb-3">Allgemeine Informationen:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <p><strong>Version:</strong> {decodedVersion}</p>
                  <p><strong>Erstellt:</strong> {new Date(decodedData.created * 100).toLocaleString()}</p>
                  <p><strong>Zuletzt aktualisiert:</strong> {new Date(decodedData.lastUpdated * 100).toLocaleString()}</p>
                  <p><strong>CMP ID:</strong> {decodedData.cmpId}</p>
                  <p><strong>CMP Version:</strong> {decodedData.cmpVersion}</p>
                  <p><strong>Consent Screen:</strong> {decodedData.consentScreen}</p>
                  <p><strong>Consent Language:</strong> {decodedData.consentLanguage}</p>
                  <p><strong>Vendor List Version:</strong> {decodedData.vendorListVersion}</p>
                  <p><strong>Policy Version:</strong> {decodedData.policyVersion}</p>
                  <p><strong>Service-spezifisch:</strong> {decodedData.isServiceSpecific ? 'Ja' : 'Nein'}</p>
                  {decodedData.purposeOneTreatment !== undefined && (
                    <p><strong>Purpose One Treatment:</strong> {decodedData.purposeOneTreatment ? 'Ja' : 'Nein'}</p>
                  )}
                  {decodedData.publisherCC && (
                    <p><strong>Publisher Country Code:</strong> {decodedData.publisherCC}</p>
                  )}
                </div>
              </div>
              
              {/* Zusammenfassung der Zwecke */}
              <div className={`p-4 mb-5 rounded-md ${sectionBgColor}`}>
                <h3 className="text-lg font-semibold mb-3">Zwecke-Übersicht:</h3>
                
                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y ${borderColor}`}>
                    <thead>
                      <tr className={`${tableHeaderBg}`}>
                        <th className="px-3 py-2 text-left text-xs font-medium">ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium">Zweck</th>
                        <th className="px-3 py-2 text-center text-xs font-medium">Consent</th>
                        <th className="px-3 py-2 text-center text-xs font-medium">Leg. Interest</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${borderColor}`}>
                      {purposeNames.map((purpose, index) => (
                        <tr key={`purpose-${index + 1}`} className={`${tableRowBg}`}>
                          <td className="px-3 py-2 text-sm">{index + 1}</td>
                          <td className="px-3 py-2 text-sm">{purpose}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full 
                              ${decodedData.purposesConsent.includes(index + 1) 
                                ? 'bg-green-500 text-white' 
                                : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'}`}>
                              {decodedData.purposesConsent.includes(index + 1) ? '✓' : '✕'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full 
                              ${decodedData.purposesLITransparency.includes(index + 1) 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'}`}>
                              {decodedData.purposesLITransparency.includes(index + 1) ? '✓' : '✕'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Vendor-Filter */}
              <div className={`p-4 mb-5 rounded-md ${sectionBgColor}`}>
                <h3 className="text-lg font-semibold mb-3">Vendor-Filter:</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="consentFilter" 
                      checked={vendorFilter.onlyWithConsent}
                      onChange={() => setVendorFilter({
                        ...vendorFilter,
                        onlyWithConsent: !vendorFilter.onlyWithConsent
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="consentFilter">Nur Vendors mit Consent</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="legIntFilter" 
                      checked={vendorFilter.onlyWithLegitimateInterest}
                      onChange={() => setVendorFilter({
                        ...vendorFilter,
                        onlyWithLegitimateInterest: !vendorFilter.onlyWithLegitimateInterest
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="legIntFilter">Nur Vendors mit Legitimate Interest</label>
                  </div>
                  
                  <div>
                    <label htmlFor="purposeFilter" className="block text-sm mb-1">Filter nach Zweck:</label>
                    <select 
                      id="purposeFilter"
                      value={vendorFilter.purposeFilter || ''}
                      onChange={(e) => setVendorFilter({
                        ...vendorFilter,
                        purposeFilter: e.target.value ? Number(e.target.value) : null
                      })}
                      className={`p-2 rounded-md ${inputBgColor} ${inputBorderColor} border text-sm`}
                    >
                      <option value="">Alle Zwecke</option>
                      {purposeNames.map((purpose, index) => (
                        <option key={`purpose-filter-${index + 1}`} value={index + 1}>
                          Zweck {index + 1}: {purpose}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Vendor-Übersicht */}
              <h3 className="text-lg font-semibold mb-3">Vendors ({getFilteredVendorResults().length} von {vendorResults.length}):</h3>
              
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${borderColor}`}>
                  <thead>
                    <tr className={`${tableHeaderBg}`}>
                      <th className="px-3 py-2 text-left text-xs font-medium">ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium">Name</th>
                      <th className="px-3 py-2 text-center text-xs font-medium">Consent</th>
                      <th className="px-3 py-2 text-center text-xs font-medium">Leg. Interest</th>
                      <th className="px-3 py-2 text-left text-xs font-medium">Zwecke mit Consent</th>
                      <th className="px-3 py-2 text-left text-xs font-medium">Zwecke mit Leg. Int.</th>
                      <th className="px-3 py-2 text-center text-xs font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderColor}`}>
                    {getFilteredVendorResults().map((vendor) => (
                      <tr key={`vendor-${vendor.id}`} className={`${tableRowBg}`}>
                        <td className="px-3 py-2 text-sm">{vendor.id}</td>
                        <td className="px-3 py-2 text-sm font-medium">
                          {vendor.name}
                          {vendor.policyUrl && (
                            <a 
                              href={vendor.policyUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="ml-2 text-blue-500 hover:underline text-xs"
                            >
                              Policy
                            </a>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full 
                            ${vendor.hasConsent 
                              ? 'bg-green-500 text-white' 
                              : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'}`}>
                            {vendor.hasConsent ? '✓' : '✕'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full 
                            ${vendor.hasLegitimateInterest 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'}`}>
                            {vendor.hasLegitimateInterest ? '✓' : '✕'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {filterPurposesByStatus(vendor.purposes, 'consent').length > 0 
                            ? filterPurposesByStatus(vendor.purposes, 'consent')
                                .map(p => p.id)
                                .join(', ')
                            : '-'
                          }
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {filterPurposesByStatus(vendor.purposes, 'legitimate').length > 0 
                            ? filterPurposesByStatus(vendor.purposes, 'legitimate')
                                .map(p => p.id)
                                .join(', ')
                            : '-'
                          }
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleViewVendorDetails(vendor)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {getFilteredVendorResults().length === 0 && (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Keine Vendors mit den ausgewählten Filterkriterien gefunden.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!decodedData && !decodeError && (
            <div className={`p-4 border ${borderColor} rounded-md mt-6`}>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Ergebnisse werden hier angezeigt...
              </p>
            </div>
          )}
        </>
      )}
      
      {/* GVL Explorer Tab */}
      {activeTab === 'gvl-explorer' && (
        <div className="gvl-explorer">
          {isLoadingGVL ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Lade Global Vendor List...</span>
            </div>
          ) : gvlError ? (
            <div className={`p-4 my-4 rounded-md bg-red-100 dark:bg-red-900 ${errorColor}`}>
              <p>{gvlError}</p>
              <button 
                onClick={() => window.location.reload()}
                className={`mt-2 px-3 py-1 ${buttonColor} rounded-md text-sm`}
              >
                Erneut versuchen
              </button>
            </div>
          ) : gvlData ? (
            <>
              <div className="flex flex-wrap justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Global Vendor List</h2>
                  <p className="text-sm">
                    GVL Version: {gvlData.vendorListVersion} | 
                    Zuletzt aktualisiert: {new Date(gvlData.lastUpdated).toLocaleDateString()} | 
                    {gvlData.vendors && Object.keys(gvlData.vendors).length} Vendors
                  </p>
                </div>
                <button 
                  onClick={handleExportGVL}
                  className={`px-3 py-1 ${exportBtnColor} rounded-md text-sm shadow-sm`}
                >
                  GVL als JSON exportieren
                </button>
              </div>
              
              {/* Filter-Optionen */}
              <div className="mb-4 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[250px]">
                  <label htmlFor="vendorSearch" className="block text-sm font-medium mb-1">Vendor-Name suchen:</label>
                  <input
                    type="text"
                    id="vendorSearch"
                    className={`w-full p-2 rounded-md ${inputBgColor} ${inputBorderColor} border`}
                    placeholder="Google, Criteo, etc."
                    value={vendorSearchTerm}
                    onChange={(e) => setVendorSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <label htmlFor="vendorIdFilter" className="block text-sm font-medium mb-1">Vendor-ID:</label>
                  <input
                    type="text"
                    id="vendorIdFilter"
                    className={`w-full p-2 rounded-md ${inputBgColor} ${inputBorderColor} border`}
                    placeholder="z.B. 136"
                    value={vendorIdFilter}
                    onChange={(e) => setVendorIdFilter(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Vendor-Tabelle */}
              <div className={`border ${borderColor} rounded-md overflow-x-auto`}>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={`${tableHeaderBg}`}>
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Purposes</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Leg.Int.</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Special Features</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Policy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className={`${tableRowBg}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{vendor.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">{vendor.name}</td>
                        <td className="px-3 py-2 text-sm">
                          {vendor.purposes.length > 0 ? vendor.purposes.join(', ') : '-'}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {vendor.legIntPurposes.length > 0 ? vendor.legIntPurposes.join(', ') : '-'}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          {vendor.specialFeatures.length > 0 ? vendor.specialFeatures.join(', ') : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <a 
                            href={vendor.policyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Richtlinie
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredVendors.length === 0 && (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Keine Vendors gefunden.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
      
      {/* Vendor Details Tab */}
      {activeTab === 'vendor-details' && (
        <div className="vendor-details">
          {selectedVendor ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Vendor Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <p><strong>ID:</strong> {selectedVendor.id}</p>
                <p><strong>Name:</strong> {selectedVendor.name}</p>
                <p><strong>Policy URL:</strong> {selectedVendor.policyUrl}</p>
                <p><strong>Consent:</strong> {selectedVendor.hasConsent ? 'Ja' : 'Nein'}</p>
                <p><strong>Legitimate Interest:</strong> {selectedVendor.hasLegitimateInterest ? 'Ja' : 'Nein'}</p>
                <p><strong>Purposes:</strong> {selectedVendor.purposes.map(p => p.name).join(', ')}</p>
                <p><strong>Special Features:</strong> {selectedVendor.specialFeatures.map(f => f.name).join(', ')}</p>
              </div>
              <div className="mt-4">
                <button 
                  onClick={handleBackToResults}
                  className={`px-4 py-2 ${buttonColor} rounded-md text-sm`}
                >
                  Zurück zur Ergebnis-Übersicht
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Kein Vendor ausgewählt.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TCFDecoder; 