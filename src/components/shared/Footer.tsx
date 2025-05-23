import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_VERSION } from '../../constants'; 

// For deployment script detection:
// APP_VERSION = 'v2.0.0' // Keep this comment for context

interface FooterProps {
  isDarkMode: boolean;
}

const Footer: React.FC<FooterProps> = ({ isDarkMode }) => {
  const currentYear = new Date().getFullYear();
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    // Diese Prüfung läuft nur im Browser, nicht während des Builds
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Prüfen, ob Hostname die Staging-Domain oder eine Vercel-Preview-URL enthält
      if (hostname.includes('staging.adtech-toolbox') || hostname.includes('vercel.app')) {
        setIsPreview(true);
      }
      // Optional: Lokale Entwicklung als Preview behandeln?
      // else if (hostname === 'localhost') {
      //   setIsPreview(true); 
      // }
    }
  }, []); // Leeres Array: Effekt nur einmal nach dem Mounten ausführen

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10">
      {/* Thinner blue line above the footer */}
      <div className="h-0.25 bg-gradient-to-r from-blue-500 to-indigo-600 w-full"></div>
      
      <div className={`${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'} py-4`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm mb-4 md:mb-0">
              © {currentYear} AdTech Toolbox | JSON Explorer | 
              {/* Zeige Preview-Version, wenn Hostname passt, sonst normale Version */}
              {isPreview ? (
                <span> Version v2.0.1-preview</span> 
              ) : (
                <span> Version {APP_VERSION}</span> 
              )}
            </div>
            <div className="flex space-x-4">
              <Link
                to="/legal/privacy"
                className={`text-sm ${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}
              >
                Privacy Policy
              </Link>
              <Link
                to="/legal/imprint"
                className={`text-sm ${isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}
              >
                Imprint
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 