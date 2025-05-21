import React, { useState, useEffect } from 'react';
import GVLExplorer from './GVLExplorer';
import VendorDetails from './VendorDetails';
import TCFDecoderForm from './TCFDecoderForm';
import HistoryPanel from './HistoryPanel';
import { ProcessedTCData } from '../../services/tcfService';
import { ProcessedVendorInfo } from '../../services/types';

// Definiere den Typ für die Tabs direkt hier
export type TcfContentTab = 'decoder' | 'gvl-explorer' | 'vendor-details' | 'history';

interface TCFDecoderProps {
  isDarkMode: boolean;
  initialTcString?: string | null;
  initialTab?: string; // Wird von TCFDecoderPage übergeben, basierend auf URL-Parametern
}

// Typ für die Herkunft eines Vendors
type VendorSource = 'gvl' | 'tcf';

/**
 * Hauptkomponente für den TCF-Decoder
 * 
 * Orchestriert die verschiedenen Subkomponenten und verwaltet den gemeinsamen State.
 * Ermöglicht das Decodieren von TCF-Strings und die Exploration von Vendor-Daten.
 */
const TCFDecoder: React.FC<TCFDecoderProps> = ({ 
  isDarkMode, 
  initialTcString,
  initialTab = 'decoder' // Standard-Tab ist 'decoder'
}) => {
  // State
  const [tcfString, setTcfString] = useState<string>(initialTcString || '');
  const [processedTcfData, setProcessedTcfData] = useState<ProcessedTCData | null>(null);
  const [activeTab, setActiveTab] = useState<TcfContentTab>(initialTab as TcfContentTab);
  const [selectedVendor, setSelectedVendor] = useState<ProcessedVendorInfo | null>(null);
  const [vendorSource, setVendorSource] = useState<VendorSource>('tcf');
  
  // Styling
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  
  // Debug-Logging für bessere Fehleranalyse
  useEffect(() => {
    console.log('TCFDecoder initialTab:', initialTab);
    console.log('TCFDecoder activeTab:', activeTab);
  }, [initialTab, activeTab]);
  
  // Effekt, um den activeTab zu aktualisieren, wenn sich initialTab ändert
  useEffect(() => {
    // Nur gültige Tab-Werte akzeptieren
    if (initialTab === 'decoder' || initialTab === 'gvl-explorer' || initialTab === 'history' || initialTab === 'vendor-details') {
      console.log('TCFDecoder updating activeTab to:', initialTab);
      setActiveTab(initialTab as TcfContentTab);
    }
  }, [initialTab]);
  
  // Event-Handler
  const handleViewVendorDetails = (vendor: ProcessedVendorInfo, source: VendorSource = 'tcf') => {
    setSelectedVendor(vendor);
    setVendorSource(source);
    setActiveTab('vendor-details');
  };
  
  const handleBackFromVendorDetails = () => {
    setSelectedVendor(null);
    // Zurück zum vorherigen Tab (decoder oder gvl-explorer), basierend auf vendorSource
    setActiveTab(vendorSource === 'gvl' ? 'gvl-explorer' : 'decoder');
  };
  
  const handleSelectTcfString = (tcfString: string) => {
    setTcfString(tcfString);
    setActiveTab('decoder');
  };
  
  const renderActiveTabContent = () => {
    console.log('renderActiveTabContent, activeTab =', activeTab);
    
    switch (activeTab) {
      case 'decoder':
        return (
          <TCFDecoderForm 
            isDarkMode={isDarkMode}
            initialTcString={tcfString}
            onProcessTCData={setProcessedTcfData}
            onViewVendorDetails={(vendor) => handleViewVendorDetails(vendor, 'tcf')}
          />
        );
        
      case 'gvl-explorer':
        return (
          <GVLExplorer 
            isDarkMode={isDarkMode}
            onViewVendorDetails={(vendor) => handleViewVendorDetails(vendor, 'gvl')}
          />
        );
        
      case 'vendor-details':
        if (!selectedVendor) {
          setActiveTab('decoder');
          return null;
        }
        return (
          <VendorDetails 
            vendor={selectedVendor}
            isDarkMode={isDarkMode}
            onBack={handleBackFromVendorDetails}
            type={vendorSource}
            tcfData={processedTcfData || undefined}
          />
        );
        
      case 'history':
        return (
          <HistoryPanel 
            isDarkMode={isDarkMode}
            onSelectTcfString={handleSelectTcfString}
          />
        );
        
      default:
        console.error('Unknown activeTab value:', activeTab);
        return (
          <TCFDecoderForm 
            isDarkMode={isDarkMode}
            initialTcString={tcfString}
            onProcessTCData={setProcessedTcfData}
            onViewVendorDetails={(vendor) => handleViewVendorDetails(vendor, 'tcf')}
          />
        );
    }
  };
  
  return (
    <div className={`tcf-decoder ${textColor} ${bgColor} p-4 rounded-md`}>
      {/* Keine zusätzliche Tab-Navigation - nur der Inhalt des aktiven Tabs wird angezeigt */}
      {renderActiveTabContent()}
    </div>
  );
};

export default TCFDecoder; 