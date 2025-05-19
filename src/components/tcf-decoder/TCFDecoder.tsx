import React, { useState } from 'react';
import GVLExplorer from './GVLExplorer';
import VendorDetails from './VendorDetails';
import TCFDecoderForm from './TCFDecoderForm';
import TCFTabs, { ActiveTCFTab } from './TCFTabs';
import HistoryPanel from './HistoryPanel';
import { ProcessedTCData } from '../../services/tcfService';

interface TCFDecoderProps {
  isDarkMode: boolean;
  initialTcString?: string | null;
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
  initialTcString 
}) => {
  // State
  const [tcfString, setTcfString] = useState<string>(initialTcString || '');
  const [processedTcfData, setProcessedTcfData] = useState<ProcessedTCData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTCFTab>('decoder');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  // Neuer State für die Quelle des ausgewählten Vendors (GVL oder TCF)
  const [vendorSource, setVendorSource] = useState<VendorSource>('tcf');
  
  // Styling
  const textColor = isDarkMode ? 'text-gray-100' : 'text-gray-800';
  const bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
  
  // Event-Handler
  const handleTabChange = (tab: ActiveTCFTab) => {
    setActiveTab(tab);
  };
  
  const handleViewVendorDetails = (vendor: any, source: VendorSource = 'tcf') => {
    setSelectedVendor(vendor);
    setVendorSource(source);
    setActiveTab('vendor-details');
  };
  
  const handleBackFromVendorDetails = () => {
    setSelectedVendor(null);
    // Zurück zur letzten Tab basierend auf der Vendor-Quelle
    setActiveTab(vendorSource === 'gvl' ? 'gvl-explorer' : 'decoder');
  };
  
  const handleSelectTcfString = (tcfString: string) => {
    setTcfString(tcfString);
    setActiveTab('decoder');
  };
  
  // Renderfunktionen für die Tabs
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'decoder':
        return (
          <TCFDecoderForm 
            isDarkMode={isDarkMode}
            initialTcString={tcfString}
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
            tcfData={processedTcfData}
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
        return null;
    }
  };
  
  return (
    <div className={`tcf-decoder ${textColor} ${bgColor} p-4 rounded-md`}>
      <TCFTabs 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDarkMode={isDarkMode}
        showDetailsTab={Boolean(selectedVendor)}
        showHistoryTab={true}
      />
      
      {renderActiveTabContent()}
    </div>
  );
};

export default TCFDecoder; 