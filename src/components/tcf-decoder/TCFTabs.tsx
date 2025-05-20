import React from 'react';
import ModernTabs, { TabItem } from '../shared/ModernTabs';

export type ActiveTCFTab = 'decoder' | 'gvl-explorer' | 'vendor-details' | 'history';

interface TCFTabsProps {
  activeTab: ActiveTCFTab;
  onTabChange: (tab: ActiveTCFTab) => void;
  isDarkMode: boolean;
  showDetailsTab?: boolean;
  showHistoryTab?: boolean;
}

/**
 * Verbesserte Tab-Navigation für den TCF-Decoder mit ModernTabs
 * 
 * Ermöglicht das Umschalten zwischen den verschiedenen Bereichen
 * des TCF-Decoders: Decoder, GVL-Explorer, Vendor-Details und History.
 */
const TCFTabs: React.FC<TCFTabsProps> = ({
  activeTab,
  onTabChange,
  isDarkMode,
  showDetailsTab = false,
  showHistoryTab = false
}) => {
  // Icons für die Tabs
  const decoderIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
    </svg>
  );
  
  const gvlIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 6.375c0 2.692-4.03 4.875-9 4.875s-9-2.183-9-4.875 4.03-4.875 9-4.875 9 2.183 9 4.875z" />
      <path d="M12 12.75c-2.685 0-5.19-.586-7.078-1.609a8.283 8.283 0 001.944-1.266c.166-.123.337-.24.514-.352C8.734 10.489 10.315 10.875 12 10.875c1.685 0 3.266-.387 4.62-1.352.177.112.348.23.514.352a8.283 8.283 0 001.944 1.266c-1.888 1.023-4.393 1.609-7.078 1.609z" />
      <path d="M12 16.5c-2.685 0-5.19-.586-7.078-1.609a8.283 8.283 0 001.944-1.266c.166-.123.337-.24.514-.352C8.734 14.239 10.315 14.625 12 14.625c1.685 0 3.266-.387 4.62-1.352.177.112.348.23.514.352a8.283 8.283 0 001.944 1.266c-1.888 1.023-4.393 1.609-7.078 1.609z" />
      <path d="M12 20.25c-2.685 0-5.19-.586-7.078-1.609a8.283 8.283 0 001.944-1.266c.166-.123.337-.24.514-.352C8.734 17.989 10.315 18.375 12 18.375c1.685 0 3.266-.387 4.62-1.352.177.112.348.23.514.352a8.283 8.283 0 001.944 1.266c-1.888 1.023-4.393 1.609-7.078 1.609z" />
    </svg>
  );
  
  const vendorIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
    </svg>
  );
  
  const historyIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
    </svg>
  );

  // Tab-Konfiguration
  const tabs: TabItem[] = [
    { id: 'decoder', label: 'TCF Decoder', icon: decoderIcon },
    { id: 'gvl-explorer', label: 'GVL Explorer', icon: gvlIcon }
  ];
  
  // Füge Vendor-Details und History-Tabs hinzu, falls erforderlich
  if (showDetailsTab) {
    tabs.push({ id: 'vendor-details', label: 'Vendor Details', icon: vendorIcon });
  }
  
  if (showHistoryTab) {
    tabs.push({ id: 'history', label: 'Verlauf', icon: historyIcon });
  }

  // Handler für Tab-Änderungen
  const handleTabChange = (tabId: string) => {
    onTabChange(tabId as ActiveTCFTab);
  };

  return (
    <div className="mb-6">
      <ModernTabs
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={handleTabChange}
        isDarkMode={isDarkMode}
        size="medium"
      />
    </div>
  );
};

export default TCFTabs; 