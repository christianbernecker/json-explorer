import React from 'react';
import Button from '../shared/Button';
import { getVendorCombinedPurposes } from '../../services/tcfService';
import { ProcessedVendorInfo, ProcessedTCData, CombinedPurposesData } from '../../services/types';

interface VendorDetailsProps {
  vendor: ProcessedVendorInfo;
  isDarkMode: boolean;
  onBack: () => void;
  type: 'gvl' | 'tcf';
  tcfData?: ProcessedTCData;
}

/**
 * Komponente zur Detaildarstellung eines Vendors
 * 
 * Zeigt detaillierte Informationen zu einem Vendor an, entweder aus der GVL
 * oder mit den spezifischen Daten aus einem TCF-String.
 */
const VendorDetails: React.FC<VendorDetailsProps> = ({
  vendor,
  isDarkMode,
  onBack,
  type,
  tcfData
}) => {
  if (!vendor) return null;

  // Styling
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
  const sectionBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50';
  const highlightColor = isDarkMode ? 'text-yellow-300' : 'text-yellow-600';
  const secondaryTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';

  // Erstelle eine Struktur mit detaillierten Daten für die Anzeige 
  // Dies ersetzt die frühere Verwendung von combinedPurposesData
  const combinedPurposesData: CombinedPurposesData = {
    purposes: vendor.purposesConsent?.map((id: number) => ({
      id,
      name: `Purpose ${id}`,
      consent: vendor.hasConsent && vendor.purposesConsent.includes(id),
      li: vendor.hasLegitimateInterest && vendor.purposesLI.includes(id)
    })) || [],
    specialPurposes: vendor.specialPurposes?.map((id: number) => ({
      id,
      name: `Special Purpose ${id}`
    })) || [],
    features: vendor.features?.map((id: number) => ({
      id,
      name: `Feature ${id}`
    })) || [],
    specialFeatures: vendor.specialFeaturesOptIn?.map((id: number) => ({
      id,
      name: `Special Feature ${id}`,
      consent: true
    })) || []
  };

  return (
    <div className={`${textColor} ${bgColor} rounded-lg p-4`}>
      {/* Zurück-Button */}
      <div className="mb-4">
        <Button
          onClick={onBack}
          isDarkMode={isDarkMode}
          variant="primary"
        >
          ← Zurück zur Übersicht
        </Button>
      </div>
      
      {/* Vendor-Informationen */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {vendor.name} 
          <span className="ml-2 text-lg font-normal text-gray-400">(ID: {vendor.id})</span>
        </h2>
        
        {/* Vendor URL */}
        {vendor.policyUrl && (
          <a 
            href={vendor.policyUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline block mt-1"
          >
            {vendor.policyUrl}
          </a>
        )}
      </div>

      {/* Verschiedene Informationsabschnitte, abhängig vom Typ */}
      {type === 'gvl' ? (
        <>
          {/* GVL-spezifische Informationen */}
          <div className={`p-4 mb-4 ${sectionBgColor} rounded-md`}>
            <h3 className="text-lg font-semibold mb-2">Allgemeine Informationen</h3>
            <ul className="space-y-2">
              {vendor.deletedDate && (
                <li className="text-red-500">
                  <strong>Gelöscht am:</strong> {vendor.deletedDate}
                </li>
              )}
              <li><strong>Datenschutz-URL:</strong> {vendor.policyUrl || "Nicht angegeben"}</li>
              {vendor.usesCookies !== undefined && (
                <li><strong>Verwendet Cookies:</strong> {vendor.usesCookies ? "Ja" : "Nein"}</li>
              )}
              {vendor.cookieMaxAgeSeconds !== undefined && (
                <li>
                  <strong>Cookie-Laufzeit:</strong> {
                    vendor.cookieMaxAgeSeconds
                      ? `${Math.floor(vendor.cookieMaxAgeSeconds / 86400)} Tage`
                      : "Nicht angegeben"
                  }
                </li>
              )}
              {vendor.deviceStorageDisclosureUrl && (
                <li>
                  <strong>Speicheroffenlegung:</strong>{" "}
                  <a 
                    href={vendor.deviceStorageDisclosureUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Link
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Standard-Zwecke */}
          {vendor.purposes && Object.keys(vendor.purposes).length > 0 && (
            <div className={`p-4 mb-4 ${sectionBgColor} rounded-md`}>
              <h3 className="text-lg font-semibold mb-2">Standard-Zwecke</h3>
              <ul className="space-y-1">
                {Object.entries(vendor.purposes).map(([purposeId, purposeObj]: [string, any]) => (
                  <li key={purposeId}>
                    <div className="font-medium">
                      Zweck {purposeId}: {purposeObj.name || `Zweck ${purposeId}`}
                    </div>
                    {purposeObj.description && (
                      <div className={`text-sm ${secondaryTextColor} ml-4`}>
                        {purposeObj.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Special Purposes */}
          {vendor.specialPurposes && Object.keys(vendor.specialPurposes).length > 0 && (
            <div className={`p-4 mb-4 ${sectionBgColor} rounded-md`}>
              <h3 className="text-lg font-semibold mb-2">Spezielle Zwecke</h3>
              <ul className="space-y-1">
                {Object.entries(vendor.specialPurposes).map(([purposeId, purposeObj]: [string, any]) => (
                  <li key={purposeId}>
                    <div className="font-medium">
                      Spezieller Zweck {purposeId}: {purposeObj.name || `Spezieller Zweck ${purposeId}`}
                    </div>
                    {purposeObj.description && (
                      <div className={`text-sm ${secondaryTextColor} ml-4`}>
                        {purposeObj.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Features */}
          {vendor.features && Object.keys(vendor.features).length > 0 && (
            <div className={`p-4 mb-4 ${sectionBgColor} rounded-md`}>
              <h3 className="text-lg font-semibold mb-2">Features</h3>
              <ul className="space-y-1">
                {Object.entries(vendor.features).map(([featureId, featureObj]: [string, any]) => (
                  <li key={featureId}>
                    <div className="font-medium">
                      Feature {featureId}: {featureObj.name || `Feature ${featureId}`}
                    </div>
                    {featureObj.description && (
                      <div className={`text-sm ${secondaryTextColor} ml-4`}>
                        {featureObj.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Special Features */}
          {vendor.specialFeatures && Object.keys(vendor.specialFeatures).length > 0 && (
            <div className={`p-4 mb-4 ${sectionBgColor} rounded-md`}>
              <h3 className="text-lg font-semibold mb-2">Spezielle Features</h3>
              <ul className="space-y-1">
                {Object.entries(vendor.specialFeatures).map(([featureId, featureObj]: [string, any]) => (
                  <li key={featureId}>
                    <div className="font-medium">
                      Spezielles Feature {featureId}: {featureObj.name || `Spezielles Feature ${featureId}`}
                    </div>
                    {featureObj.description && (
                      <div className={`text-sm ${secondaryTextColor} ml-4`}>
                        {featureObj.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          {/* TCF-Daten-spezifische Informationen */}
          <div className={`p-4 mb-4 ${sectionBgColor} rounded-md`}>
            <h3 className="text-lg font-semibold mb-2">Consent Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-3 rounded-md ${vendor.hasConsent ? 'bg-green-800 bg-opacity-20' : 'bg-red-800 bg-opacity-20'}`}>
                <div className="font-medium">
                  Consent:
                  <span className={vendor.hasConsent ? 'text-green-500 ml-2' : 'text-red-500 ml-2'}>
                    {vendor.hasConsent ? 'Ja' : 'Nein'}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-md ${vendor.hasLegitimateInterest ? 'bg-green-800 bg-opacity-20' : 'bg-red-800 bg-opacity-20'}`}>
                <div className="font-medium">
                  Legitimate Interest:
                  <span className={vendor.hasLegitimateInterest ? 'text-green-500 ml-2' : 'text-red-500 ml-2'}>
                    {vendor.hasLegitimateInterest ? 'Ja' : 'Nein'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Combined Purposes Data */}
          {combinedPurposesData && combinedPurposesData.purposes.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-md mb-2">Zwecke</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {combinedPurposesData.purposes.map(purpose => (
                  <div key={purpose.id} className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${borderColor}`}>
                    <div className="font-medium mb-1">{purpose.id}. {purpose.name}</div>
                    <div className="flex space-x-3 text-sm">
                      <span className={purpose.consent ? 'text-green-500' : 'text-red-500'}>
                        Consent: {purpose.consent ? 'Ja' : 'Nein'}
                      </span>
                      <span className={purpose.li ? 'text-green-500' : 'text-red-500'}>
                        LI: {purpose.li ? 'Ja' : 'Nein'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Special Purposes */}
          {combinedPurposesData && combinedPurposesData.specialPurposes.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-md mb-2">Special Purposes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {combinedPurposesData.specialPurposes.map(purpose => (
                  <div key={purpose.id} className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${borderColor}`}>
                    <div className="font-medium mb-1">{purpose.id}. {purpose.name}</div>
                    <div className={`text-sm ${highlightColor}`}>
                      <span className="mr-1">Always Active (Legitimate Interest)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Features */}
          {combinedPurposesData && combinedPurposesData.features.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-md mb-2">Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {combinedPurposesData.features.map(feature => (
                  <div key={feature.id} className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${borderColor}`}>
                    <div className="font-medium mb-1">{feature.id}. {feature.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Special Features */}
          {combinedPurposesData && combinedPurposesData.specialFeatures.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-md mb-2">Special Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {combinedPurposesData.specialFeatures.map(feature => (
                  <div key={feature.id} className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${borderColor}`}>
                    <div className="font-medium mb-1">{feature.id}. {feature.name}</div>
                    <div className={`text-sm ${feature.consent ? 'text-green-500' : 'text-red-500'}`}>
                      Consent: {feature.consent ? 'Ja' : 'Nein'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Debug-Informationen */}
          {vendor.debugInfo && (
            <div className={`p-4 mb-4 ${sectionBgColor} rounded-md`}>
              <h3 className="text-lg font-semibold mb-2">Debug-Informationen</h3>
              <details>
                <summary className="cursor-pointer">Debug-Info anzeigen</summary>
                <pre className="mt-2 text-xs overflow-x-auto p-2 bg-gray-900 text-gray-300 rounded">
                  {JSON.stringify(vendor.debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VendorDetails; 