import React, { useState, useEffect } from 'react';
import Button from '../shared/Button';
import { decodeTCStringStrict, getProcessedTCData, ProcessedTCData } from '../../services/tcfService';
import { addHistoryItem } from '../../services/historyService';
import { ProcessedVendorInfo } from '../../services/types';

// Hilfsinterface für die Vendor-Ansicht in der Tabelle
interface VendorInfo {
  id: number;
  name?: string;
  consent: boolean;
  legitimateInterest: boolean;
}

interface TCFDecoderFormProps {
  isDarkMode: boolean;
  initialTcString?: string | null;
  onViewVendorDetails: (vendor: ProcessedVendorInfo) => void;
  onProcessTCData: (data: ProcessedTCData | null) => void;
}

/**
 * Komponente für das TCF-Decoder-Formular
 * 
 * Ermöglicht die Eingabe und Decodierung von TCF-Strings.
 * Zeigt die decodierten Daten an und ermöglicht die Exploration der Vendoren.
 */
const TCFDecoderForm: React.FC<TCFDecoderFormProps> = ({ 
  isDarkMode, 
  initialTcString, 
  onViewVendorDetails,
  onProcessTCData
}) => {
  // State
  const [tcfString, setTcfString] = useState(initialTcString || '');
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodeWarning, setDecodeWarning] = useState<string | null>(null);
  const [processedTcfData, setLocalProcessedTcfData] = useState<ProcessedTCData | null>(null);
  const [vendorListSearchTerm, setVendorListSearchTerm] = useState<string>('');

  // Styling
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const inputBorderColor = isDarkMode ? 'border-gray-600' : 'border-gray-300';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const errorColor = isDarkMode ? 'text-red-300' : 'text-red-600';
  const sectionBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const tableHeaderBg = isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-800';
  const tableRowBg = isDarkMode ? 'bg-gray-900' : 'bg-white';

  // Effekt, um initialTcString zu verarbeiten, wenn er sich ändert oder beim ersten Rendern
  useEffect(() => {
    if (initialTcString) {
      setTcfString(initialTcString);
      // Optional: Automatisch decodieren, wenn initialTcString vorhanden ist
      // handleDecode(initialTcString); // Übergebe initialTcString direkt
    }
  }, [initialTcString]);

  // Funktionen
  const clearInput = () => {
    setTcfString('');
    setLocalProcessedTcfData(null);
    onProcessTCData(null); // Auch die übergeordnete Komponente informieren
    setDecodeError(null);
    setDecodeWarning(null);
  };

  const addToHistory = (str: string) => {
    if (!str.trim()) return;
    addHistoryItem('tcf', str);
  };

  // TCF-String decodieren - akzeptiert optional einen String für den direkten Aufruf
  const handleDecode = async (stringToDecode?: string) => {
    const currentString = stringToDecode || tcfString;
    setDecodeError(null);
    setDecodeWarning(null);
    setLocalProcessedTcfData(null);
    onProcessTCData(null); // Informiere Parent über Reset

    if (!currentString.trim()) {
      setDecodeError('Bitte geben Sie einen TCF-String ein.');
      return;
    }

    try {
      const { tcModel, error } = await decodeTCStringStrict(currentString.trim());
      if (error || !tcModel) {
        setDecodeError(error || 'Unbekannter Fehler beim Decodieren des TCF-Strings');
        return;
      }
      
      const processed = await getProcessedTCData(tcModel);
      setLocalProcessedTcfData(processed);
      onProcessTCData(processed); // Daten an Parent-Komponente weitergeben
      
      addToHistory(currentString.trim());
    } catch (error) {
      console.error('Error decoding TCF string:', error);
      setDecodeError(error instanceof Error ? error.message : 'Unknown error decoding TCF string');
    }
  };

  // JSON der decodierten Daten exportieren
  const handleExportJSON = () => {
    if (!processedTcfData) return;
    
    try {
      const jsonStr = JSON.stringify(processedTcfData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tcf-decoded.json';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  // Finde den Original-Vendor aus dem ProcessedTCData
  const getOriginalVendor = (vendorId: number): ProcessedVendorInfo | undefined => {
    if (!processedTcfData) return undefined;
    return processedTcfData.keyVendorResults.find(vendor => vendor.id === vendorId);
  };

  // Erstelle Vendor-Info-Objekte aus dem ProcessedTCData
  const getVendorList = (): VendorInfo[] => {
    if (!processedTcfData) return [];
    
    // Extrahiere Vendors aus den keyVendorResults und füge sie in ein Format um
    return processedTcfData.keyVendorResults.map(vendor => ({
      id: vendor.id,
      name: vendor.name,
      consent: vendor.hasConsent,
      legitimateInterest: vendor.hasLegitimateInterest
    }));
  };

  // Filtere Vendoren basierend auf dem Suchbegriff
  const getFilteredVendors = () => {
    const vendors = getVendorList();
    const term = vendorListSearchTerm.toLowerCase();
    
    if (!term) return vendors;
    
    return vendors.filter(v => {
      const idMatch = v.id.toString().includes(term);
      const nameMatch = v.name?.toLowerCase().includes(term);
      return idMatch || nameMatch;
    });
  };

  // Funktion zum Behandeln von Klicks auf "Details"
  const handleViewVendorDetails = (vendorInfo: VendorInfo) => {
    const originalVendor = getOriginalVendor(vendorInfo.id);
    if (originalVendor) {
      onViewVendorDetails(originalVendor);
    }
  };

  return (
    <div className={`${textColor}`}>
      {/* Formular */}
      <div className={`p-4 mb-6 rounded-md border ${borderColor} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-bold mb-4">Decoder Tool</h2>
        
        <div className="mb-4">
          <textarea
            value={tcfString}
            onChange={(e) => setTcfString(e.target.value)}
            className={`w-full h-28 p-3 border ${inputBorderColor} ${inputBgColor} rounded-md`}
            placeholder="TCF String hier eingeben..."
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => handleDecode()}
            isDarkMode={isDarkMode}
            variant="primary"
          >
            Decodieren
          </Button>
          
          <Button 
            onClick={clearInput}
            isDarkMode={isDarkMode}
            variant="secondary"
          >
            Löschen
          </Button>
          
          {processedTcfData && (
            <Button 
              onClick={handleExportJSON}
              isDarkMode={isDarkMode}
              variant="export"
            >
              Als JSON exportieren
            </Button>
          )}
        </div>
        
        {decodeError && (
          <div className={`mt-4 p-3 rounded-md bg-red-900 bg-opacity-20 ${errorColor}`}>
            <p>Fehler: {decodeError}</p>
          </div>
        )}
        
        {decodeWarning && (
          <div className={`mt-4 p-3 rounded-md bg-yellow-700 bg-opacity-20 text-yellow-300`}>
            <p>Warnung: {decodeWarning}</p>
          </div>
        )}
      </div>
      
      {/* Ergebnisse */}
      {processedTcfData && (
        <div className={`mt-8 ${textColor}`}>
          <h2 className="text-2xl font-bold mb-4">Decodierungsergebnisse</h2>
          
          {/* Basis-Informationen */}
          <div className={`p-4 mb-6 rounded-md ${sectionBgColor}`}>
            <h3 className="text-lg font-semibold mb-2">Basis-Informationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>TCF Version:</strong> {processedTcfData.version}</p>
                <p><strong>Created:</strong> {processedTcfData.created}</p>
                <p><strong>Last Updated:</strong> {processedTcfData.lastUpdated}</p>
                <p><strong>CMP ID:</strong> {processedTcfData.cmpId}</p>
                <p><strong>CMP Version:</strong> {processedTcfData.cmpVersion}</p>
              </div>
              <div>
                <p><strong>Consent Screen:</strong> {processedTcfData.consentScreen}</p>
                <p><strong>Publisher Country:</strong> {processedTcfData.publisherCountryCode}</p>
                <p><strong>Use Non-Standard Texts:</strong> {processedTcfData.useNonStandardTexts ? 'Ja' : 'Nein'}</p>
                <p><strong>Special Feature Optins:</strong> {processedTcfData.globalSpecialFeatureOptIns?.length || 0}</p>
                <p><strong>Purpose Consents:</strong> {processedTcfData.globalPurposeConsents?.length || 0}</p>
              </div>
            </div>
          </div>
          
          {/* Global Purpose Consents */}
          <div className={`p-4 mb-6 rounded-md ${sectionBgColor}`}>
            <h3 className="text-lg font-semibold mb-2">Global Purpose Consents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {processedTcfData.globalPurposeConsents.map((purposeId) => (
                <div key={purposeId} className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${borderColor}`}>
                  <p className="font-medium">Purpose {purposeId}</p>
                  <div className="flex mt-1 gap-4">
                    <div className="text-green-500">Consent: Ja</div>
                    <div className={processedTcfData.globalPurposeLegitimateInterests.includes(purposeId) ? 'text-green-500' : 'text-red-500'}>
                      LI: {processedTcfData.globalPurposeLegitimateInterests.includes(purposeId) ? 'Ja' : 'Nein'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Vendor Consents */}
          <div className={`p-4 mb-6 rounded-md ${sectionBgColor}`}>
            <h3 className="text-lg font-semibold mb-2">Vendors</h3>
            <p className={`mb-4 ${secondaryTextColor}`}>
              {processedTcfData.keyVendorResults.length} Vendors gefunden.
            </p>
            
            <div className="mb-4">
              <input 
                type="text"
                placeholder="Suche nach Vendor-Name oder ID..."
                className={`w-full p-2 border ${inputBorderColor} ${inputBgColor} rounded-md`}
                value={vendorListSearchTerm}
                onChange={(e) => setVendorListSearchTerm(e.target.value)}
              />
            </div>
            
            <div className={`border ${borderColor} rounded-md overflow-hidden`}>
              <table className="min-w-full divide-y divide-gray-700">
                <thead className={tableHeaderBg}>
                  <tr>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Consent</th>
                    <th className="px-4 py-2 text-left">LI</th>
                    <th className="px-4 py-2 text-left">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {getFilteredVendors().length === 0 ? (
                    <tr className={tableRowBg}>
                      <td colSpan={5} className="px-4 py-3 text-center">
                        Keine Vendoren gefunden.
                      </td>
                    </tr>
                  ) : (
                    getFilteredVendors().map(vendor => (
                      <tr key={vendor.id} className={tableRowBg}>
                        <td className="px-4 py-2">{vendor.id}</td>
                        <td className="px-4 py-2">{vendor.name || 'Unbekannt'}</td>
                        <td className={`px-4 py-2 ${vendor.consent ? 'text-green-500' : 'text-red-500'}`}>
                          {vendor.consent ? 'Ja' : 'Nein'}
                        </td>
                        <td className={`px-4 py-2 ${vendor.legitimateInterest ? 'text-green-500' : 'text-red-500'}`}>
                          {vendor.legitimateInterest ? 'Ja' : 'Nein'}
                        </td>
                        <td className="px-4 py-2">
                          <Button 
                            onClick={() => handleViewVendorDetails(vendor)}
                            isDarkMode={isDarkMode}
                            size="sm"
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TCFDecoderForm; 