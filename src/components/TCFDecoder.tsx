import React, { useState } from 'react';
import { decodeTCFString, purposeNames, DEFAULT_VENDORS } from '../utils/tcf-decoder';

interface TCFDecoderProps {
  isDarkMode: boolean;
}

// Typ für ein decodiertes Vendor-Ergebnis
interface VendorResult {
  id: number;
  info: {
    hasConsent: boolean;
    hasLegitimateInterest: boolean;
    purposeConsents: number[];
    legitimateInterests: number[];
  };
  restrictions: {
    purposeId: number;
    restrictionType: string;
  }[];
}

const TCFDecoder: React.FC<TCFDecoderProps> = ({ isDarkMode }) => {
  const [tcfString, setTcfString] = useState('');
  const [additionalVendorId, setAdditionalVendorId] = useState<number>(136);
  const [decodedVersion, setDecodedVersion] = useState<string>('');
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodedData, setDecodedData] = useState<any | null>(null);
  const [vendorResults, setVendorResults] = useState<VendorResult[]>([]);
  
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

  // TCF String verarbeiten
  const handleDecode = () => {
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
      
      // Vendor-Ergebnisse verarbeiten
      const vendors = [...result.vendorResults];
      
      // Zusätzlichen Vendor hinzufügen, wenn er nicht bereits in den Standardvendoren enthalten ist
      if (additionalVendorId && !DEFAULT_VENDORS.includes(additionalVendorId)) {
        try {
          const vendorInfo = {
            id: additionalVendorId,
            info: {
              hasConsent: result.coreData.vendorConsent.includes(additionalVendorId),
              hasLegitimateInterest: result.coreData.vendorLI.includes(additionalVendorId),
              purposeConsents: result.coreData.purposesConsent,
              legitimateInterests: result.coreData.purposesLITransparency
            },
            restrictions: result.coreData.publisherRestrictions
              .filter((r: any) => r.vendors.includes(additionalVendorId))
              .map((r: any) => ({
                purposeId: r.purposeId,
                restrictionType: r.restrictionType
              }))
          };
          vendors.push(vendorInfo);
        } catch (err) {
          console.error('Fehler beim Verarbeiten des zusätzlichen Vendors:', err);
        }
      }
      
      setVendorResults(vendors);
    } catch (error) {
      console.error('Fehler beim Dekodieren:', error);
      setDecodeError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Dekodieren');
      setDecodedData(null);
      setVendorResults([]);
    }
  };

  // JSON-Export der Ergebnisse
  const handleExportJSON = () => {
    if (!decodedData) return;
    
    const exportData = {
      general: {
        version: decodedVersion,
        created: new Date(decodedData.created * 100).toISOString(),
        lastUpdated: new Date(decodedData.lastUpdated * 100).toISOString(),
        cmpId: decodedData.cmpId,
        cmpVersion: decodedData.cmpVersion,
        consentLanguage: decodedData.consentLanguage
      },
      vendors: vendorResults.map(vr => ({
        id: vr.id,
        hasConsent: vr.info.hasConsent,
        hasLegitimateInterest: vr.info.hasLegitimateInterest,
        purposeConsents: vr.info.purposeConsents,
        legitimateInterests: vr.info.legitimateInterests,
        restrictions: vr.restrictions
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

  return (
    <div className={`${bgColor} ${textColor} p-6 rounded-lg shadow-lg w-full max-w-full mx-auto`}>
      <h1 className="text-2xl font-bold mb-4 flex items-center justify-between">
        <span>TCF String Decoder</span>
        <span className={`text-sm font-normal px-2 py-1 rounded ${highlightColor}`}>
          {decodedVersion ? `Erkannt: TCF v${decodedVersion}` : 'Unterstützt TCF v2.0 & v2.2'}
        </span>
      </h1>
      
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
              Zusätzliche Vendor ID (Vendor 136 und 137 werden standardmäßig angezeigt):
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
          
          <div className="self-end">
            <button 
              onClick={handleDecode}
              className={`px-4 py-2 ${buttonColor} rounded-md shadow-md hover:shadow-lg transition-all duration-200`}
            >
              TCF String dekodieren
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
            <button 
              onClick={handleExportJSON}
              className={`px-3 py-1 ${exportBtnColor} rounded-md text-sm shadow-sm`}
            >
              Als JSON exportieren
            </button>
          </div>
          
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
            </div>
          </div>
          
          {/* Vendor-Informationen */}
          {vendorResults.map((vendor) => (
            <div key={vendor.id} className={`p-4 mb-4 border-t ${borderColor} mt-5`}>
              <h3 className="text-lg font-semibold mb-3">Vendor-Informationen (ID: {vendor.id})</h3>
              
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <p>
                  <strong>Zustimmung erteilt:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-md text-sm ${vendor.info.hasConsent ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                    {vendor.info.hasConsent ? 'Ja' : 'Nein'}
                  </span>
                </p>
                <p>
                  <strong>Berechtigtes Interesse:</strong>
                  <span className={`ml-2 px-2 py-1 rounded-md text-sm ${vendor.info.hasLegitimateInterest ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                    {vendor.info.hasLegitimateInterest ? 'Ja' : 'Nein'}
                  </span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Zwecke für Zustimmung */}
                <div>
                  <h4 className="font-semibold mb-2">Zwecke mit Zustimmung:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {vendor.info.purposeConsents.length === 0 ? (
                      <li className="text-sm">Keine Zwecke mit Zustimmung gefunden</li>
                    ) : (
                      vendor.info.purposeConsents.map(purpose => (
                        <li key={`consent-${purpose}`} className="text-sm">
                          Zweck {purpose}: {purpose <= purposeNames.length ? purposeNames[purpose-1] : `Purpose ${purpose}`}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                
                {/* Berechtigte Interessen */}
                <div>
                  <h4 className="font-semibold mb-2">Berechtigte Interessen:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {vendor.info.legitimateInterests.length === 0 ? (
                      <li className="text-sm">Keine berechtigten Interessen gefunden</li>
                    ) : (
                      vendor.info.legitimateInterests.map(purpose => (
                        <li key={`li-${purpose}`} className="text-sm">
                          Zweck {purpose}: {purpose <= purposeNames.length ? purposeNames[purpose-1] : `Purpose ${purpose}`}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Publisher Restrictions */}
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Publisher-Einschränkungen:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {vendor.restrictions.length === 0 ? (
                    <li className="text-sm">Keine Einschränkungen gefunden</li>
                  ) : (
                    vendor.restrictions.map((restriction, idx) => (
                      <li key={`restriction-${idx}`} className="text-sm">
                        Zweck {restriction.purposeId}: 
                        {restriction.purposeId <= purposeNames.length ? 
                          purposeNames[restriction.purposeId-1] : 
                          `Purpose ${restriction.purposeId}`} 
                        - <strong>{restriction.restrictionType}</strong>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!decodedData && !decodeError && (
        <div className={`p-4 border ${borderColor} rounded-md mt-6`}>
          <p className="text-center text-gray-500 dark:text-gray-400">
            Ergebnisse werden hier angezeigt...
          </p>
        </div>
      )}
    </div>
  );
};

export default TCFDecoder; 