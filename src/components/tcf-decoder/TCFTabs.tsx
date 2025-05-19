import React from 'react';

export type ActiveTCFTab = 'decoder' | 'gvl-explorer' | 'vendor-details' | 'history';

interface TCFTabsProps {
  activeTab: ActiveTCFTab;
  onTabChange: (tab: ActiveTCFTab) => void;
  isDarkMode: boolean;
  showDetailsTab?: boolean;
  showHistoryTab?: boolean;
}

/**
 * Komponente für die Tab-Navigation im TCF-Decoder
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
  // Styling
  const tabActiveBg = isDarkMode ? 'bg-blue-700' : 'bg-blue-500';
  const tabInactiveBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';
  const activeTextColor = 'text-white';
  const inactiveTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';

  // Tab-Konfiguration
  const tabs = [
    { id: 'decoder', label: 'TCF Decoder', always: true },
    { id: 'gvl-explorer', label: 'GVL Explorer', always: true },
    { id: 'vendor-details', label: 'Vendor Details', show: showDetailsTab },
    { id: 'history', label: 'History', show: showHistoryTab }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs
        .filter(tab => tab.always || tab.show)
        .map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as ActiveTCFTab)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium
              ${activeTab === tab.id ? `${tabActiveBg} ${activeTextColor}` : `${tabInactiveBg} ${inactiveTextColor} hover:bg-opacity-80`}
              transition-colors duration-200
            `}
          >
            {tab.label}
          </button>
        ))}
    </div>
  );
};

export default TCFTabs; 