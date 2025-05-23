import React, { useEffect, useState } from 'react';
import { APP_VERSION, APP_ENV } from '../../constants';

interface MaintenanceOverlayProps {
  isDarkMode: boolean;
  featureName: string; // Der Name der Funktion, die sich in Wartung befindet
  showOnEnv?: 'production' | 'staging' | 'all'; // Wo soll das Overlay angezeigt werden
}

/**
 * Ein Overlay-Component, das Wartungshinweise anzeigt
 * Erscheint nur in bestimmten Umgebungen und je nach Versionsnummer
 */
const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({ 
  isDarkMode, 
  featureName,
  showOnEnv = 'production' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Prüfe, ob das Overlay angezeigt werden soll, basierend auf der Version und Umgebung
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isProduction = 
        !hostname.includes('staging') && 
        !hostname.includes('localhost') && 
        !hostname.includes('vercel.app');
      const isStaging = 
        hostname.includes('staging') || 
        hostname.includes('vercel.app');
        
      // Zeige das Overlay nur in der angegebenen Umgebung
      if (
        (showOnEnv === 'production' && isProduction) ||
        (showOnEnv === 'staging' && isStaging) ||
        (showOnEnv === 'all')
      ) {
        // Für Version 2.0.0 in Produktion anzeigen
        if (APP_VERSION === 'v2.0.0' && isProduction) {
          setIsVisible(true);
        }
        // Nicht auf Staging/Preview/Dev für 2.0.1 anzeigen
        else if (APP_VERSION.includes('2.0.1') && !isProduction) {
          setIsVisible(false);
        }
      }
    }
  }, [showOnEnv]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className={`relative max-w-lg w-full mx-4 p-6 rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="flex items-center mb-4">
          <div className={`p-2 rounded-full mr-3 ${
            isDarkMode ? 'bg-blue-700' : 'bg-blue-100'
          }`}>
            <svg className={`w-6 h-6 ${
              isDarkMode ? 'text-blue-200' : 'text-blue-700'
            }`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold">Under Maintenance</h3>
        </div>
        
        <p className="mb-4">
          The <strong>{featureName}</strong> is currently being updated with new features and improvements. 
          We're working to provide you with an enhanced experience soon.
        </p>
        
        <p className="mb-4">
          During this time, some functionality might be limited or unavailable.
          We apologize for any inconvenience.
        </p>
        
        <div className="text-sm opacity-75 mt-4">
          You can continue to use other features of the application while we complete the updates.
        </div>
        
        <button
          onClick={() => setIsVisible(false)}
          className={`mt-6 px-4 py-2 rounded ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } transition-colors duration-200`}
        >
          Acknowledge and Continue
        </button>
      </div>
    </div>
  );
};

export default MaintenanceOverlay; 