import React from 'react';

export interface VastChainItem {
  uri: string;
  content: string | null;
  isLoading: boolean;
  error: string | null;
}

interface VastChainProps {
  chainItems: VastChainItem[];
  activeIndex: number;
  isDarkMode: boolean;
  onTabChange: (index: number) => void;
}

/**
 * Komponente zur Visualisierung der VAST-Wrapper-Kette
 * 
 * Zeigt eine Reihe von Tabs an, wobei jeder Tab einen VAST-Wrapper in
 * der Kette darstellt. Ermöglicht das Umschalten zwischen den Wrappern.
 */
const VastChain: React.FC<VastChainProps> = ({
  chainItems,
  activeIndex,
  isDarkMode,
  onTabChange
}) => {
  if (chainItems.length === 0) {
    return null;
  }

  return (
    <div className="vast-chain mb-4">
      <h3 className={`text-base font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        VAST Wrapper Chain ({chainItems.length})
      </h3>
      
      <div className={`flex flex-wrap gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {chainItems.map((item, index) => (
          <button
            key={index}
            onClick={() => onTabChange(index)}
            className={`px-3 py-1 rounded-md text-sm flex items-center gap-2 ${
              activeIndex === index
                ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                : `${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`
            }`}
          >
            {index === 0 ? 'Initial' : `Wrapper ${index}`}
            
            {item.isLoading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            
            {item.error && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
      
      {chainItems[activeIndex].error && (
        <div className={`mt-2 p-2 rounded-md ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} text-sm`}>
          Error: {chainItems[activeIndex].error}
        </div>
      )}
    </div>
  );
};

export default VastChain; 